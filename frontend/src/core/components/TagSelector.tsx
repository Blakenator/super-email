import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { TagButton } from './TagSelector.wrappers';

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  emptyMessage?: string;
}

export function TagSelector({
  tags,
  selectedTagIds,
  onToggleTag,
  emptyMessage = 'No tags available',
}: TagSelectorProps) {
  if (tags.length === 0) {
    return <span className="text-muted">{emptyMessage}</span>;
  }

  return (
    <div className="d-flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id);
        return (
          <TagButton
            key={tag.id}
            $isSelected={isSelected}
            $color={tag.color}
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onToggleTag(tag.id)}
          >
            {isSelected && <FontAwesomeIcon icon={faCheck} className="me-1" />}
            {tag.name}
          </TagButton>
        );
      })}
    </div>
  );
}
