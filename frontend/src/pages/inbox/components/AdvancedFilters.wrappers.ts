import styled from 'styled-components';
import { Badge, Form } from 'react-bootstrap';

export const FilterWrapper = styled.div`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

export const FilterToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

export const FilterContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

export const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const ActiveFilterBadge = styled(Badge)`
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

export const FilterLabel = styled(Form.Label)`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0.25rem;
`;
