import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components';

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.375rem 0.5rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
  cursor: pointer;
  background: transparent;
  &:focus {
    outline: none;
  }
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
  const sizeClass = size === 'lg' ? 'btn-lg' : 'btn-sm';
  const variantClass = `btn-${variant}`;
  const combinedClassName =
    `btn ${variantClass} ${sizeClass} ${className || ''}`.trim();
  return (
    <StyledButton
      onClick={onClick}
      className={combinedClassName}
      title={label || 'Go back'}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
      {label && <span className="ms-1">{label}</span>}
    </StyledButton>
  );
}
