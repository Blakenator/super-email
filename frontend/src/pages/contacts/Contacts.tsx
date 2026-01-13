import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Button,
  Modal,
  Form,
  InputGroup,
  Badge,
  ListGroup,
} from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faAddressBook,
  faBuilding,
  faPhone,
  faEnvelope,
  faStar,
  faTimes,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import {
  GET_CONTACTS_QUERY,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
} from './queries';
import { LoadingSpinner, EmptyState } from '../../core/components';

const PageWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  height: 100%;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const PageTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;

  .svg-inline--fa {
    margin-right: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchWrapper = styled.div`
  max-width: 300px;
`;

const ContactsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ContactCardStyled = styled(Card)`
  border: none;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    transform: translateY(-2px);
  }
`;

const ContactCardHeader = styled(Card.Header)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary}15 0%,
    ${({ theme }) => theme.colors.primary}05 100%
  );
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ContactAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ContactName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ContactCompany = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ContactCardBody = styled(Card.Body)`
  padding: ${({ theme }) => theme.spacing.md};
`;

const EmailList = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const EmailItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};

  .email-address {
    color: ${({ theme }) => theme.colors.primary};
    flex: 1;
  }

  .email-label {
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const ContactMeta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ContactCardFooter = styled(Card.Footer)`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

// Email form types
interface EmailFormItem {
  id?: string;
  email: string;
  isPrimary: boolean;
  label: string;
}

interface ContactFormData {
  name: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  notes: string;
  emails: EmailFormItem[];
}

const emptyFormData: ContactFormData = {
  name: '',
  firstName: '',
  lastName: '',
  company: '',
  phone: '',
  notes: '',
  emails: [{ email: '', isPrimary: true, label: '' }],
};

const EmailFormRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  .email-input {
    flex: 2;
  }

  .label-input {
    flex: 1;
  }
`;

export function Contacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingContact, setEditingContact] = useState<{
    id: string;
  } | null>(null);
  const [deletingContact, setDeletingContact] = useState<{
    id: string;
    name?: string | null;
    email?: string | null;
  } | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyFormData);

  const { data, loading, refetch } = useQuery(GET_CONTACTS_QUERY);

  const [createContact, { loading: creating }] = useMutation(
    CREATE_CONTACT_MUTATION,
    {
      onCompleted: () => {
        toast.success('Contact created!');
        setShowModal(false);
        setFormData(emptyFormData);
        refetch();
      },
      onError: (err) => toast.error(`Failed to create contact: ${err.message}`),
    },
  );

  const [updateContact, { loading: updating }] = useMutation(
    UPDATE_CONTACT_MUTATION,
    {
      onCompleted: () => {
        toast.success('Contact updated!');
        setShowModal(false);
        setEditingContact(null);
        setFormData(emptyFormData);
        refetch();
      },
      onError: (err) => toast.error(`Failed to update contact: ${err.message}`),
    },
  );

  const [deleteContact, { loading: deleting }] = useMutation(
    DELETE_CONTACT_MUTATION,
    {
      onCompleted: () => {
        toast.success('Contact deleted!');
        setShowDeleteModal(false);
        setDeletingContact(null);
        refetch();
      },
      onError: (err) => toast.error(`Failed to delete contact: ${err.message}`),
    },
  );

  const contacts = data?.getContacts ?? [];

  const filteredContacts = searchQuery
    ? contacts.filter((c) => {
        const query = searchQuery.toLowerCase();
        return (
          c.email?.toLowerCase().includes(query) ||
          c.emails?.some((e) => e.email.toLowerCase().includes(query)) ||
          c.name?.toLowerCase().includes(query) ||
          c.firstName?.toLowerCase().includes(query) ||
          c.lastName?.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query)
        );
      })
    : contacts;

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact({ id: contact.id });
    setFormData({
      name: contact.name || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      company: contact.company || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      emails:
        contact.emails?.length > 0
          ? contact.emails.map((e: any) => ({
              id: e.id,
              email: e.email,
              isPrimary: e.isPrimary,
              label: e.label || '',
            }))
          : [{ email: contact.email || '', isPrimary: true, label: '' }],
    });
    setShowModal(true);
  };

  const handleOpenDelete = (contact: any) => {
    setDeletingContact({
      id: contact.id,
      name: contact.name,
      email: contact.email,
    });
    setShowDeleteModal(true);
  };

  const handleAddEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, { email: '', isPrimary: false, label: '' }],
    });
  };

  const handleRemoveEmail = (index: number) => {
    if (formData.emails.length <= 1) {
      toast.error('Contact must have at least one email');
      return;
    }
    const newEmails = formData.emails.filter((_, i) => i !== index);
    // If we removed the primary, make the first one primary
    if (formData.emails[index].isPrimary && newEmails.length > 0) {
      newEmails[0].isPrimary = true;
    }
    setFormData({ ...formData, emails: newEmails });
  };

  const handleEmailChange = (
    index: number,
    field: keyof EmailFormItem,
    value: string | boolean,
  ) => {
    const newEmails = [...formData.emails];
    if (field === 'isPrimary' && value === true) {
      // Unset all other primaries
      newEmails.forEach((e) => (e.isPrimary = false));
    }
    (newEmails[index] as any)[field] = value;
    setFormData({ ...formData, emails: newEmails });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validEmails = formData.emails.filter((e) => e.email.trim());
    if (validEmails.length === 0) {
      toast.error('At least one email is required');
      return;
    }

    // Ensure one is primary
    if (!validEmails.some((e) => e.isPrimary)) {
      validEmails[0].isPrimary = true;
    }

    const input = {
      name: formData.name || undefined,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      company: formData.company || undefined,
      phone: formData.phone || undefined,
      notes: formData.notes || undefined,
      emails: validEmails.map((e) => ({
        email: e.email.trim(),
        isPrimary: e.isPrimary,
        label: e.label || undefined,
      })),
    };

    if (editingContact) {
      updateContact({
        variables: {
          input: {
            id: editingContact.id,
            ...input,
          },
        },
      });
    } else {
      createContact({
        variables: {
          input,
        },
      });
    }
  };

  const handleDelete = () => {
    if (deletingContact) {
      deleteContact({ variables: { id: deletingContact.id } });
    }
  };

  const getDisplayName = (contact: any) => {
    return (
      contact.name ||
      [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
      contact.email ||
      contact.emails?.[0]?.email ||
      'Unknown'
    );
  };

  const getContactEmails = (contact: any) => {
    if (contact.emails?.length > 0) {
      return contact.emails;
    }
    if (contact.email) {
      return [{ email: contact.email, isPrimary: true, label: null }];
    }
    return [];
  };

  if (loading) {
    return <LoadingSpinner message="Loading contacts..." />;
  }

  return (
    <PageWrapper>
      <Container fluid>
        <PageHeader>
          <PageTitle>
            <FontAwesomeIcon icon={faAddressBook} />
            Contacts
            <Badge bg="secondary" className="ms-2">
              {contacts.length}
            </Badge>
          </PageTitle>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <SearchWrapper>
              <InputGroup size="sm">
                <InputGroup.Text>
                  <FontAwesomeIcon icon={faSearch} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>
            </SearchWrapper>
            <Button variant="primary" size="sm" onClick={handleOpenCreate}>
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Add Contact
            </Button>
          </div>
        </PageHeader>

        {filteredContacts.length === 0 ? (
          <EmptyState
            icon={faAddressBook}
            title="No contacts found"
            description={
              searchQuery
                ? 'Try a different search term'
                : 'Add your first contact to get started'
            }
          />
        ) : (
          <ContactsGrid>
            {filteredContacts.map((contact) => {
              const emails = getContactEmails(contact);
              return (
                <ContactCardStyled key={contact.id}>
                  <ContactCardHeader>
                    <ContactAvatar>
                      <FontAwesomeIcon icon={faUser} />
                    </ContactAvatar>
                    <ContactInfo>
                      <ContactName>
                        {getDisplayName(contact)}
                        {contact.isAutoCreated && (
                          <Badge bg="light" text="dark" className="ms-2">
                            Auto
                          </Badge>
                        )}
                      </ContactName>
                      {contact.company && (
                        <ContactCompany>
                          <FontAwesomeIcon icon={faBuilding} className="me-1" />
                          {contact.company}
                        </ContactCompany>
                      )}
                    </ContactInfo>
                  </ContactCardHeader>
                  <ContactCardBody>
                    <EmailList>
                      {emails.map((emailItem: any, index: number) => (
                        <EmailItem key={emailItem.id || index}>
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            style={{
                              color: emailItem.isPrimary ? '#667eea' : '#999',
                            }}
                          />
                          <span className="email-address">{emailItem.email}</span>
                          {emailItem.isPrimary && (
                            <Badge bg="primary" pill>
                              Primary
                            </Badge>
                          )}
                          {emailItem.label && (
                            <span className="email-label">{emailItem.label}</span>
                          )}
                        </EmailItem>
                      ))}
                    </EmailList>
                    {contact.phone && (
                      <ContactMeta>
                        <span>
                          <FontAwesomeIcon icon={faPhone} className="me-1" />
                          {contact.phone}
                        </span>
                      </ContactMeta>
                    )}
                  </ContactCardBody>
                  <ContactCardFooter>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenEdit(contact)}
                    >
                      <FontAwesomeIcon icon={faEdit} className="me-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleOpenDelete(contact)}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-1" />
                      Delete
                    </Button>
                  </ContactCardFooter>
                </ContactCardStyled>
              );
            })}
          </ContactsGrid>
        )}
      </Container>

      {/* Create/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        size="lg"
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faEnvelope} className="me-1" />
                Email Addresses *
              </Form.Label>
              {formData.emails.map((emailItem, index) => (
                <EmailFormRow key={index}>
                  <Form.Control
                    type="email"
                    className="email-input"
                    placeholder="email@example.com"
                    value={emailItem.email}
                    onChange={(e) =>
                      handleEmailChange(index, 'email', e.target.value)
                    }
                    required={index === 0}
                  />
                  <Form.Control
                    type="text"
                    className="label-input"
                    placeholder="Label (Work, Personal...)"
                    value={emailItem.label}
                    onChange={(e) =>
                      handleEmailChange(index, 'label', e.target.value)
                    }
                  />
                  <Button
                    variant={emailItem.isPrimary ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => handleEmailChange(index, 'isPrimary', true)}
                    title="Set as primary"
                    type="button"
                  >
                    <FontAwesomeIcon icon={faStar} />
                  </Button>
                  {formData.emails.length > 1 && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveEmail(index)}
                      title="Remove email"
                      type="button"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </Button>
                  )}
                </EmailFormRow>
              ))}
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleAddEmail}
                type="button"
              >
                <FontAwesomeIcon icon={faPlus} className="me-1" />
                Add Email
              </Button>
            </Form.Group>

            <hr />

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
              <Form.Label>
                <FontAwesomeIcon icon={faBuilding} className="me-1" />
                Company
              </Form.Label>
              <Form.Control
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>
                <FontAwesomeIcon icon={faPhone} className="me-1" />
                Phone
              </Form.Label>
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
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={creating || updating}>
              {creating || updating
                ? 'Saving...'
                : editingContact
                  ? 'Update'
                  : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Delete Contact</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{deletingContact?.name || deletingContact?.email}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </PageWrapper>
  );
}
