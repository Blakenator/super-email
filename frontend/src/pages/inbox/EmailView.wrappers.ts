import styled from 'styled-components';
import { Alert, Badge } from 'react-bootstrap';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

export const Toolbar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-shrink: 0;
  flex-wrap: wrap;
`;

export const ToolbarSpacer = styled.div`
  flex: 1;
`;

export const EmailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

export const Subject = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const MetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const SenderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const SenderRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const SenderName = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const SenderEmail = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const Recipients = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const EmailDate = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: right;
`;

export const Body = styled.div`
  white-space: pre-wrap;
  line-height: 1.7;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const HtmlBodyContainer = styled.div`
  max-height: calc(100vh - 300px);
  overflow: auto;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
`;

export const UnsubscribeBanner = styled(Alert)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ThreadContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const ThreadEmail = styled.div<{ $isSelected?: boolean }>`
  border: ${(props) => (props.$isSelected ? '2px' : '1px')} solid
    ${(props) =>
      props.$isSelected
        ? props.theme.colors.primary
        : props.theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  position: relative;
  background: ${(props) =>
    props.$isSelected
      ? `${props.theme.colors.primary}08`
      : props.theme.colors.backgroundWhite};
`;

export const CurrentEmailBadge = styled(Badge)`
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 4px 8px;
`;

export const NewEmailBadge = styled(Badge)`
  position: absolute;
  top: -8px;
  left: 12px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 4px 8px;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
`;

export const ThreadEmailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const ThreadEmailMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const CollapsedPreview = styled.div`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
`;

export const HeadersTable = styled.table`
  width: 100%;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-collapse: collapse;

  th,
  td {
    padding: ${({ theme }) => theme.spacing.sm};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
    text-align: left;
    vertical-align: top;
  }

  th {
    width: 140px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
    white-space: nowrap;
    background: ${({ theme }) => theme.colors.background};
  }

  td {
    word-break: break-word;
  }
`;

export const HeaderValue = styled.pre`
  margin: 0;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
`;

export const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

export const TagBadge = styled(Badge)<{ $bgColor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0.4em 0.6em;
  font-weight: 500;
  background-color: ${({ $bgColor }) => $bgColor} !important;
`;

export const TagRemoveBtn = styled.button`
  border: none;
  background: none;
  padding: 0;
  margin-left: 2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.7rem;

  &:hover {
    color: white;
  }
`;

// Per-email action buttons container
export const EmailActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-left: auto;
  flex-shrink: 0;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }
`;

export const ActionButtonDanger = styled(ActionButton)`
  &:hover {
    background: ${({ theme }) => theme.colors.danger}15;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

export const MoreActionsDropdown = styled.div`
  position: relative;
  display: inline-block;

  .dropdown-menu {
    min-width: 160px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.fontSizes.sm};

    svg {
      width: 14px;
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }

  .dropdown-item.text-danger svg {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

// Global header subject for thread view (used inside StickyHeader)
export const GlobalHeaderSubject = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin: 0;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ThreadCount = styled(Badge)`
  flex-shrink: 0;
`;
