import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_SEND_PROFILES_FULL_QUERY,
  CREATE_SEND_PROFILE_MUTATION,
  DELETE_SEND_PROFILE_MUTATION,
  UPDATE_SEND_PROFILE_MUTATION,
  TEST_SMTP_CONNECTION_MUTATION,
} from '../queries';
import type {
  SmtpProfileFormData,
  CustomDomainSendProfileData,
  CustomDomainOption,
} from '../components';

export function useSendProfiles(customDomains: CustomDomainOption[]) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creatingCustomDomain, setCreatingCustomDomain] = useState(false);

  const {
    data,
    loading,
    refetch,
  } = useQuery(GET_SEND_PROFILES_FULL_QUERY);

  const profiles = data?.getSendProfiles ?? [];

  const [createProfile, { loading: creating }] = useMutation(
    CREATE_SEND_PROFILE_MUTATION,
  );

  const [deleteProfile] = useMutation(DELETE_SEND_PROFILE_MUTATION, {
    onCompleted: () => void refetch(),
    onError: (err) => setError(err.message),
  });

  const [updateProfile] = useMutation(UPDATE_SEND_PROFILE_MUTATION, {
    onCompleted: () => void refetch(),
    onError: (err) => setError(err.message),
  });

  const [testConnection, { loading: testing }] = useMutation(
    TEST_SMTP_CONNECTION_MUTATION,
  );

  const resetForm = () => {
    setEditingId(null);
    setTestResult(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (profileId: string) => {
    setEditingId(profileId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (profileId: string) => {
    void deleteProfile({ variables: { id: profileId } });
  };

  const handleTest = async (
    formData: SmtpProfileFormData,
  ): Promise<{ success: boolean; message: string }> => {
    setError(null);
    setTestResult(null);
    try {
      const result = await testConnection({
        variables: {
          input: {
            host: formData.host,
            port: formData.port,
            username: formData.username,
            password: formData.password || null,
            useSsl: formData.useSsl,
            profileId: editingId || null,
          },
        },
      });
      const testRes = result.data?.testSmtpConnection || {
        success: false,
        message: 'Unknown error',
      };
      setTestResult(testRes);
      return testRes;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const errorResult = { success: false, message };
      setTestResult(errorResult);
      return errorResult;
    }
  };

  const handleSubmit = async (formData: SmtpProfileFormData) => {
    setError(null);
    try {
      if (editingId) {
        const result = await updateProfile({
          variables: {
            input: {
              id: editingId,
              name: formData.name,
              alias: formData.alias || undefined,
              smtpHost: formData.host || undefined,
              smtpPort: formData.port || undefined,
              smtpUsername: formData.username || undefined,
              smtpPassword: formData.password || undefined,
              smtpUseSsl: formData.useSsl,
              isDefault: formData.isDefault,
              providerId: formData.providerId || undefined,
            },
          },
        });
        if (result.error) throw new Error(result.error.message);
        toast.success('Send profile updated!');
      } else {
        const result = await createProfile({
          variables: {
            input: {
              name: formData.name,
              email: formData.email,
              alias: formData.alias || undefined,
              type: 'SMTP' as any,
              smtpHost: formData.host,
              smtpPort: formData.port,
              smtpUsername: formData.username,
              smtpPassword: formData.password,
              smtpUseSsl: formData.useSsl,
              isDefault: formData.isDefault,
              providerId: formData.providerId || undefined,
            },
          },
        });
        if (result.error) throw new Error(result.error.message);
        toast.success('Send profile added!');
      }
      closeModal();
      void refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to save send profile';
      toast.error(message);
    }
  };

  const handleCreateCustomDomainProfile = async (
    data: CustomDomainSendProfileData,
  ) => {
    setCreatingCustomDomain(true);
    try {
      const domain = customDomains.find((d) => d.id === data.customDomainId);
      const email = `${data.localPart}@${domain?.domain ?? ''}`;
      const result = await createProfile({
        variables: {
          input: {
            name: data.name || email,
            email,
            alias: data.alias || undefined,
            type: 'CUSTOM_DOMAIN' as any,
            customDomainId: data.customDomainId,
            localPart: data.localPart,
          },
        },
      });
      if (result.error) throw new Error(result.error.message);
      toast.success('Send profile created!');
      closeModal();
      void refetch();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create send profile';
      toast.error(message);
    } finally {
      setCreatingCustomDomain(false);
    }
  };

  const editingProfile = editingId
    ? profiles.find((p) => p.id === editingId) ?? null
    : null;

  return {
    profiles,
    loading,
    error,
    setError,
    showModal,
    editingProfile,
    testResult,
    creating,
    testing,
    creatingCustomDomain,
    openCreate,
    openEdit,
    closeModal,
    handleDelete,
    handleTest,
    handleSubmit: (formData: SmtpProfileFormData) =>
      void handleSubmit(formData),
    handleCreateCustomDomainProfile: (data: CustomDomainSendProfileData) =>
      void handleCreateCustomDomainProfile(data),
    refetch,
  };
}
