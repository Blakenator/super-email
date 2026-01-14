import styled from 'styled-components';

export const PreviewContainer = styled.div`
  width: 100%;
  height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.backgroundGray};
  border-radius: 6px;
  overflow: hidden;
`;

export const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
`;

export const PreviewImage = styled.img<{ $zoom: number }>`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(${(props) => props.$zoom / 100});
  transition: transform 0.2s;
`;

export const PreviewVideo = styled.video`
  max-width: 100%;
  max-height: 100%;
`;

export const PreviewIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
`;

export const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  height: 100%;
`;

export const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
`;

export const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};

  .btn {
    padding: 0.25rem 0.5rem;
  }
`;

export const ZoomLevel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  min-width: 3rem;
  text-align: center;
`;

export const FileMetadata = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;
