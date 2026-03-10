import { useQuery, useMutation } from '@apollo/client/react';
import toast from 'react-hot-toast';
import {
  GET_AUTHENTICATION_METHODS_QUERY,
  DELETE_AUTHENTICATION_METHOD_MUTATION,
} from '../queries';

export function useAuthMethods() {
  const {
    data,
    loading,
    refetch,
  } = useQuery(GET_AUTHENTICATION_METHODS_QUERY);

  const [deleteMethod, { loading: deleting }] = useMutation(
    DELETE_AUTHENTICATION_METHOD_MUTATION,
    {
      onCompleted: () => {
        void refetch();
        toast.success('Authentication method removed');
      },
      onError: (err) => toast.error(err.message),
    },
  );

  const methods = data?.getAuthenticationMethods ?? [];

  const handleDelete = (id: string) => {
    void deleteMethod({ variables: { id } });
  };

  return {
    methods,
    loading,
    deleting,
    handleDelete,
  };
}
