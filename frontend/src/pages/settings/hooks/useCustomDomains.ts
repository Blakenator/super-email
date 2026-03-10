import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_CUSTOM_DOMAINS_QUERY,
  CREATE_CUSTOM_DOMAIN_ACCOUNT_MUTATION,
} from '../queries';
import type { CustomDomainAccountData, CustomDomainOption } from '../components';

export function useCustomDomains() {
  const { data } = useQuery(GET_CUSTOM_DOMAINS_QUERY);

  const domains: CustomDomainOption[] = (data?.getCustomDomains ?? []).map((d) => ({
    id: d.id,
    domain: d.domain,
    status: d.status,
  }));

  const [createAccount, { loading: creatingAccount }] = useMutation(
    CREATE_CUSTOM_DOMAIN_ACCOUNT_MUTATION,
  );

  const handleCreateAccount = async (
    accountData: CustomDomainAccountData,
    onSuccess?: () => void,
  ) => {
    try {
      const result = await createAccount({
        variables: {
          input: {
            customDomainId: accountData.customDomainId,
            localPart: accountData.localPart,
            name: accountData.name || undefined,
          },
        },
      });
      if (result.error) throw new Error(result.error.message);
      toast.success('Email account created!');
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create account');
    }
  };

  return {
    domains,
    creatingAccount,
    handleCreateAccount,
  };
}
