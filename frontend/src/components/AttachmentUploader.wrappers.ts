import styled from 'styled-components';

export const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const DropZone = styled.div<{ $active: boolean }>`
  position: relative;
  border: 2px dashed
    ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  transition: all ${({ theme }) => theme.transitions.fast};
  background: ${({ $active, theme }) =>
    $active
      ? theme.mode === 'dark'
        ? 'rgba(129, 140, 248, 0.08)'
        : 'rgba(102, 126, 234, 0.04)'
      : 'transparent'};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textMuted};
  }

  input[type='file'] {
    display: none;
  }
`;

export const DropZoneContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const DropZoneText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  strong {
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export const DropZoneHint = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const ErrorMessage = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.danger};
  background: ${({ theme }) =>
    theme.mode === 'dark' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(220, 53, 69, 0.06)'};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
`;

export const AttachmentsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const AttachmentsTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const AttachmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const AttachmentCard = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.backgroundGray};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all ${({ theme }) => theme.transitions.fast};
  overflow: hidden;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
    box-shadow: ${({ theme }) => theme.shadows.sm};
  }
`;

export const RemoveButton = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  opacity: 0;
  transition: all ${({ theme }) => theme.transitions.fast};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  z-index: 1;

  ${AttachmentCard}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }
`;

export const PreviewArea = styled.div`
  width: 100%;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  background: ${({ theme }) =>
    theme.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

export const IconPreview = styled.div`
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const CardFileName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
`;

export const CardFileSize = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.3;
`;
