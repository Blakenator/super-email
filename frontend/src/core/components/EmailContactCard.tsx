import { useState, useCallback } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faUserPlus,
  faEnvelope,
  faBuilding,
  faPhone,
} from '@fortawesome/free-solid-svg-icons';
import { Popover, OverlayTrigger, Button, Badge } from 'react-bootstrap';
import { gql } from '../../__generated__/gql';
import { ContactFormModal } from './ContactFormModal';

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

const EmailLink = styled.span<{ $isClickable?: boolean; $isContact?: boolean }>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
  color: ${({ theme, $isContact }) =>
    $isContact ? theme.colors.primary : theme.colors.textPrimary};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    text-decoration: ${({ $isClickable }) =>
      $isClickable ? 'underline' : 'none'};
  }

  .contact-icon {
    font-size: 0.75em;
    opacity: 0.7;
  }
`;

const EmailChip = styled.span<{ $isClickable?: boolean; $isContact?: boolean }>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme, $isContact }) =>
    $isContact ? `${theme.colors.primary}15` : theme.colors.background};
  border: 1px solid
    ${({ theme, $isContact }) =>
      $isContact ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isContact }) =>
    $isContact ? theme.colors.primary : theme.colors.textPrimary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme, $isContact }) =>
      $isContact ? `${theme.colors.primary}25` : theme.colors.backgroundHover};
  }

  .chip-icon {
    font-size: 0.75em;
  }
`;

const PopoverContent = styled.div`
  min-width: 250px;
`;

const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 4px 4px 0 0;
  margin: -0.5rem -0.5rem 0.5rem -0.5rem;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const PopoverBody = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  .icon {
    width: 16px;
    text-align: center;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

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
  const [contactModalData, setContactModalData] = useState<any>(null);

  const [searchContact, { data: contactData }] = useLazyQuery(
    SEARCH_CONTACTS_BY_EMAIL,
    {
      fetchPolicy: 'cache-first',
    },
  );

  const contact = contactData?.searchContacts?.find(
    (c) => c.email.toLowerCase() === email.toLowerCase(),
  );

  const handlePopoverEnter = useCallback(() => {
    if (enablePopover && !contactData) {
      searchContact({ variables: { query: email } });
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
        <EmailChip $isClickable={false} $isContact={isContact} className={className}>
          {(showIcon || isContact) && (
            <FontAwesomeIcon icon={faUser} className="chip-icon" />
          )}
          {displayName}
        </EmailChip>
      );
    }
    return (
      <EmailLink $isClickable={false} $isContact={isContact} className={className}>
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
              [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') ||
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
              <Button variant="outline-secondary" size="sm" onClick={handleAddContact}>
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
        initialData={contactModalData}
        emailToAdd={email}
        onSuccess={() => {
          setShowContactModal(false);
          // Refetch contact data
          searchContact({ variables: { query: email } });
        }}
      />
    </>
  );
}
