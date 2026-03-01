import React from 'react';
import {
  File,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileText,
  Image,
  Music,
  Presentation,
  Video,
} from 'lucide-react';

export const getFileIcon = (
  mimeType: string,
  filename: string = '',
  size: number = 20,
): React.ReactElement => {
  const props = { size };
  const lowerFilename = filename.toLowerCase();

  if (mimeType.startsWith('image/')) return <Image {...props} />;
  if (mimeType.startsWith('video/')) return <Video {...props} />;
  if (mimeType.startsWith('audio/')) return <Music {...props} />;
  if (mimeType.includes('pdf')) return <FileText {...props} />;

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    lowerFilename.endsWith('.csv') ||
    lowerFilename.endsWith('.xls') ||
    lowerFilename.endsWith('.xlsx')
  )
    return <FileSpreadsheet {...props} />;

  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    lowerFilename.endsWith('.ppt') ||
    lowerFilename.endsWith('.pptx')
  )
    return <Presentation {...props} />;

  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive') ||
    lowerFilename.endsWith('.zip') ||
    lowerFilename.endsWith('.rar') ||
    lowerFilename.endsWith('.7z') ||
    lowerFilename.endsWith('.tar') ||
    lowerFilename.endsWith('.gz')
  )
    return <FileArchive {...props} />;

  if (
    mimeType.includes('javascript') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    lowerFilename.endsWith('.js') ||
    lowerFilename.endsWith('.ts') ||
    lowerFilename.endsWith('.jsx') ||
    lowerFilename.endsWith('.tsx') ||
    lowerFilename.endsWith('.html') ||
    lowerFilename.endsWith('.css') ||
    lowerFilename.endsWith('.py') ||
    lowerFilename.endsWith('.java') ||
    lowerFilename.endsWith('.cpp') ||
    lowerFilename.endsWith('.c') ||
    lowerFilename.endsWith('.go') ||
    lowerFilename.endsWith('.rs')
  )
    return <FileCode {...props} />;

  return <File {...props} />;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const canPreview = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.includes('pdf') ||
    mimeType.startsWith('text/')
  );
};
