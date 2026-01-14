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
