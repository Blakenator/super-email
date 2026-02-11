import styled from 'styled-components';

export const RuleListItem = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
`;

export const RuleHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

export const RuleName = styled.span`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

export const RuleDescription = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const RuleDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

export const RuleCondition = styled.span`
  font-weight: normal;
`;

export const RuleAction = styled.span`
  font-weight: normal;
`;

export const RuleActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-shrink: 0;
`;

export const SectionTitle = styled.h6`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;
