import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import type { GetContactsQuery } from '../../__generated__/graphql';
import {
  GET_CONTACTS_QUERY,
  CREATE_CONTACT_MUTATION,
  UPDATE_CONTACT_MUTATION,
  DELETE_CONTACT_MUTATION,
} from './queries';

export type ContactListItem = GetContactsQuery['getContacts'][number];

export interface EmailFormItem {
  id?: string;
  email: string;
  isPrimary: boolean;
  label: string;
}

export interface ContactFormData {
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

function filterContacts(
  contacts: ContactListItem[],
  query: string,
): ContactListItem[] {
  if (!query) {
    return contacts;
  }
  const q = query.toLowerCase();
  return contacts.filter(
    (c) =>
      c.email?.toLowerCase().includes(q) ||
      c.emails?.some((e) => e.email.toLowerCase().includes(q)) ||
      c.name?.toLowerCase().includes(q) ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q),
  );
}

export function useContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingContact, setEditingContact] = useState<{ id: string } | null>(
    null,
  );
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
        void refetch();
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
        void refetch();
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
        void refetch();
      },
      onError: (err) => toast.error(`Failed to delete contact: ${err.message}`),
    },
  );

  const contacts = data?.getContacts ?? [];
  const filteredContacts = filterContacts(contacts, searchQuery);

  const handleOpenCreate = () => {
    setEditingContact(null);
    setFormData(emptyFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (contact: ContactListItem) => {
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
          ? contact.emails.map((e) => ({
              id: e.id,
              email: e.email,
              isPrimary: e.isPrimary,
              label: e.label || '',
            }))
          : [{ email: contact.email || '', isPrimary: true, label: '' }],
    });
    setShowModal(true);
  };

  const handleOpenDelete = (contact: ContactListItem) => {
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
      newEmails.forEach((e) => (e.isPrimary = false));
    }
    const item = newEmails[index];
    if (field === 'email') {
      item.email = value as string;
    } else if (field === 'label') {
      item.label = value as string;
    } else if (field === 'isPrimary') {
      item.isPrimary = value as boolean;
    }
    setFormData({ ...formData, emails: newEmails });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validEmails = formData.emails.filter((e) => e.email.trim());
    if (validEmails.length === 0) {
      toast.error('At least one email is required');
      return;
    }

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
      void updateContact({
        variables: {
          input: {
            id: editingContact.id,
            ...input,
          },
        },
      });
    } else {
      void createContact({
        variables: {
          input,
        },
      });
    }
  };

  const handleDelete = () => {
    if (deletingContact) {
      void deleteContact({ variables: { id: deletingContact.id } });
    }
  };

  return {
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
  };
}
