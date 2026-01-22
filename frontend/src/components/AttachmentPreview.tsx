import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Spinner, ButtonGroup } from 'react-bootstrap';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../core/components/Button';
import type { Attachment } from '../__generated__/graphql';
import { useQuery } from '@apollo/client/react';
import { gql } from '../__generated__';
import { supabase } from '../contexts/AuthContext';
import {
  PreviewContainer,
  ImageContainer,
  PreviewImage,
  PreviewVideo,
  PreviewIframe,
  LoadingContainer,
  ErrorContainer,
  ZoomControls,
  ZoomLevel,
  FileMetadata,
} from './AttachmentPreview.wrappers';

const GET_ATTACHMENT_DOWNLOAD_URL = gql(`
  query GetAttachmentDownloadUrl($id: String!) {
    getAttachmentDownloadUrl(id: $id)
  }
`);

interface AttachmentPreviewProps {
  attachment: Attachment;
  onClose: () => void;
  onDownload?: () => void;
}

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  onClose,
  onDownload,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const { data, loading, error } = useQuery(GET_ATTACHMENT_DOWNLOAD_URL, {
    variables: { id: attachment.id },
  });

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Fetch the attachment and create an object URL
  useEffect(() => {
    if (!data?.getAttachmentDownloadUrl) return;

    const fetchAttachment = async () => {
      try {
        const url = data.getAttachmentDownloadUrl;

        // Check if this is an S3 presigned URL (contains X-Amz-Algorithm query param)
        // S3 presigned URLs already contain authentication via query parameters,
        // so we must NOT send an Authorization header (S3 rejects requests with multiple auth mechanisms)
        // Local backend URLs require Supabase auth header
        const isS3PresignedUrl = url.includes('X-Amz-Algorithm');

        console.log('[AttachmentPreview] Fetching attachment:', {
          url,
          isS3PresignedUrl,
        });

        let response: Response;

        if (isS3PresignedUrl) {
          // S3 presigned URL - no auth header needed
          response = await fetch(url);
        } else {
          // Local backend URL - requires Supabase auth
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const token = session?.access_token;

          if (!token) {
            throw new Error('No authentication token available');
          }

          response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }

        console.log('[AttachmentPreview] Response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AttachmentPreview] Error response:', errorText);
          throw new Error(
            `Failed to fetch attachment: ${response.status} ${response.statusText}`,
          );
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err) {
        console.error('[AttachmentPreview] Error fetching attachment:', err);
        setFetchError(
          err instanceof Error ? err.message : 'Failed to load attachment',
        );
      }
    };

    fetchAttachment();

    // Cleanup: revoke object URL when component unmounts
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [data]);

  const renderPreview = () => {
    if (
      loading ||
      (data?.getAttachmentDownloadUrl && !previewUrl && !fetchError)
    ) {
      return (
        <LoadingContainer>
          <Spinner animation="border" variant="primary" />
          <span>Loading preview...</span>
        </LoadingContainer>
      );
    }

    if (error || fetchError || !previewUrl) {
      return (
        <ErrorContainer>
          <p>{fetchError || error?.message || 'Failed to load preview'}</p>
        </ErrorContainer>
      );
    }

    const mimeType = attachment.mimeType;

    // Image preview with zoom
    if (mimeType.startsWith('image/')) {
      return (
        <ImageContainer>
          <PreviewImage
            src={previewUrl}
            alt={attachment.filename}
            $zoom={zoom}
          />
        </ImageContainer>
      );
    }

    // Video preview
    if (mimeType.startsWith('video/')) {
      return (
        <PreviewVideo src={previewUrl} controls>
          Your browser does not support the video tag.
        </PreviewVideo>
      );
    }

    // PDF preview
    if (mimeType.includes('pdf')) {
      return <PreviewIframe src={previewUrl} title={attachment.filename} />;
    }

    // Text preview
    if (mimeType.startsWith('text/')) {
      return <PreviewIframe src={previewUrl} title={attachment.filename} />;
    }

    return (
      <ErrorContainer>
        <p>Preview not available for this file type</p>
      </ErrorContainer>
    );
  };

  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <Modal show={true} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <div>
            {attachment.filename}
            <FileMetadata>
              {attachment.mimeType} • {Math.round(attachment.size / 1024)} KB
            </FileMetadata>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <PreviewContainer>{renderPreview()}</PreviewContainer>
      </Modal.Body>
      <Modal.Footer>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
          {/* Zoom controls for images */}
          {isImage && previewUrl && !loading && !error && !fetchError && (
            <ZoomControls>
              <ButtonGroup size="sm">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setZoom(Math.max(25, zoom - 25))}
                  disabled={zoom <= 25}
                  title="Zoom out"
                  icon={<ZoomOut size={16} />}
                />
                <Button variant="outline-secondary" size="sm" disabled>
                  <ZoomLevel>{zoom}%</ZoomLevel>
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
                  disabled={zoom >= 200}
                  title="Zoom in"
                  icon={<ZoomIn size={16} />}
                />
              </ButtonGroup>
            </ZoomControls>
          )}
          <div style={{ flex: 1 }} />
          {onDownload && (
            <Button variant="primary" onClick={onDownload} icon={<Download size={16} />}>
              Download
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};
