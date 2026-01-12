import { useState, useRef, useCallback, useEffect } from 'react';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import styled from 'styled-components';
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

const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xs};
  min-height: 42px;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  cursor: text;
  position: relative;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

const Chip = styled.div<{ $isContact: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 2px 8px;
  background: ${({ $isContact, theme }) =>
    $isContact ? theme.colors.primary + '15' : theme.colors.background};
  border: 1px solid
    ${({ $isContact, theme }) =>
      $isContact ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  .svg-inline--fa {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

const ChipLabel = styled.span`
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChipRemove = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Input = styled.input`
  border: none;
  outline: none;
  flex: 1;
  min-width: 120px;
  padding: 4px 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const DropdownStyled = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

const DropdownItem = styled.div<{ $isHighlighted: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  background: ${({ $isHighlighted, theme }) =>
    $isHighlighted ? theme.colors.backgroundHover : 'transparent'};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ContactName = styled.span`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ContactEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PopoverCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  min-width: 250px;
`;

const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PopoverAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
`;

const PopoverTitle = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const PopoverSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PopoverDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  .svg-inline--fa {
    width: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const PopoverActions = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const ChipClickable = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;

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
