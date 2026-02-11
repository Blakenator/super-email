import styled, { css, type DefaultTheme } from 'styled-components';
import type { ButtonVariant, ButtonSize } from './Button';

const getVariantStyles = (variant: ButtonVariant, theme: DefaultTheme) => {
  const isOutline = variant.startsWith('outline-');
  const baseVariant = isOutline ? variant.replace('outline-', '') : variant;

  switch (baseVariant) {
    case 'primary':
      return isOutline
        ? css`
            color: ${theme.colors.primary};
            background-color: transparent;
            border-color: ${theme.colors.primary};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.primary};
              color: ${theme.colors.backgroundWhite};
              border-color: ${theme.colors.primary};
            }
          `
        : css`
            background-color: ${theme.colors.primary};
            border-color: ${theme.colors.primary};
            color: ${theme.colors.backgroundWhite};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.primaryDark};
              border-color: ${theme.colors.primaryDark};
            }
          `;

    case 'secondary':
      return isOutline
        ? css`
            color: ${theme.colors.textSecondary};
            background-color: transparent;
            border-color: ${theme.colors.border};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.backgroundHover};
              color: ${theme.colors.textPrimary};
              border-color: ${theme.colors.border};
            }
          `
        : css`
            background-color: ${theme.colors.textSecondary};
            border-color: ${theme.colors.textSecondary};
            color: ${theme.colors.backgroundWhite};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.textPrimary};
              border-color: ${theme.colors.textPrimary};
            }
          `;

    case 'success':
      return isOutline
        ? css`
            color: ${theme.colors.success};
            background-color: transparent;
            border-color: ${theme.colors.success};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.success};
              color: ${theme.colors.backgroundWhite};
              border-color: ${theme.colors.success};
            }
          `
        : css`
            background-color: ${theme.colors.success};
            border-color: ${theme.colors.success};
            color: ${theme.colors.backgroundWhite};

            &:hover:not(:disabled) {
              opacity: 0.9;
            }
          `;

    case 'danger':
      return isOutline
        ? css`
            color: ${theme.colors.danger};
            background-color: transparent;
            border-color: ${theme.colors.danger};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.danger};
              color: ${theme.colors.backgroundWhite};
              border-color: ${theme.colors.danger};
            }
          `
        : css`
            background-color: ${theme.colors.danger};
            border-color: ${theme.colors.danger};
            color: ${theme.colors.backgroundWhite};

            &:hover:not(:disabled) {
              opacity: 0.9;
            }
          `;

    case 'warning':
      return isOutline
        ? css`
            color: ${theme.colors.warning};
            background-color: transparent;
            border-color: ${theme.colors.warning};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.warning};
              color: ${theme.colors.textPrimary};
              border-color: ${theme.colors.warning};
            }
          `
        : css`
            background-color: ${theme.colors.warning};
            border-color: ${theme.colors.warning};
            color: ${theme.colors.textPrimary};

            &:hover:not(:disabled) {
              opacity: 0.9;
            }
          `;

    case 'info':
      return isOutline
        ? css`
            color: ${theme.colors.info};
            background-color: transparent;
            border-color: ${theme.colors.info};

            &:hover:not(:disabled) {
              background-color: ${theme.colors.info};
              color: ${theme.colors.backgroundWhite};
              border-color: ${theme.colors.info};
            }
          `
        : css`
            background-color: ${theme.colors.info};
            border-color: ${theme.colors.info};
            color: ${theme.colors.backgroundWhite};

            &:hover:not(:disabled) {
              opacity: 0.9;
            }
          `;

    case 'link':
      return css`
        background-color: transparent;
        border: none;
        color: ${theme.colors.primary};
        padding: 0;
        text-decoration: underline;

        &:hover:not(:disabled) {
          color: ${theme.colors.primaryDark};
          text-decoration: underline;
        }
      `;

    default:
      return css`
        background-color: ${theme.colors.primary};
        border-color: ${theme.colors.primary};
        color: ${theme.colors.backgroundWhite};
      `;
  }
};

const getSizeStyles = (size: ButtonSize, theme: DefaultTheme) => {
  switch (size) {
    case 'sm':
      return css`
        padding: ${theme.spacing.xs} ${theme.spacing.sm};
        font-size: ${theme.fontSizes.sm};
        line-height: 1.5;
      `;
    case 'lg':
      return css`
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        font-size: ${theme.fontSizes.lg};
        line-height: 1.5;
      `;
    case 'md':
    default:
      return css`
        padding: ${theme.spacing.sm} ${theme.spacing.md};
        font-size: ${theme.fontSizes.md};
        line-height: 1.5;
      `;
  }
};

export const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  user-select: none;
  border: 1px solid transparent;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $variant, theme }) => getVariantStyles($variant, theme)}
  ${({ $size, theme }) => getSizeStyles($size, theme)}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 0.2rem
      ${({ theme, $variant }) => {
        if ($variant === 'primary' || $variant === 'outline-primary') {
          return `${theme.colors.primary}40`;
        }
        return `${theme.colors.border}40`;
      }};
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    pointer-events: none;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }
`;

export const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;
