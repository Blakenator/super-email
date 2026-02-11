import {
  Container,
  Button,
  Modal,
  Form,
  InputGroup,
  Badge,
} from 'react-bootstrap';
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
import {
  useContacts,
  type ContactFormData,
  type ContactListItem,
  type EmailFormItem,
} from './useContacts';
import { LoadingSpinner, EmptyState } from '../../core/components';
import {
  PageWrapper,
} from '../../core/components';
import {
  PageHeader,
  PageTitle,
  SearchWrapper,
  ContactsGrid,
  ContactCardStyled,
  ContactCardHeader,
  ContactAvatar,
  ContactInfo,
  ContactName,
  ContactCompany,
  ContactCardBody,
  EmailList,
  EmailItem,
  ContactMeta,
  ContactCardFooter,
  EmailFormRow,
} from './Contacts.wrappers';

type ContactEmailDisplay = ContactListItem['emails'][number] | {
  id?: string;
  email: string;
  isPrimary: boolean;
  label: string | null;
};

function getDisplayName(contact: ContactListItem): string {
  return (
    contact.name ||
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.email ||
    contact.emails?.[0]?.email ||
    'Unknown'
  );
}

function getContactEmails(contact: ContactListItem): ContactEmailDisplay[] {
  if (contact.emails?.length > 0) {
    return contact.emails;
  }
  if (contact.email) {
    return [{ email: contact.email, isPrimary: true, label: null }];
  }
  return [];
}

interface ContactCardProps {
  contact: ContactListItem;
  onEdit: (contact: ContactListItem) => void;
  onDelete: (contact: ContactListItem) => void;
}

function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
  const emails = getContactEmails(contact);
  return (
    <ContactCardStyled className="card">
      <ContactCardHeader className="card-header">
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
      <ContactCardBody className="card-body">
        <EmailList>
          {emails.map((emailItem: ContactEmailDisplay, index: number) => (
            <EmailItem key={index}>
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
      <ContactCardFooter className="card-footer">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => onEdit(contact)}
        >
          <FontAwesomeIcon icon={faEdit} className="me-1" />
          Edit
        </Button>
        <Button
          variant="outline-danger"
          size="sm"
          onClick={() => onDelete(contact)}
        >
          <FontAwesomeIcon icon={faTrash} className="me-1" />
          Delete
        </Button>
      </ContactCardFooter>
    </ContactCardStyled>
  );
}

interface ContactFormModalProps {
  show: boolean;
  onHide: () => void;
  formData: ContactFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContactFormData>>;
  editingContact: { id: string } | null;
  creating: boolean;
  updating: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onAddEmail: () => void;
  onRemoveEmail: (index: number) => void;
  onEmailChange: (
    index: number,
    field: keyof EmailFormItem,
    value: string | boolean,
  ) => void;
}

function ContactFormModal({
  show,
  onHide,
  formData,
  setFormData,
  editingContact,
  creating,
  updating,
  onSubmit,
  onAddEmail,
  onRemoveEmail,
  onEmailChange,
}: ContactFormModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={onSubmit}>
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
                  onChange={(e) => onEmailChange(index, 'email', e.target.value)}
                  required={index === 0}
                />
                <Form.Control
                  type="text"
                  className="label-input"
                  placeholder="Label (Work, Personal...)"
                  value={emailItem.label}
                  onChange={(e) => onEmailChange(index, 'label', e.target.value)}
                />
                <Button
                  variant={
                    emailItem.isPrimary ? 'primary' : 'outline-secondary'
                  }
                  size="sm"
                  onClick={() => onEmailChange(index, 'isPrimary', true)}
                  title="Set as primary"
                  type="button"
                >
                  <FontAwesomeIcon icon={faStar} />
                </Button>
                {formData.emails.length > 1 && (
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onRemoveEmail(index)}
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
              onClick={onAddEmail}
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
          <Button variant="secondary" onClick={onHide}>
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
  );
}

interface DeleteContactModalProps {
  show: boolean;
  onHide: () => void;
  deletingContact: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
  onDelete: () => void;
  deleting: boolean;
}

function DeleteContactModal({
  show,
  onHide,
  deletingContact,
  onDelete,
  deleting,
}: DeleteContactModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Contact</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to delete{' '}
        <strong>{deletingContact?.name || deletingContact?.email}</strong>?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onDelete} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Delete'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function Contacts() {
  const {
    searchQuery,
    setSearchQuery,
    showModal,
    setShowModal,
    showDeleteModal,
    setShowDeleteModal,
    editingContact,
    deletingContact,
    formData,
    setFormData,
    loading,
    creating,
    updating,
    deleting,
    contacts,
    filteredContacts,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDelete,
    handleAddEmail,
    handleRemoveEmail,
    handleEmailChange,
    handleSubmit,
    handleDelete,
  } = useContacts();

  if (loading) {
    return <LoadingSpinner message="Loading contacts..." />;
  }

  return (
    <PageWrapper $padding $overflow="auto" $background="default">
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
            {filteredContacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            ))}
          </ContactsGrid>
        )}
      </Container>

      <ContactFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
        formData={formData}
        setFormData={setFormData}
        editingContact={editingContact}
        creating={creating}
        updating={updating}
        onSubmit={handleSubmit}
        onAddEmail={handleAddEmail}
        onRemoveEmail={handleRemoveEmail}
        onEmailChange={handleEmailChange}
      />

      <DeleteContactModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        deletingContact={deletingContact}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </PageWrapper>
  );
}
