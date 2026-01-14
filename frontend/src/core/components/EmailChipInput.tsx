import { useState, useRef, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTimes,
  faUser,
  faUserPlus,
  faEnvelope,
  faBuilding,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { Popover, OverlayTrigger, Button } from 'react-bootstrap';
import { gql } from '../../__generated__/gql';
import { ContactFormModal } from './ContactFormModal';
import {
  Container,
  Chip,
  ChipLabel,
  ChipRemove,
  Input,
  DropdownStyled,
  DropdownItem,
  ContactInfo,
  ContactName,
  ContactEmail,
  PopoverCard,
  PopoverHeader,
  PopoverAvatar,
  PopoverTitle,
  PopoverSubtitle,
  PopoverDetail,
  PopoverActions,
  ChipClickable,
} from './EmailChipInput.wrappers';

const SEARCH_CONTACTS = gql(`
  query SearchContactsForChipInput($query: String!) {
    searchContacts(query: $query) {
      id
      email
      name
      firstName
      lastName
      company
      phone
    }
  }
`);

interface EmailChip {
  value: string;
  label: string;
  isContact: boolean;
  contactId?: string;
}

interface EmailChipInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function EmailChipInput({
  value,
  onChange,
  placeholder = 'Enter email addresses...',
  disabled = false,
}: EmailChipInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [chips, setChips] = useState<EmailChip[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [addContactEmail, setAddContactEmail] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchContacts, { data: searchData }] = useLazyQuery(SEARCH_CONTACTS);

  // Find contact info for chips by searching for exact email matches
  const getContactForEmail = useCallback(
    (email: string) => {
      return searchData?.searchContacts?.find(
        (c) => c.email.toLowerCase() === email.toLowerCase(),
      );
    },
    [searchData],
  );

  const handleAddContactClick = (email: string) => {
    setAddContactEmail(email);
    setShowContactModal(true);
  };

  // Parse initial value into chips
  useEffect(() => {
    if (value) {
      const emails = value.split(',').map((e) => e.trim()).filter(Boolean);
      const newChips = emails.map((email) => ({
        value: email,
        label: email,
        isContact: false,
      }));
      setChips(newChips);
    } else {
      setChips([]);
    }
  }, [value]);

  // Sync chips back to value
  const syncValue = useCallback(
    (newChips: EmailChip[]) => {
      const newValue = newChips.map((c) => c.value).join(', ');
      onChange(newValue);
    },
    [onChange],
  );

  // Search contacts as user types
  useEffect(() => {
    if (inputValue.length >= 2) {
      searchContacts({ variables: { query: inputValue } });
      setShowDropdown(true);
      setHighlightedIndex(0);
    } else {
      setShowDropdown(false);
    }
  }, [inputValue, searchContacts]);

  const suggestions = searchData?.searchContacts ?? [];

  const addChip = useCallback(
    (chip: EmailChip) => {
      // Check if already exists
      if (chips.some((c) => c.value.toLowerCase() === chip.value.toLowerCase())) {
        return;
      }

      const newChips = [...chips, chip];
      setChips(newChips);
      syncValue(newChips);
      setInputValue('');
      setShowDropdown(false);
    },
    [chips, syncValue],
  );

  const removeChip = useCallback(
    (index: number) => {
      const newChips = chips.filter((_, i) => i !== index);
      setChips(newChips);
      syncValue(newChips);
    },
    [chips, syncValue],
  );

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
      e.preventDefault();
      
      if (showDropdown && suggestions.length > 0) {
        const selected = suggestions[highlightedIndex];
        if (selected) {
          addChip({
            value: selected.email,
            label: selected.name || selected.email,
            isContact: true,
            contactId: selected.id,
          });
          return;
        }
      }

      if (inputValue.trim()) {
        // Validate as email
        const email = inputValue.trim();
        if (email.includes('@')) {
          addChip({
            value: email,
            label: email,
            isContact: false,
          });
        }
      }
    } else if (e.key === 'Backspace' && !inputValue && chips.length > 0) {
      removeChip(chips.length - 1);
    } else if (e.key === 'ArrowDown' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp' && showDropdown) {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSuggestionClick = (contact: typeof suggestions[0]) => {
    addChip({
      value: contact.email,
      label: contact.name || contact.email,
      isContact: true,
      contactId: contact.id,
    });
  };

  // Auto-commit pending input on blur
  const handleInputBlur = () => {
    if (inputValue.trim()) {
      const email = inputValue.trim();
      // Simple validation - just need @ for email
      if (email.includes('@')) {
        addChip({
          value: email,
          label: email,
          isContact: false,
        });
      }
    }
    // Delay hiding dropdown to allow clicking on suggestions
    setTimeout(() => setShowDropdown(false), 150);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderChipPopover = (chip: EmailChip) => {
    const contact = chip.isContact
      ? suggestions.find((c) => c.id === chip.contactId)
      : getContactForEmail(chip.value);

    return (
      <Popover id={`chip-popover-${chip.value}`}>
        <PopoverCard>
          <PopoverHeader>
            <PopoverAvatar>
              <FontAwesomeIcon icon={faUser} />
            </PopoverAvatar>
            <div>
              <PopoverTitle>
                {contact?.name ||
                  [contact?.firstName, contact?.lastName]
                    .filter(Boolean)
                    .join(' ') ||
                  chip.label}
              </PopoverTitle>
              <PopoverSubtitle>{chip.value}</PopoverSubtitle>
            </div>
          </PopoverHeader>

          <PopoverDetail>
            <FontAwesomeIcon icon={faEnvelope} />
            <span>{chip.value}</span>
          </PopoverDetail>

          {contact?.company && (
            <PopoverDetail>
              <FontAwesomeIcon icon={faBuilding} />
              <span>{contact.company}</span>
            </PopoverDetail>
          )}

          {contact?.phone && (
            <PopoverDetail>
              <FontAwesomeIcon icon={faPhone} />
              <span>{contact.phone}</span>
            </PopoverDetail>
          )}

          {!contact && (
            <PopoverActions>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddContactClick(chip.value);
                }}
              >
                <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                Add to Contacts
              </Button>
            </PopoverActions>
          )}
        </PopoverCard>
      </Popover>
    );
  };

  return (
    <>
      <Container
        ref={containerRef}
        onClick={() => inputRef.current?.focus()}
      >
        {chips.map((chip, index) => (
          <Chip key={index} $isContact={chip.isContact}>
            <OverlayTrigger
              trigger="click"
              placement="bottom"
              overlay={renderChipPopover(chip)}
              rootClose
            >
              <ChipClickable
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                {chip.isContact && <FontAwesomeIcon icon={faUser} />}
                <ChipLabel title={chip.value}>{chip.label}</ChipLabel>
              </ChipClickable>
            </OverlayTrigger>
            {!disabled && (
              <ChipRemove
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(index);
                }}
              >
                <FontAwesomeIcon icon={faTimes} />
              </ChipRemove>
            )}
          </Chip>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          placeholder={chips.length === 0 ? placeholder : ''}
          disabled={disabled}
        />
        {showDropdown && suggestions.length > 0 && (
          <DropdownStyled>
            {suggestions.map((contact, index) => (
              <DropdownItem
                key={contact.id}
                $isHighlighted={index === highlightedIndex}
                onClick={() => handleSuggestionClick(contact)}
              >
                <FontAwesomeIcon icon={faUser} />
                <ContactInfo>
                  <ContactName>
                    {contact.name ||
                      [contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(' ') ||
                      contact.email}
                  </ContactName>
                  {contact.name && <ContactEmail>{contact.email}</ContactEmail>}
                </ContactInfo>
              </DropdownItem>
            ))}
          </DropdownStyled>
        )}
      </Container>

      <ContactFormModal
        show={showContactModal}
        onHide={() => setShowContactModal(false)}
        initialData={{
          email: addContactEmail,
          name: '',
          firstName: '',
          lastName: '',
          company: '',
          phone: '',
          notes: '',
        }}
        onSuccess={() => {
          setShowContactModal(false);
          // Re-search to update contact info
          if (addContactEmail) {
            searchContacts({ variables: { query: addContactEmail } });
          }
        }}
      />
    </>
  );
}
