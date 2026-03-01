import React, { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { getFileIcon, formatFileSize } from './attachmentUtils';
import {
  UploaderContainer,
  DropZone,
  DropZoneContent,
  DropZoneText,
  DropZoneHint,
  ErrorMessage,
  AttachmentsHeader,
  AttachmentsTitle,
  AttachmentGrid,
  AttachmentCard,
  RemoveButton,
  PreviewArea,
  IconPreview,
  CardFileName,
  CardFileSize,
} from './AttachmentUploader.wrappers';

export interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  mimeType: string;
  preview?: string;
}

interface AttachmentUploaderProps {
  attachments: AttachmentFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  maxSize?: number;
  maxFiles?: number;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onAdd,
  onRemove,
  maxSize = 25,
  maxFiles = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    const newPreviews: Record<string, string> = {};
    const urls: string[] = [];

    attachments.forEach((att) => {
      if (att.preview) {
        newPreviews[att.id] = att.preview;
      } else if (att.mimeType.startsWith('image/')) {
        const url = URL.createObjectURL(att.file);
        newPreviews[att.id] = url;
        urls.push(url);
      }
    });

    setPreviews((prev) => {
      const merged = { ...prev };
      for (const id of Object.keys(merged)) {
        if (!attachments.find((a) => a.id === id)) {
          delete merged[id];
        }
      }
      return { ...merged, ...newPreviews };
    });

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const fileArray = Array.from(files);
    const maxSizeBytes = maxSize * 1024 * 1024;

    const oversizedFiles = fileArray.filter((file) => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the maximum size of ${maxSize}MB`);
      return;
    }

    if (attachments.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    onAdd(fileArray);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <UploaderContainer>
      <DropZone
        $active={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          onClick={(e) => e.stopPropagation()}
        />
        <DropZoneContent>
          <Upload size={24} />
          <DropZoneText>
            <strong>Choose files</strong> or drag and drop
          </DropZoneText>
          <DropZoneHint>
            Max {maxSize}MB per file · up to {maxFiles} files
          </DropZoneHint>
        </DropZoneContent>
      </DropZone>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {attachments.length > 0 && (
        <>
          <AttachmentsHeader>
            <AttachmentsTitle>
              {attachments.length} file{attachments.length !== 1 ? 's' : ''}{' '}
              attached
            </AttachmentsTitle>
          </AttachmentsHeader>

          <AttachmentGrid>
            {attachments.map((attachment) => (
              <AttachmentCard key={attachment.id}>
                <RemoveButton
                  type="button"
                  onClick={() => onRemove(attachment.id)}
                  title="Remove"
                >
                  <X size={12} />
                </RemoveButton>

                <PreviewArea>
                  {previews[attachment.id] ? (
                    <img
                      src={previews[attachment.id]}
                      alt={attachment.name}
                      loading="lazy"
                    />
                  ) : (
                    <IconPreview>
                      {getFileIcon(attachment.mimeType, attachment.name, 32)}
                    </IconPreview>
                  )}
                </PreviewArea>

                <CardFileName title={attachment.name}>
                  {attachment.name}
                </CardFileName>
                <CardFileSize>{formatFileSize(attachment.size)}</CardFileSize>
              </AttachmentCard>
            ))}
          </AttachmentGrid>
        </>
      )}
    </UploaderContainer>
  );
};
