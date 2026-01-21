import styled from 'styled-components';
import { Card, ProgressBar } from 'react-bootstrap';

export const BillingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const BillingCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const UsageSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

export const UsageItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const UsageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`;

export const UsageLabel = styled.span`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const UsageValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const StyledProgressBar = styled(ProgressBar)<{ $variant?: 'success' | 'warning' | 'danger' }>`
  height: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme }) => theme.colors.background};

  .progress-bar {
    background: ${({ theme, $variant }) => {
      switch ($variant) {
        case 'danger':
          return theme.colors.danger;
        case 'warning':
          return theme.colors.warning;
        default:
          return theme.colors.success;
      }
    }};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    transition: width 0.3s ease;
  }
`;

export const TierBadge = styled.span<{ $tier: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ theme, $tier }) => {
    switch ($tier) {
      case 'ENTERPRISE':
        return `${theme.colors.primary}20`;
      case 'PRO':
        return `${theme.colors.info}20`;
      case 'BASIC':
        return `${theme.colors.success}20`;
      default:
        return theme.colors.background;
    }
  }};
  color: ${({ theme, $tier }) => {
    switch ($tier) {
      case 'ENTERPRISE':
        return theme.colors.primary;
      case 'PRO':
        return theme.colors.info;
      case 'BASIC':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  }};
`;

export const StatusBadge = styled.span<{ $valid: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: 500;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme, $valid }) =>
    $valid ? `${theme.colors.success}20` : `${theme.colors.danger}20`};
  color: ${({ theme, $valid }) =>
    $valid ? theme.colors.success : theme.colors.danger};
`;

export const SubscriptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const SubscriptionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const SubscriptionLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const SubscriptionValue = styled.span`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const WarningBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => `${theme.colors.warning}15`};
  border: 1px solid ${({ theme }) => theme.colors.warning};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};

  svg {
    color: ${({ theme }) => theme.colors.warning};
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;

export const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => `${theme.colors.danger}15`};
  border: 1px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.textPrimary};

  svg {
    color: ${({ theme }) => theme.colors.danger};
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;

export const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

export const PlanCard = styled.div<{ $selected?: boolean; $recommended?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ theme, $selected }) =>
    $selected ? theme.colors.primary : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme, $selected }) =>
    $selected ? `${theme.colors.primary}08` : theme.colors.backgroundWhite};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};

  ${({ $recommended, theme }) =>
    $recommended &&
    `
    border-color: ${theme.colors.info};
    
    &::before {
      content: 'Recommended';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: ${theme.colors.info};
      color: white;
      padding: 2px 12px;
      border-radius: ${theme.borderRadius.sm};
      font-size: ${theme.fontSizes.xs};
      font-weight: 600;
      text-transform: uppercase;
    }
  `}

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

export const PlanName = styled.h4`
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const PlanPrice = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`;

export const PlanFeature = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.xs};

  svg {
    color: ${({ theme }) => theme.colors.success};
    flex-shrink: 0;
  }
`;

export const LastRefreshed = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.md};
  text-align: right;
`;
