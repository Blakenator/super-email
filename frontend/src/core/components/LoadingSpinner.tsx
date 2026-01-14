import { Spinner } from 'react-bootstrap';
import { SpinnerWrapper, SpinnerText } from './LoadingSpinner.wrappers';

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
