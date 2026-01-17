import styled from 'styled-components';
import { Card } from 'react-bootstrap';

export const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
`;

export const AuthCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

export const SignUpCard = styled(Card)`
  width: 100%;
  max-width: 480px;
  border: none;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
`;

export const Logo = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  text-align: center;
  margin-bottom: 0.5rem;
`;

export const Tagline = styled.p`
  color: #6c757d;
  text-align: center;
  margin-bottom: 2rem;
`;

export const SavedUsersSection = styled.div`
  margin-bottom: 1.5rem;
`;

export const SavedUsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SavedUserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: #e9ecef;
  }
`;

export const SavedUserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

export const SavedUserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const SavedUserName = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SavedUserEmail = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SavedUserRemove = styled.button`
  background: none;
  border: none;
  color: #adb5bd;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  transition: color 0.15s ease;
  flex-shrink: 0;

  &:hover {
    color: #dc3545;
  }
`;

export const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: #adb5bd;
  font-size: 0.85rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #dee2e6;
  }

  span {
    padding: 0 1rem;
  }
`;

export const RememberMeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

export const OfflineNotice = styled.div`
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;
