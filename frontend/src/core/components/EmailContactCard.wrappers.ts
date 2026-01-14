import styled from 'styled-components';

export const EmailLink = styled.span<{ $isClickable?: boolean; $isContact?: boolean }>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
  color: ${({ theme, $isContact }) =>
    $isContact ? theme.colors.primary : theme.colors.textPrimary};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    text-decoration: ${({ $isClickable }) =>
      $isClickable ? 'underline' : 'none'};
  }

  .contact-icon {
    font-size: 0.75em;
    opacity: 0.7;
  }
`;

export const EmailChip = styled.span<{ $isClickable?: boolean; $isContact?: boolean }>`
  cursor: ${({ $isClickable }) => ($isClickable ? 'pointer' : 'default')};
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme, $isContact }) =>
    $isContact ? `${theme.colors.primary}15` : theme.colors.background};
  border: 1px solid
    ${({ theme, $isContact }) =>
      $isContact ? theme.colors.primary : theme.colors.border};
  color: ${({ theme, $isContact }) =>
    $isContact ? theme.colors.primary : theme.colors.textPrimary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme, $isContact }) =>
      $isContact ? `${theme.colors.primary}25` : theme.colors.backgroundHover};
  }

  .chip-icon {
    font-size: 0.75em;
  }
`;

export const PopoverContent = styled.div`
  min-width: 250px;
`;

export const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 4px 4px 0 0;
  margin: -0.5rem -0.5rem 0.5rem -0.5rem;
`;

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
`;

export const ContactName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const PopoverBody = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  .icon {
    width: 16px;
    text-align: center;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const ActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
