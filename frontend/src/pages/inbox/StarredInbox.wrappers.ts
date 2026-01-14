import styled from 'styled-components';
import { ListGroup } from 'react-bootstrap';

export const EmailItem = styled(ListGroup.Item)<{ $isUnread: boolean }>`
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: none;
  border-right: none;
  background: ${(props) =>
    props.$isUnread
      ? props.theme.colors.unreadBackground
      : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const EmailMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

export const SenderName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const EmailDate = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 400;
`;

export const Subject = styled.div`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const Preview = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
`;

export const StarButton = styled.span<{ $isStarred: boolean }>`
  color: ${(props) =>
    props.$isStarred ? props.theme.colors.star : props.theme.colors.starInactive};
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};
  font-size: 1.2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;
