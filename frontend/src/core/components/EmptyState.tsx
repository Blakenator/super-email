import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
`;

const IconWrapper = styled.div`
  font-size: 3rem;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  opacity: 0.5;
`;

const Title = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const Description = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;

interface EmptyStateProps {
  icon: IconDefinition;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Wrapper>
      <IconWrapper>
        <FontAwesomeIcon icon={icon} />
      </IconWrapper>
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
    </Wrapper>
  );
}
