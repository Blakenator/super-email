import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Button } from './Button';
import { CreateRuleBannerWrapper } from './CreateRuleBanner.wrappers';

interface CreateRuleBannerProps {
  onCreateRule: () => void;
}

export function CreateRuleBanner({ onCreateRule }: CreateRuleBannerProps) {
  return (
    <CreateRuleBannerWrapper>
      <FontAwesomeIcon icon={faFilter} />
      <span>Filters active -</span>
      <Button
        variant="primary"
        size="sm"
        icon={<FontAwesomeIcon icon={faPlus} />}
        onClick={onCreateRule}
      >
        Create Mail Rule from Filters
      </Button>
    </CreateRuleBannerWrapper>
  );
}
