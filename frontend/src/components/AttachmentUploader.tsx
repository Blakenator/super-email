import React, { useRef, useState } from 'react';
import { Upload, X, File, Image, Video, FileText } from 'lucide-react';

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
  maxSize?: number; // in MB
  maxFiles?: number;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  attachments,
  onAdd,
  onRemove,
  maxSize = 25, // 25MB default
  maxFiles = 10,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError(null);

    const fileArray = Array.from(files);
    const maxSizeBytes = maxSize * 1024 * 1024;

    // Validate file sizes
    const oversizedFiles = fileArray.filter((file) => file.size > maxSizeBytes);
    if (oversizedFiles.length > 0) {
      setError(`Some files exceed the maximum size of ${maxSize}MB`);
      return;
    }

    // Validate total number of files
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
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div className="text-center">
            <button
              type="button"
              onClick={handleButtonClick}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Choose files
            </button>
            <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Maximum {maxSize}MB per file, up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded">
          {error}
        </div>
      )}

      {/* Attached files list */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Attached Files ({attachments.length})
          </h4>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                  {getFileIcon(attachment.mimeType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemove(attachment.id)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
