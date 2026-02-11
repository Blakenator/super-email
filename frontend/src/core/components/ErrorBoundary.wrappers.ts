import styled from 'styled-components';

export const ErrorWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gradient};
  padding: ${({ theme }) => theme.spacing.xl};
`;

export const ErrorCard = styled.div`
  max-width: 500px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const ErrorIcon = styled.div`
  font-size: 4rem;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const InlineErrorWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  background: #fff3cd;
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin: ${({ theme }) => theme.spacing.md} 0;
`;
