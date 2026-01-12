import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const StyledButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
`;

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
  size?: 'sm' | 'lg';
  variant?: string;
}

/**
 * Reusable back button component
 */
export function BackButton({
  onClick,
  label,
  className,
  size = 'sm',
  variant = 'outline-secondary',
}: BackButtonProps) {
  return (
    <StyledButton
      variant={variant}
      size={size}
      onClick={onClick}
      className={className}
      title={label || 'Go back'}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
      {label && <span className="ms-1">{label}</span>}
    </StyledButton>
  );
}
