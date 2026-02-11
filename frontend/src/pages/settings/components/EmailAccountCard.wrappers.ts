import styled from 'styled-components';

export const AccountCardStyled = styled.div<{ $isSyncing?: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;

  ${({ $isSyncing }) =>
    $isSyncing &&
    `
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
  `}

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const AccountCardHeader = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
`;

export const AccountCardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

export const AccountCardSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
`;

export const AccountCardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

export const AccountDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const AccountDetailLabel = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`;

export const AccountCardFooter = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

export const AccountCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;

export const SyncStatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const SyncStatusHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SyncStatusText = styled.span`
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 500;
`;

export const SyncProgressBarWrapper = styled.div`
  .progress {
    height: 8px;
    border-radius: 4px;
    background-color: #e0e0e0 !important;
  }

  .progress-bar {
    border-radius: 4px;
  }
`;
