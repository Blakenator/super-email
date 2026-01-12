import { Spinner } from 'react-bootstrap';
import styled from 'styled-components';

const SpinnerWrapper = styled.div<{ $fullPage?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  height: ${(props) => (props.$fullPage ? '100vh' : '200px')};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const SpinnerText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

interface LoadingSpinnerProps {
  message?: string;
  fullPage?: boolean;
  size?: 'sm' | undefined;
}

export function LoadingSpinner({
  message,
  fullPage = false,
  size,
}: LoadingSpinnerProps) {
  return (
    <SpinnerWrapper $fullPage={fullPage}>
      <Spinner animation="border" variant="primary" size={size} />
      {message && <SpinnerText>{message}</SpinnerText>}
    </SpinnerWrapper>
  );
}
