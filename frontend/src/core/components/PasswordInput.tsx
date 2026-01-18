import { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { PasswordInputWrapper, ToggleButton } from './PasswordInput.wrappers';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  size?: 'sm' | 'lg';
  autoFocus?: boolean;
  className?: string;
}

export function PasswordInput({
  value,
  onChange,
  placeholder = 'Enter password',
  label = 'Password',
  required = false,
  size,
  autoFocus = false,
  className,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Form.Group className={className}>
      <Form.Label>{label}</Form.Label>
      <PasswordInputWrapper>
        <Form.Control
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          size={size}
          autoFocus={autoFocus}
        />
        <ToggleButton
          type="button"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          title={showPassword ? 'Hide password' : 'Show password'}
        >
          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
        </ToggleButton>
      </PasswordInputWrapper>
    </Form.Group>
  );
}
