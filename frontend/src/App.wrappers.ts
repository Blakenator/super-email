import styled from 'styled-components';
import { Nav, Button } from 'react-bootstrap';

export const AppWrapper = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

export const Sidebar = styled.div`
  width: 240px;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
`;

export const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  padding: 0.5rem 1.5rem 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1rem;
`;

export const ComposeButton = styled(Button)`
  margin: 0 1rem 1.5rem;
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.primaryDark} 100%
  ) !important;
  border: none !important;
  border-radius: 24px !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.primary}4d;

  &:hover {
    box-shadow: 0 6px 16px ${({ theme }) => theme.colors.primary}66;
    transform: translateY(-1px);
  }
`;

export const NavSection = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const StyledNavLink = styled(Nav.Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem !important;
  color: ${(props) =>
    props.$active
      ? props.theme.colors.primary
      : props.theme.colors.textPrimary} !important;
  background: ${(props) =>
    props.$active ? `${props.theme.colors.primary}15` : 'transparent'};
  font-weight: ${(props) => (props.$active ? '600' : '400')};
  border-radius: 0 24px 24px 0;
  margin-right: 0.75rem;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const NavIcon = styled.span`
  margin-right: 0.75rem;
  font-size: 1.1rem;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;
