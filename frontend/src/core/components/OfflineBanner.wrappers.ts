import styled, { keyframes } from 'styled-components';

const slideDown = keyframes`
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
`;

export const OfflineBannerWrapper = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: ${({ $isVisible }) => ($isVisible ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  color: white;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
  animation: ${slideDown} 0.3s ease-out;
`;

export const OfflineIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
`;

export const OfflineText = styled.span`
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

export const OfflineBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  margin-left: ${({ theme }) => theme.spacing.xs};
  background: rgba(255, 255, 255, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Spacer component - no longer needed since AppWrapper uses padding-top
// Keeping for backwards compatibility but it won't render anything
export const OfflineBannerSpacer = styled.div<{ $isVisible: boolean }>`
  display: none;
`;
