import { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Tabs,
  Tab,
  ListGroup,
  Spinner,
  Badge,
} from 'react-bootstrap';
import { useMutation, useQuery } from '@apollo/client/react';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
import { gql } from '../../__generated__/gql';
import { GET_CONTACTS_QUERY as CONTACTS_PAGE_QUERY } from '../../pages/contacts/queries';

// Use the same query for fetching contacts in the modal
const GET_CONTACTS_QUERY = gql(`
  query GetContactsForModal {
    getContacts {
      id
      email
      emails {
        id
        email
        isPrimary
        label
      }
      name
      firstName
      lastName
      company
    }
  }
`);

const CREATE_CONTACT_MUTATION = gql(`
  mutation CreateContactFromModal($input: CreateContactInput!) {
    createContact(input: $input) {
      id
      email
      name
      emails {
        id
        email
        isPrimary
      }
    }
  }
`);

const UPDATE_CONTACT_MUTATION = gql(`
  mutation UpdateContactFromModal($input: UpdateContactInput!) {
    updateContact(input: $input) {
      id
      email
      name
      emails {
        id
        email
        isPrimary
      }
    }
  }
`);

const ADD_EMAIL_TO_CONTACT_MUTATION = gql(`
  mutation AddEmailToContact($input: AddEmailToContactInput!) {
    addEmailToContact(input: $input) {
      id
      email
      name
      emails {
        id
        email
        isPrimary
      }
    }
  }
`);

const SearchInput = styled.div`
  position: relative;
  margin-bottom: 1rem;

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    padding-left: 36px;
  }
`;

const ContactListItem = styled(ListGroup.Item)<{ $selected?: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;

  ${({ $selected, theme }) =>
    $selected &&
    `
    background: ${theme.colors.primary}10;
    border-color: ${theme.colors.primary};
  `}

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const ContactAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactEmails = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const NoContacts = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export interface ContactFormData {
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  notes: string;
}

const emptyFormData: ContactFormData = {
  email: '',
  name: '',
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  notes: '',
};

interface ContactFormModalProps {
  show: boolean;
  onHide: () => void;
  editingContactId?: string;
  initialData?: Partial<ContactFormData>;
  onSuccess?: (contact: { id: string; email?: string | null; name?: string | null }) => void;
  refetchQueries?: any[];
  /** If provided, shows add to existing tab first and uses this as the email to add */
  emailToAdd?: string;
}

export function ContactFormModal({
  show,
  onHide,
  editingContactId,
  initialData,
  onSuccess,
  refetchQueries = [],
  emailToAdd,
}: ContactFormModalProps) {
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(
    emailToAdd ? 'existing' : 'new',
  );
  const [formData, setFormData] = useState<ContactFormData>({
    ...emptyFormData,
    ...initialData,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Fetch contacts for the "Add to Existing" tab
  const { data: contactsData, loading: contactsLoading } = useQuery(
    GET_CONTACTS_QUERY,
    {
      skip: !show,
    },
  );

  const contacts = contactsData?.getContacts ?? [];

  // Filter contacts based on search
  const filteredContacts = contacts.filter((contact) => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      contact.name?.toLowerCase().includes(query) ||
      contact.firstName?.toLowerCase().includes(query) ||
      contact.lastName?.toLowerCase().includes(query) ||
      contact.email?.toLowerCase().includes(query) ||
      contact.emails?.some((e) => e.email.toLowerCase().includes(query)) ||
      contact.company?.toLowerCase().includes(query)
    );
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (show) {
      setFormData({
        ...emptyFormData,
        ...initialData,
        email: emailToAdd || initialData?.email || '',
      });
      setActiveTab(emailToAdd ? 'existing' : 'new');
      setSearchQuery('');
      setSelectedContactId(null);
    }
  }, [show, initialData, emailToAdd]);

  // Refetch both the modal query and the main contacts page query
  const allRefetchQueries = [
    ...refetchQueries,
    { query: GET_CONTACTS_QUERY },
    { query: CONTACTS_PAGE_QUERY },
  ];

  const [createContact, { loading: creating }] = useMutation(
    CREATE_CONTACT_MUTATION,
    {
      onCompleted: (data) => {
        toast.success('Contact created!');
        onHide();
        onSuccess?.(data.createContact);
      },
      onError: (err) => toast.error(`Failed to create contact: ${err.message}`),
      refetchQueries: allRefetchQueries,
    },
  );

  const [updateContact, { loading: updating }] = useMutation(
    UPDATE_CONTACT_MUTATION,
    {
      onCompleted: (data) => {
        toast.success('Contact updated!');
        onHide();
        onSuccess?.(data.updateContact);
      },
      onError: (err) => toast.error(`Failed to update contact: ${err.message}`),
      refetchQueries: allRefetchQueries,
    },
  );

  const [addEmailToContact, { loading: addingEmail }] = useMutation(
    ADD_EMAIL_TO_CONTACT_MUTATION,
    {
      onCompleted: (data) => {
        toast.success('Email added to contact!');
        onHide();
        onSuccess?.(data.addEmailToContact);
      },
      onError: (err) => toast.error(`Failed to add email: ${err.message}`),
      refetchQueries: allRefetchQueries,
    },
  );

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (editingContactId) {
      updateContact({
        variables: {
          input: {
            id: editingContactId,
            emails: [{ email: formData.email, isPrimary: true }],
            name: formData.name || undefined,
            firstName: formData.firstName || undefined,
            lastName: formData.lastName || undefined,
            company: formData.company || undefined,
            phone: formData.phone || undefined,
            notes: formData.notes || undefined,
          },
        },
      });
    } else {
      createContact({
        variables: {
          input: {
            emails: [{ email: formData.email, isPrimary: true }],
            name: formData.name || undefined,
            firstName: formData.firstName || undefined,
            lastName: formData.lastName || undefined,
            company: formData.company || undefined,
            phone: formData.phone || undefined,
            notes: formData.notes || undefined,
          },
        },
      });
    }
  };

  const handleAddToExisting = () => {
    if (!selectedContactId) {
      toast.error('Please select a contact');
      return;
    }

    const email = emailToAdd || formData.email;
    if (!email) {
      toast.error('No email to add');
      return;
    }

    addEmailToContact({
      variables: {
        input: {
          contactId: selectedContactId,
          email,
          isPrimary: false,
        },
      },
    });
  };

  const isLoading = creating || updating || addingEmail;
  const showTabs = !editingContactId && emailToAdd;

  const getContactDisplayName = (contact: (typeof contacts)[0]) => {
    return (
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      contact.email ||
      'Unknown'
    );
  };

  const getContactEmails = (contact: (typeof contacts)[0]) => {
    if (contact.emails && contact.emails.length > 0) {
      return contact.emails.map((e) => e.email).join(', ');
    }
    return contact.email || '';
  };

  return (
    <Modal show={show} onHide={onHide} centered size={showTabs ? 'lg' : undefined}>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingContactId ? 'Edit Contact' : 'Add Contact'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {showTabs ? (
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k as 'existing' | 'new')}
            className="mb-3"
          >
            <Tab eventKey="existing" title="Add to Existing Contact">
              <p className="text-muted mb-3">
                Add <Badge bg="primary">{emailToAdd}</Badge> to an existing contact:
              </p>
              <SearchInput>
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <Form.Control
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchInput>

              {contactsLoading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <NoContacts>
                  <FontAwesomeIcon icon={faUser} size="2x" className="mb-2" />
                  <p>
                    {searchQuery
                      ? 'No contacts match your search'
                      : 'No contacts yet'}
                  </p>
                </NoContacts>
              ) : (
                <ListGroup
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {filteredContacts.map((contact) => (
                    <ContactListItem
                      key={contact.id}
                      $selected={selectedContactId === contact.id}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <ContactAvatar>
                        <FontAwesomeIcon icon={faUser} />
                      </ContactAvatar>
                      <ContactInfo>
                        <ContactName>{getContactDisplayName(contact)}</ContactName>
                        <ContactEmails>{getContactEmails(contact)}</ContactEmails>
                      </ContactInfo>
                      {selectedContactId === contact.id && (
                        <Badge bg="primary">Selected</Badge>
                      )}
                    </ContactListItem>
                  ))}
                </ListGroup>
              )}
            </Tab>
            <Tab eventKey="new" title="Create New Contact">
              <Form onSubmit={handleSubmitNew}>
                <Form.Group className="mb-3">
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Display Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="How this contact appears in emails"
                  />
                </Form.Group>
                <div className="row">
                  <div className="col-6">
                    <Form.Group className="mb-3">
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                      />
                    </Form.Group>
                  </div>
                  <div className="col-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                      />
                    </Form.Group>
                  </div>
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Company</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </Form.Group>
              </Form>
            </Tab>
          </Tabs>
        ) : (
          <Form onSubmit={handleSubmitNew}>
            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Display Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="How this contact appears in emails"
              />
            </Form.Group>
            <div className="row">
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
              <div className="col-6">
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </Form.Group>
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label>Company</Form.Label>
              <Form.Control
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </Form.Group>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        {showTabs && activeTab === 'existing' ? (
          <Button
            variant="primary"
            onClick={handleAddToExisting}
            disabled={isLoading || !selectedContactId}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            {isLoading ? 'Adding...' : 'Add to Contact'}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            onClick={handleSubmitNew}
          >
            {isLoading
              ? 'Saving...'
              : editingContactId
                ? 'Update'
                : 'Create Contact'}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}
