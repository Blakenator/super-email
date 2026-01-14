import styled from 'styled-components';
import { Badge, Button } from 'react-bootstrap';

export const EmailItemWrapper = styled.div<{ $isUnread: boolean; $isSelected: boolean }>`
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${(props) =>
    props.$isSelected
      ? `${props.theme.colors.primary}15`
      : props.$isUnread
        ? props.theme.colors.unreadBackground
        : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  position: relative;

  &:hover {
    background: ${({ theme, $isSelected }) =>
      $isSelected ? `${theme.colors.primary}20` : theme.colors.backgroundHover};
  }

  &:hover .quick-actions {
    opacity: 1;
  }
`;

export const SelectionCheckbox = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: -16px;
  margin-right: 4px;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  .form-check {
    margin: 0;
    padding: 0;
    pointer-events: none;
  }
`;

export const EmailContent = styled.div`
  flex: 1;
  min-width: 0;
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
    props.$isStarred
      ? props.theme.colors.star
      : props.theme.colors.starInactive};
  cursor: pointer;
  margin-right: ${({ theme }) => theme.spacing.sm};
  font-size: 1.2rem;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;

export const AccountBadge = styled(Badge)`
  font-size: 0.7rem;
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const ThreadBadge = styled(Badge)`
  font-size: 0.65rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.textSecondary} !important;
`;

export const AttachmentBadge = styled(Badge)`
  font-size: 0.65rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.textSecondary} !important;
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

export const QuickActions = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing.lg};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  opacity: 0;
  transition: opacity 0.15s ease;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  padding: ${({ theme }) => theme.spacing.xs};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const ActionButton = styled(Button)`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
`;

export const FolderBadge = styled(Badge)`
  font-size: 0.65rem;
  padding: 0.25em 0.5em;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

export const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

export const TagBadge = styled(Badge)<{ $color: string }>`
  font-size: 0.65rem;
  padding: 0.2em 0.5em;
  background-color: ${({ $color }) => $color} !important;
`;

// Dense list item styled components
export const DenseRow = styled.div<{ $isUnread: boolean; $isSelected: boolean }>`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${(props) =>
    props.$isSelected
      ? `${props.theme.colors.primary}15`
      : props.$isUnread
        ? props.theme.colors.unreadBackground
        : props.theme.colors.backgroundWhite};
  font-weight: ${(props) => (props.$isUnread ? '600' : '400')};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  gap: ${({ theme }) => theme.spacing.sm};
  position: relative;

  &:hover {
    background: ${({ theme, $isSelected }) =>
      $isSelected ? `${theme.colors.primary}20` : theme.colors.backgroundHover};
  }

  &:hover .quick-actions {
    opacity: 1;
  }
`;

export const SelectionCell = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin: -12px;
  margin-right: 4px;
  cursor: pointer;
  min-width: 40px;
  min-height: 40px;

  &:hover {
    background: ${({ theme }) => theme.colors.primary}10;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }

  .form-check {
    margin: 0;
    padding: 0;
    pointer-events: none;
  }
`;

export const StarCell = styled.span<{ $isStarred: boolean }>`
  color: ${(props) =>
    props.$isStarred
      ? props.theme.colors.star
      : props.theme.colors.starInactive};
  cursor: pointer;
  flex-shrink: 0;
  width: 20px;

  &:hover {
    color: ${({ theme }) => theme.colors.star};
  }
`;

export const SenderCell = styled.span`
  width: 180px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const SubjectCell = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const PreviewCell = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const DateCell = styled.span`
  width: 80px;
  flex-shrink: 0;
  text-align: right;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const DenseAccountBadge = styled(Badge)`
  font-size: 0.65rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

export const DenseThreadBadge = styled(Badge)`
  font-size: 0.55rem;
  margin-left: ${({ theme }) => theme.spacing.xs};
  background-color: ${({ theme }) => theme.colors.textSecondary} !important;
  flex-shrink: 0;
`;

export const DenseQuickActions = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
  background: ${({ theme }) => theme.colors.backgroundWhite};
  padding: 2px;
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const DenseActionButton = styled(Button)`
  padding: 0.15rem 0.35rem;
  font-size: 0.65rem;
`;

export const DenseFolderBadge = styled(Badge)`
  font-size: 0.6rem;
  padding: 0.2em 0.4em;
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`;

export const DenseTagBadge = styled(Badge)<{ $color: string }>`
  font-size: 0.55rem;
  padding: 0.15em 0.4em;
  background-color: ${({ $color }) => $color} !important;
  margin-left: 4px;
`;
