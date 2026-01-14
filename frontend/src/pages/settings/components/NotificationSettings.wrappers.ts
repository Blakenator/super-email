import styled from 'styled-components';
import { Card, ListGroup } from 'react-bootstrap';

export const StatusCard = styled(Card)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const StatusItem = styled(ListGroup.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const StatusLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const StatusValue = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;
