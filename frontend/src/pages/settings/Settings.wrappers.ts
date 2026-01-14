import styled from 'styled-components';
import { Card } from 'react-bootstrap';

export const PageWrapper = styled.div`
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

export const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

export const SectionCard = styled(Card)`
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  margin-bottom: 1.5rem;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.background};
  border-radius: 8px;
  margin-bottom: 1.5rem;
`;

export const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
`;

export const ProgressStepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 0;
`;

export const ProgressStep = styled.div<{
  $status: 'pending' | 'active' | 'success' | 'error';
}>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: ${(props) => {
    switch (props.$status) {
      case 'active':
        return '#e3f2fd';
      case 'success':
        return '#e8f5e9';
      case 'error':
        return '#ffebee';
      default:
        return '#f5f5f5';
    }
  }};
  transition: all 0.3s ease;
`;

export const StepIcon = styled.div<{
  $status: 'pending' | 'active' | 'success' | 'error';
}>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: ${(props) => {
    switch (props.$status) {
      case 'active':
        return '#1976d2';
      case 'success':
        return '#2e7d32';
      case 'error':
        return '#c62828';
      default:
        return '#9e9e9e';
    }
  }};
`;

export const StepContent = styled.div`
  flex: 1;
`;

export const StepTitle = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
`;

export const StepSubtitle = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 0.25rem;
`;

export const AccountCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

export const SmtpCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

export const AuthMethodCard = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: 0.75rem;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

export const AuthMethodIcon = styled.div<{ $provider: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;
  background: ${({ $provider }) => {
    switch ($provider) {
      case 'GOOGLE':
        return '#fff';
      case 'GITHUB':
        return '#24292e';
      case 'APPLE':
        return '#000';
      case 'MICROSOFT':
        return '#00a4ef';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: ${({ $provider }) => {
    switch ($provider) {
      case 'GOOGLE':
        return '#4285f4';
      case 'GITHUB':
        return '#fff';
      case 'APPLE':
        return '#fff';
      case 'MICROSOFT':
        return '#fff';
      default:
        return '#fff';
    }
  }};
  border: ${({ $provider }) => ($provider === 'GOOGLE' ? '1px solid #e0e0e0' : 'none')};
`;

export const AuthMethodInfo = styled.div`
  flex: 1;
`;

export const AuthMethodName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
`;

export const AuthMethodEmail = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const AuthMethodMeta = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 0.25rem;
`;
