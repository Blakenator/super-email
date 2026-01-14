import styled from 'styled-components';
import { ButtonGroup } from 'react-bootstrap';

export const AttachmentContainer = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const AttachmentHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const AttachmentTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ViewToggle = styled(ButtonGroup)`
  .btn {
    padding: 0.375rem 0.5rem;
  }
`;

export const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundGray};
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
  min-width: 0;
`;

export const FileIcon = styled.div`
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const FileDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

export const FileName = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const FileSize = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-left: ${({ theme }) => theme.spacing.md};
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};

  .card {
    transition: all 0.2s;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
`;
