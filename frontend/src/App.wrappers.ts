import styled, { css } from 'styled-components';
import { Nav, Button } from 'react-bootstrap';

export const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

export const Sidebar = styled.div<{ $collapsed?: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '72px' : '240px')};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  transition: width 0.2s ease;
  overflow: hidden;
`;

export const Logo = styled.div<{ $collapsed?: boolean }>`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem ${({ $collapsed }) => ($collapsed ? '1rem' : '1.5rem')} 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1rem;
  white-space: nowrap;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
`;

export const ComposeButton = styled(Button)<{ $collapsed?: boolean }>`
  margin: 0 ${({ $collapsed }) => ($collapsed ? '0.5rem' : '1rem')} 1.5rem;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.primaryDark} 100%
  ) !important;
  border: none !important;
  border-radius: 24px !important;
  padding: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.75rem 1.5rem')} !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}4d;
  justify-content: center;
  display: flex;
  align-items: center;
  min-width: ${({ $collapsed }) => ($collapsed ? '48px' : 'auto')};

  &:hover {
    box-shadow: 0 6px 16px ${({ theme }) => theme.colors.primary}66;
    transform: translateY(-1px);
  }
`;

export const NavSection = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const StyledNavLink = styled(Nav.Link)<{ $active?: boolean; $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'space-between')};
  padding: 0.75rem ${({ $collapsed }) => ($collapsed ? '0' : '1.5rem')} !important;
  color: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : props.theme.colors.textPrimary} !important;
  background: ${(props) =>
    props.$active ? `${props.theme.colors.primary}15` : 'transparent'};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  border-radius: ${({ $collapsed }) => ($collapsed ? '12px' : '0 24px 24px 0')};
  margin-right: ${({ $collapsed }) => ($collapsed ? '0' : '0.75rem')};
  margin-left: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0')};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const NavIcon = styled.span<{ $collapsed?: boolean }>`
  margin-right: ${({ $collapsed }) => ($collapsed ? '0' : '0.75rem')};
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      width: 100%;
    `}
`;

export const NavLabel = styled.span<{ $collapsed?: boolean }>`
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: none;
    `}
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const SidebarFooter = styled.div<{ $collapsed?: boolean }>`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const UserSection = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: ${({ theme }) => theme.spacing.xs};
    `}
`;

export const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.primaryDark});
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
`;

export const UserInfo = styled.div<{ $collapsed?: boolean }>`
  flex: 1;
  min-width: 0;
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: none;
    `}
`;

export const UserName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const UserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SidebarActions = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      flex-direction: column;
      align-items: center;
    `}
`;

export const CollapseButton = styled(Button)`
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

export const LogoutButton = styled(Button)`
  padding: 0.5rem;
  border-radius: ${({ theme }) => theme.borderRadius.md};
`;

export const UnreadBadge = styled.span<{ $collapsed?: boolean }>`
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      display: none;
    `}
`;
