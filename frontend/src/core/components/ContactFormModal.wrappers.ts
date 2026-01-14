import styled from 'styled-components';
import { ListGroup } from 'react-bootstrap';

export const SearchInput = styled.div`
  position: relative;
  margin-bottom: 1rem;

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    padding-left: 36px;
  }
`;

export const ContactListItem = styled(ListGroup.Item)<{ $selected?: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;

  ${({ $selected, theme }) =>
    $selected &&
    `
    background: ${theme.colors.primary}10;
    border-color: ${theme.colors.primary};
  `}

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const ContactAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary}20;
  color: ${({ theme }) => theme.colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const ContactInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ContactName = styled.div`
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ContactEmails = styled.div`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NoContacts = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.textMuted};
`;
