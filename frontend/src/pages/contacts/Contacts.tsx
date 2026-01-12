import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import {
  Container,
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputGroup,
  Badge,
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

const ContactCard = styled(Card)`
  border: none;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
`;

const ContactRow = styled.tr`
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const ContactName = styled.span`
  font-weight: 500;
`;

const ContactEmail = styled.span`
  color: ${({ theme }) => theme.colors.primary};
`;

const SecondaryInfo = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

interface ContactFormData {
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
    email: string;
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
    ? contacts.filter(
        (c) =>
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : contacts;

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: any) => {
    setEditingContact({ id: contact.id });
    setFormData({
      email: contact.email,
      name: contact.name || '',
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      company: contact.company || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      toast.error('Email is required');
      return;
    }

    if (editingContact) {
      updateContact({
        variables: {
          input: {
            id: editingContact.id,
            ...formData,
          },
        },
      });
    } else {
      createContact({
        variables: {
          input: formData,
        },
      });
    }
  };

  const handleDelete = () => {
    if (deletingContact) {
      deleteContact({ variables: { id: deletingContact.id } });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading contacts..." />;
  }

  return (
    <PageWrapper>
      <Container>
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
          <ContactCard>
            <Table hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <ContactRow key={contact.id}>
                    <td>
                      <ContactName>
                        {contact.name ||
                          [contact.firstName, contact.lastName]
                            .filter(Boolean)
                            .join(' ') ||
                          '-'}
                      </ContactName>
                      {contact.isAutoCreated && (
                        <Badge bg="light" text="dark" className="ms-2">
                          Auto
                        </Badge>
                      )}
                    </td>
                    <td>
                      <ContactEmail>{contact.email}</ContactEmail>
                    </td>
                    <td>
                      <SecondaryInfo>
                        {contact.company && (
                          <>
                            <FontAwesomeIcon
                              icon={faBuilding}
                              className="me-1"
                            />
                            {contact.company}
                          </>
                        )}
                      </SecondaryInfo>
                    </td>
                    <td>
                      <SecondaryInfo>
                        {contact.phone && (
                          <>
                            <FontAwesomeIcon icon={faPhone} className="me-1" />
                            {contact.phone}
                          </>
                        )}
                      </SecondaryInfo>
                    </td>
                    <td>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleOpenEdit(contact)}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleOpenDelete(contact)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </Button>
                    </td>
                  </ContactRow>
                ))}
              </tbody>
            </Table>
          </ContactCard>
        )}
      </Container>

      {/* Create/Edit Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
