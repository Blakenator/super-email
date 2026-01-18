import styled from 'styled-components';
import { Card } from 'react-bootstrap';

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gradient};
  padding: 2rem 0;
`;

export const AuthCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const SignUpCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

export const Logo = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const Tagline = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

export const SavedUsersSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

export const SavedUsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SavedUserItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundHover};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundGray};
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

export const SavedUserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.gradient};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  margin-right: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
`;

export const SavedUserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SavedUserName = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SavedUserEmail = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SavedUserRemove = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: ${({ theme }) => theme.spacing.lg} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  span {
    padding: 0 ${({ theme }) => theme.spacing.md};
  }
`;

export const RememberMeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const OfflineNotice = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
