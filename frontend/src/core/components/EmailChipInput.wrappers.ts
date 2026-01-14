import styled from 'styled-components';

export const Container = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.xs};
  min-height: 42px;
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  cursor: text;
  position: relative;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}20;
  }
`;

export const Chip = styled.div<{ $isContact: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 2px 8px;
  background: ${({ $isContact, theme }) =>
    $isContact ? theme.colors.primary + '15' : theme.colors.background};
  border: 1px solid
    ${({ $isContact, theme }) =>
      $isContact ? theme.colors.primary + '50' : theme.colors.border};
  border-radius: 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  .svg-inline--fa {
    font-size: 0.7rem;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const ChipLabel = styled.span`
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChipRemove = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

export const Input = styled.input`
  border: none;
  outline: none;
  flex: 1;
  min-width: 120px;
  padding: 4px 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  background: transparent;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const DropdownStyled = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
`;

export const DropdownItem = styled.div<{ $isHighlighted: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  cursor: pointer;
  background: ${({ $isHighlighted, theme }) =>
    $isHighlighted ? theme.colors.backgroundHover : 'transparent'};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const ContactName = styled.span`
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const ContactEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const PopoverCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  min-width: 250px;
`;

export const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const PopoverAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
`;

export const PopoverTitle = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const PopoverSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const PopoverDetail = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  .svg-inline--fa {
    width: 14px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const PopoverActions = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const ChipClickable = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;
