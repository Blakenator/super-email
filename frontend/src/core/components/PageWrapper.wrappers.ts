import styled from 'styled-components';

export interface PageWrapperProps {
  $overflow?: 'hidden' | 'auto' | 'visible'; // Overflow behavior
  $background?: 'white' | 'default'; // Background color variant
  $padding?: boolean; // Add padding
}

export const PageWrapper = styled.div<PageWrapperProps>`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme, $background }) =>
    $background === 'white'
      ? theme.colors.backgroundWhite
      : theme.colors.background};
  overflow: ${({ $overflow }) => $overflow || 'visible'};
  ${({ $padding, theme }) =>
    $padding ? `padding: ${theme.spacing.lg};` : ''}
`;

export const StickyHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const PageContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const PageToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

export const PageTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;
