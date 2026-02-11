import styled from 'styled-components';

export const SmtpCardStyled = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const SmtpCardHeader = styled.div<{ $isDefault?: boolean }>`
  background: ${({ $isDefault }) =>
    $isDefault
      ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
  border: none;
`;

export const SmtpCardTitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SmtpCardSubtitle = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.9;
`;

export const SmtpCardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

export const SmtpDetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`;

export const SmtpDetailLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

export const SmtpCardFooter = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
`;

export const SmtpCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`;
