import { ReactNode } from 'react';
import { Spinner } from 'react-bootstrap';
import { StyledButton, ButtonContent } from './Button.wrappers';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'outline-primary'
  | 'outline-secondary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning'
  | 'outline-info'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  title?: string;
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className,
  title,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const showLeftIcon = icon && iconPosition === 'left' && !loading;
  const showRightIcon = icon && iconPosition === 'right' && !loading;
  const hasTextContent = children && (typeof children === 'string' || (Array.isArray(children) && children.some(c => typeof c === 'string')));

  return (
    <StyledButton
      $variant={variant}
      $size={size}
      onClick={onClick}
      disabled={isDisabled}
      type={type}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      <ButtonContent>
        {loading && (
          <Spinner
            animation="border"
            size="sm"
            style={{ marginRight: children ? '0.5rem' : 0 }}
          />
        )}
        {showLeftIcon && (
          <span style={{ marginRight: hasTextContent ? '0.5rem' : 0 }}>{icon}</span>
        )}
        {children}
        {showRightIcon && (
          <span style={{ marginLeft: hasTextContent ? '0.5rem' : 0 }}>{icon}</span>
        )}
      </ButtonContent>
    </StyledButton>
  );
}
