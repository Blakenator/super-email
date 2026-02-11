import { useState, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faUserPlus,
  faEnvelope,
  faBuilding,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { Popover, OverlayTrigger, Button } from 'react-bootstrap';
import { gql } from '../../__generated__/gql';
import { ContactFormModal, type ContactFormData } from './ContactFormModal';
import {
  EmailLink,
  EmailChip,
  PopoverContent,
  PopoverHeader,
  Avatar,
  ContactName,
  PopoverBody,
  DetailRow,
  ActionRow,
} from './EmailContactCard.wrappers';

const SEARCH_CONTACTS_BY_EMAIL = gql(`
  query SearchContactByEmail($query: String!) {
    searchContacts(query: $query) {
      id
      email
      name
      firstName
      lastName
      company
      phone
      notes
    }
  }
`);

interface EmailContactCardProps {
  email: string;
  name?: string | null;
  showIcon?: boolean;
  enablePopover?: boolean;
  /** Render as a chip (default: true). Set to false for plain text display. */
  asChip?: boolean;
  className?: string;
}

export function EmailContactCard({
  email,
  name,
  showIcon = false,
  enablePopover = true,
  asChip = true,
  className,
}: EmailContactCardProps) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactModalData, setContactModalData] =
    useState<Partial<ContactFormData> | null>(null);

  const [searchContact, { data: contactData }] = useLazyQuery(
    SEARCH_CONTACTS_BY_EMAIL,
    {
      fetchPolicy: 'cache-first',
    },
  );

  const contact = contactData?.searchContacts?.find(
    (c) => c.email != null && c.email.toLowerCase() === email.toLowerCase(),
  );

  const handlePopoverEnter = useCallback(() => {
    if (enablePopover && !contactData) {
      void searchContact({ variables: { query: email } });
    }
  }, [enablePopover, contactData, searchContact, email]);

  const handleAddContact = useCallback(() => {
    setContactModalData({
      email,
      name: name || undefined,
      firstName: name?.split(' ')[0] || undefined,
      lastName: name?.split(' ').slice(1).join(' ') || undefined,
    });
    setShowContactModal(true);
  }, [email, name]);

  const displayName = name || contact?.name || email;
  const isContact = !!contact;

  // Plain text version without popover
  if (!enablePopover) {
    if (asChip) {
      return (
        <EmailChip
          $isClickable={false}
          $isContact={isContact}
          className={className}
        >
          {(showIcon || isContact) && (
            <FontAwesomeIcon icon={faUser} className="chip-icon" />
          )}
          {displayName}
        </EmailChip>
      );
    }
    return (
      <EmailLink
        $isClickable={false}
        $isContact={isContact}
        className={className}
      >
        {showIcon && isContact && (
          <FontAwesomeIcon icon={faUser} className="contact-icon" />
        )}
        {displayName}
      </EmailLink>
    );
  }

  const popover = (
    <Popover id={`contact-popover-${email}`}>
      <PopoverContent>
        <PopoverHeader>
          <Avatar>
            <FontAwesomeIcon icon={faUser} />
          </Avatar>
          <ContactName>
            {contact?.name ||
              [contact?.firstName, contact?.lastName]
                .filter(Boolean)
                .join(' ') ||
              name ||
              'Unknown Contact'}
          </ContactName>
        </PopoverHeader>
        <PopoverBody>
          <DetailRow>
            <FontAwesomeIcon icon={faEnvelope} className="icon" />
            <span>{email}</span>
          </DetailRow>
          {contact?.company && (
            <DetailRow>
              <FontAwesomeIcon icon={faBuilding} className="icon" />
              <span>{contact.company}</span>
            </DetailRow>
          )}
          {contact?.phone && (
            <DetailRow>
              <FontAwesomeIcon icon={faPhone} className="icon" />
              <span>{contact.phone}</span>
            </DetailRow>
          )}
          <ActionRow>
            <Button
              variant="outline-primary"
              size="sm"
              href={`mailto:${email}`}
              as="a"
            >
              <FontAwesomeIcon icon={faEnvelope} className="me-1" />
              Email
            </Button>
            {!contact && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleAddContact}
              >
                <FontAwesomeIcon icon={faUserPlus} className="me-1" />
                Add Contact
              </Button>
            )}
          </ActionRow>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );

  const Wrapper = asChip ? EmailChip : EmailLink;

  return (
    <>
      <OverlayTrigger
        trigger="click"
        placement="bottom"
        overlay={popover}
        rootClose
        onEnter={handlePopoverEnter}
      >
        <Wrapper $isClickable $isContact={isContact} className={className}>
          {(showIcon || (asChip && isContact)) && (
            <FontAwesomeIcon
              icon={faUser}
              className={asChip ? 'chip-icon' : 'contact-icon'}
            />
          )}
          {displayName}
        </Wrapper>
      </OverlayTrigger>

      <ContactFormModal
        show={showContactModal}
        onHide={() => setShowContactModal(false)}
        initialData={contactModalData ?? undefined}
        emailToAdd={email}
        onSuccess={() => {
          setShowContactModal(false);
          // Refetch contact data
          void searchContact({ variables: { query: email } });
        }}
      />
    </>
  );
}
