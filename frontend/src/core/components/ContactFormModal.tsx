import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import { gql } from '../../__generated__/gql';

const CREATE_CONTACT_MUTATION = gql(`
  mutation CreateContactFromModal($input: CreateContactInput!) {
    createContact(input: $input) {
      id
      email
      name
    }
  }
`);

const UPDATE_CONTACT_MUTATION = gql(`
  mutation UpdateContactFromModal($input: UpdateContactInput!) {
    updateContact(input: $input) {
      id
      email
      name
    }
  }
`);

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
  onSuccess?: (contact: { id: string; email: string; name?: string | null }) => void;
  refetchQueries?: any[];
}

export function ContactFormModal({
  show,
  onHide,
  editingContactId,
  initialData,
  onSuccess,
  refetchQueries = [],
}: ContactFormModalProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    ...emptyFormData,
    ...initialData,
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (show) {
      setFormData({
        ...emptyFormData,
        ...initialData,
      });
    }
  }, [show, initialData]);

  const [createContact, { loading: creating }] = useMutation(
    CREATE_CONTACT_MUTATION,
    {
      onCompleted: (data) => {
        toast.success('Contact created!');
        onHide();
        onSuccess?.(data.createContact);
      },
      onError: (err) => toast.error(`Failed to create contact: ${err.message}`),
      refetchQueries,
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
      refetchQueries,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
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

  const isLoading = creating || updating;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editingContactId ? 'Edit Contact' : 'Add Contact'}
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
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : editingContactId
                ? 'Update'
                : 'Create'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
