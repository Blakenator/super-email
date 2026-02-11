import styled from 'styled-components';

export const MobileNavbarContainer = styled.nav`
  display: none;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    display: flex;
  }
`;

export const MobileLogo = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const MobileNavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-left: auto;
`;

export const MobileNavDropdownWrapper = styled.div`
  .dropdown-toggle {
    background: transparent;
    border: none;
    padding: ${({ theme }) => theme.spacing.sm};
    color: ${({ theme }) => theme.colors.textPrimary};

    &:hover, &:focus, &:active {
      background: ${({ theme }) => theme.colors.backgroundHover};
    }

    &::after {
      display: none;
    }
  }

  .dropdown-menu {
    min-width: 200px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.lg};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    max-height: 70vh;
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};

    &:hover {
      background: ${({ theme }) => theme.colors.backgroundHover};
    }

    svg {
      width: 16px;
    }

    .badge {
      margin-left: auto;
    }
  }
`;

export const MobileNavItem = styled.div.attrs({ className: 'dropdown-item', role: 'button' })<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textPrimary};
  background: ${({ $active, theme }) =>
    $active ? `${theme.colors.primary}15` : 'transparent'};
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  cursor: pointer;
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }

  svg {
    width: 16px;
  }

  .badge {
    margin-left: auto;
  }
`;

export const MobileNavDivider = styled.hr`
  margin: ${({ theme }) => theme.spacing.xs} 0;
`;

export const MobileUserSection = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const MobileUserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
`;

export const MobileUserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MobileUserName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MobileUserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ComposeButtonMobile = styled.button`
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.primaryDark} 100%
  );
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px ${({ theme }) => theme.colors.primary}4d;

  &:active {
    transform: scale(0.95);
  }
`;
