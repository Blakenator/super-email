import styled, { css } from 'styled-components';
import { Nav, Button } from 'react-bootstrap';

// Content wrapper that handles the hover expand (excludes the collapse handle)
export const SidebarContent = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding-top: 1rem;
  position: relative;
  
  /* Allow dropdown menus to escape overflow constraints */
  > *:last-child {
    overflow: visible;
  }
`;

export const SidebarContainer = styled.div<{ $collapsed?: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '72px' : '240px')};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: visible;
  position: relative;
  flex-shrink: 0;
  height: 100%;

  /* Expand on hover when collapsed - only when hovering the content area */
  ${({ $collapsed }) =>
    $collapsed &&
    css`
      &:has(${SidebarContent}:hover) {
        width: 240px;
        box-shadow: ${({ theme }) => theme.shadows.lg};
        z-index: 100;
      }
    `}

  @media (max-width: 768px) {
    display: none;
  }

  /* Remove link underlines in sidebar */
  a {
    text-decoration: none !important;
  }
`;

export const LogoText = styled.span<{ $collapsed?: boolean }>`
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  max-width: ${({ $collapsed }) => ($collapsed ? '0' : '150px')};
  opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        opacity: 1;
        max-width: 150px;
      }
    `}
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
  justify-content: ${({ $collapsed }) =>
    $collapsed ? 'center' : 'flex-start'};
  transition: justify-content 0.2s ease;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        justify-content: flex-start;
        padding-left: 1.5rem;
      }
    `}
`;

export const ComposeButtonText = styled.span<{ $collapsed?: boolean }>`
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  max-width: ${({ $collapsed }) => ($collapsed ? '0' : '100px')};
  opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        opacity: 1;
        max-width: 100px;
      }
    `}
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
  padding: ${({ $collapsed }) =>
    $collapsed ? '0.75rem' : '0.75rem 1.5rem'} !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}4d;
  justify-content: center;
  display: flex;
  align-items: center;
  min-width: ${({ $collapsed }) => ($collapsed ? '48px' : 'auto')};
  transition:
    margin 0.2s ease,
    padding 0.2s ease,
    min-width 0.2s ease;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        margin: 0 1rem 1.5rem;
        padding: 0.75rem 1.5rem !important;
        min-width: auto;
      }
    `}

  &:hover {
    box-shadow: 0 6px 16px ${({ theme }) => theme.colors.primary}66;
    transform: translateY(-1px);
  }
`;

export const NavSection = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
`;

export const StyledNavLink = styled(Nav.Link)<{
  $active?: boolean;
  $collapsed?: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? 'center' : 'space-between'};
  padding: 0.75rem ${({ $collapsed }) => ($collapsed ? '0.75rem' : '1.5rem')} !important;
  color: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : props.theme.colors.textPrimary} !important;
  background: ${(props) =>
    props.$active ? `${props.theme.colors.primary}15` : 'transparent'};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  border-radius: ${({ $collapsed }) => ($collapsed ? '12px' : '0 24px 24px 0')};
  margin-right: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.75rem')};
  margin-left: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0')};
  transition: all 0.2s ease;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        justify-content: space-between;
        padding: 0.75rem 1.5rem !important;
        border-radius: 0 24px 24px 0;
        margin-right: 0.75rem;
        margin-left: 0;
      }
    `}

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const NavIcon = styled.span<{ $collapsed?: boolean }>`
  margin-right: 0.75rem;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.25rem;
  transition: margin-right 0.2s ease;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      margin-right: 0;

      ${SidebarContent}:hover & {
        margin-right: 0.75rem;
      }
    `}
`;

export const NavLabel = styled.span<{ $collapsed?: boolean }>`
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  max-width: ${({ $collapsed }) => ($collapsed ? '0' : '120px')};
  opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        opacity: 1;
        max-width: 120px;
      }
    `}
`;

export const UnreadBadge = styled.span<{ $collapsed?: boolean }>`
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  max-width: ${({ $collapsed }) => ($collapsed ? '0' : '50px')};
  opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        opacity: 1;
        max-width: 50px;
      }
    `}
`;

export const SidebarFooter = styled.div<{ $collapsed?: boolean }>`
  padding: 0.5rem;
  display: flex;
  flex-direction: ${({ $collapsed }) => ($collapsed ? 'column' : 'row')};
  align-items: center;
  gap: ${({ theme, $collapsed }) => ($collapsed ? '0' : theme.spacing.sm)};
  transition:
    padding 0.2s ease,
    gap 0.2s ease;
  overflow: visible;
  position: relative;
  z-index: 1;

  > .dropup {
    max-width: 100%;
    overflow: visible;
  }
`;

export const UserDropdownToggle = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme, $collapsed }) => ($collapsed ? '0' : theme.spacing.md)};
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};
  cursor: pointer;
  flex: 1;
  min-width: 0;
  transition:
    background 0.15s ease,
    gap 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }

  /* Hide the dropdown caret */
  &::after {
    display: none !important;
  }

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      justify-content: center;
      padding: ${({ theme }) => theme.spacing.xs};

      ${SidebarContent}:hover & {
        gap: ${({ theme }) => theme.spacing.md};
      }
    `}
`;

export const UserAvatar = styled.div<{ $collapsed?: boolean }>`
  width: ${({ $collapsed }) => ($collapsed ? '32px' : '36px')};
  height: ${({ $collapsed }) => ($collapsed ? '32px' : '36px')};
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.primaryDark}
  );
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ${({ $collapsed }) => ($collapsed ? '0.75rem' : '0.85rem')};
  flex-shrink: 0;
  transition:
    width 0.2s ease,
    height 0.2s ease,
    font-size 0.2s ease;
`;

export const UserInfo = styled.div<{ $collapsed?: boolean }>`
  flex: ${({ $collapsed }) => ($collapsed ? '0' : '1')};
  min-width: 0;
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease,
    flex 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  max-width: ${({ $collapsed }) => ($collapsed ? '0' : '150px')};
  opacity: ${({ $collapsed }) => ($collapsed ? '0' : '1')};

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      ${SidebarContent}:hover & {
        opacity: 1;
        max-width: 150px;
        flex: 1;
      }
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

// Popover menu styles
export const UserPopoverMenu = styled.div`
  min-width: 240px;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  display: flex;
  flex-direction: column;
`;

export const PopoverHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const PopoverUserName = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const PopoverUserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const PopoverMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }

  svg {
    width: 16px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const PopoverDivider = styled.hr`
  margin: ${({ theme }) => theme.spacing.xs} 0;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const PopoverLogoutItem = styled(PopoverMenuItem)`
  color: ${({ theme }) => theme.colors.danger};

  svg {
    color: ${({ theme }) => theme.colors.danger};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.danger}10;
  }
`;

// Collapse button that floats on the divider
export const CollapseHandle = styled.div<{ $collapsed?: boolean }>`
  position: absolute;
  top: 0;
  right: -12px;
  bottom: 0;
  width: 24px;
  cursor: ew-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0;
    width: 1px;
    background: ${({ theme }) => theme.colors.border};
    transition: all 0.15s ease;
  }

  &:hover {
    &::before {
      width: 3px;
      background: ${({ theme }) => theme.colors.primary};
    }
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

export const CollapseButtonIcon = styled.div<{ $collapsed?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  opacity: 0;
  transition: all 0.15s ease;
  position: relative;
  z-index: 1;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${CollapseHandle}:hover & {
    opacity: 1;
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: white;
  }
`;
