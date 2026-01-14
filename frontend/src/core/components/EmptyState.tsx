import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  Wrapper,
  IconWrapper,
  Title,
  Description,
} from './EmptyState.wrappers';

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
