import React, { useState } from 'react';
import { Card, Badge, Collapse } from 'react-bootstrap';
import {
  Download,
  FileText,
  Image,
  Video,
  File,
  Eye,
  Grid3x3,
  List,
  FileSpreadsheet,
  FileArchive,
  FileCode,
  Music,
  Presentation,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../core/components/Button';
import type { Attachment } from '../__generated__/graphql';
import {
  AttachmentContainer,
  AttachmentHeader,
  AttachmentTitle,
  ViewToggle,
  ListContainer,
  ListItem,
  FileInfo,
  FileIcon,
  FileDetails,
  FileName,
  FileSize,
  ActionButtons,
  GridContainer,
} from './AttachmentList.wrappers';

interface AttachmentListProps {
  attachments: Attachment[];
  onPreview?: (attachment: Attachment) => void;
  onDownload?: (attachment: Attachment) => void;
}

type ViewMode = 'list' | 'grid';

const getFileIcon = (mimeType: string, filename: string, size: number = 20) => {
  const props = { size };
  const lowerFilename = filename.toLowerCase();
  
  // Images
  if (mimeType.startsWith('image/')) return <Image {...props} />;
  
  // Videos
  if (mimeType.startsWith('video/')) return <Video {...props} />;
  
  // Audio
  if (mimeType.startsWith('audio/')) return <Music {...props} />;
  
  // PDF
  if (mimeType.includes('pdf')) return <FileText {...props} />;
  
  // Spreadsheets (Excel, CSV, etc.)
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    lowerFilename.endsWith('.csv') ||
    lowerFilename.endsWith('.xls') ||
    lowerFilename.endsWith('.xlsx')
  ) return <FileSpreadsheet {...props} />;
  
  // Presentations (PowerPoint, etc.)
  if (
    mimeType.includes('presentation') ||
    mimeType.includes('powerpoint') ||
    lowerFilename.endsWith('.ppt') ||
    lowerFilename.endsWith('.pptx')
  ) return <Presentation {...props} />;
  
  // Archives (zip, rar, etc.)
  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('archive') ||
    lowerFilename.endsWith('.zip') ||
    lowerFilename.endsWith('.rar') ||
    lowerFilename.endsWith('.7z') ||
    lowerFilename.endsWith('.tar') ||
    lowerFilename.endsWith('.gz')
  ) return <FileArchive {...props} />;
  
  // Code files
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
  ) return <FileCode {...props} />;
  
  // Default file icon
  return <File {...props} />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const canPreview = (mimeType: string): boolean => {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.includes('pdf') ||
    mimeType.startsWith('text/')
  );
};

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onPreview,
  onDownload,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isExpanded, setIsExpanded] = useState(true);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <AttachmentContainer>
      <AttachmentHeader>
        <AttachmentTitle
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          <Paperclip size={16} />
          Attachments ({attachments.length})
        </AttachmentTitle>
        <ViewToggle size="sm">
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
            onClick={() => setViewMode('list')}
            title="List view"
            icon={<List size={16} />}
          />
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
            onClick={() => setViewMode('grid')}
            title="Grid view"
            icon={<Grid3x3 size={16} />}
          />
        </ViewToggle>
      </AttachmentHeader>
      <Collapse in={isExpanded}>
        <div>

      {viewMode === 'list' ? (
        <ListContainer>
          {attachments.map((attachment) => (
            <ListItem key={attachment.id}>
              <FileInfo>
                <FileIcon>{getFileIcon(attachment.mimeType, attachment.filename)}</FileIcon>
                <FileDetails>
                  <FileName>{attachment.filename}</FileName>
                  <FileSize>{formatFileSize(attachment.size)}</FileSize>
                </FileDetails>
              </FileInfo>
              <ActionButtons>
                {canPreview(attachment.mimeType) && onPreview && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => onPreview(attachment)}
                    title="Preview"
                    icon={<Eye size={16} />}
                  />
                )}
                {onDownload && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => onDownload(attachment)}
                    title="Download"
                    icon={<Download size={16} />}
                  />
                )}
              </ActionButtons>
            </ListItem>
          ))}
        </ListContainer>
      ) : (
        <GridContainer>
          {attachments.map((attachment) => (
            <Card
              key={attachment.id}
              style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() =>
                canPreview(attachment.mimeType) && onPreview?.(attachment)
              }
            >
              {canPreview(attachment.mimeType) && (
                <Badge
                  bg="primary"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    zIndex: 1,
                  }}
                >
                  <Eye size={12} />
                </Badge>
              )}
              <Card.Body className="text-center">
                <div style={{ marginBottom: '1rem', color: 'var(--bs-secondary)' }}>
                  {getFileIcon(attachment.mimeType, attachment.filename, 48)}
                </div>
                <Card.Title style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  {attachment.filename.length > 20
                    ? attachment.filename.substring(0, 20) + '...'
                    : attachment.filename}
                </Card.Title>
                <Card.Text style={{ fontSize: '0.75rem', color: 'var(--bs-secondary)' }}>
                  {formatFileSize(attachment.size)}
                </Card.Text>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {canPreview(attachment.mimeType) && onPreview && (
                  <Button
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(attachment);
                    }}
                    title="Preview"
                    icon={<Eye size={14} />}
                  />
                )}
                {onDownload && (
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(attachment);
                    }}
                    title="Download"
                    icon={<Download size={14} />}
                  />
                )}
                </div>
              </Card.Body>
            </Card>
          ))}
        </GridContainer>
      )}
        </div>
      </Collapse>
    </AttachmentContainer>
  );
};
