import { useState, useCallback } from 'react';
import { Button, Form, Collapse, Row, Col, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faChevronDown,
  faChevronUp,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { EmailChipInput } from '../../../core/components';
import {
  FilterWrapper,
  FilterToggle,
  FilterContent,
  FilterActions,
  ActiveFilterBadge,
  FilterLabel,
} from './AdvancedFilters.wrappers';

export interface EmailFilters {
  fromContains: string;
  toContains: string;
  ccContains: string;
  bccContains: string;
  subjectContains: string;
  bodyContains: string;
  tagIds: string[];
}

const emptyFilters: EmailFilters = {
  fromContains: '',
  toContains: '',
  ccContains: '',
  bccContains: '',
  subjectContains: '',
  bodyContains: '',
  tagIds: [],
};

interface AdvancedFiltersProps {
  filters: EmailFilters;
  onFiltersChange: (filters: EmailFilters) => void;
  availableTags?: Array<{ id: string; name: string; color: string }>;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  availableTags = [],
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<EmailFilters>(filters);

  const activeFilterCount =
    Object.entries(filters).filter(([key, v]) => {
      if (key === 'tagIds') return (v as string[]).length > 0;
      return typeof v === 'string' && v.trim() !== '';
    }).length;

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
  }, [localFilters, onFiltersChange]);

  const handleClear = useCallback(() => {
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  }, [onFiltersChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleApply();
      }
    },
    [handleApply],
  );

  const updateFilter = (field: keyof EmailFilters, value: string | string[]) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tagId: string) => {
    setLocalFilters((prev) => {
      const currentTags = prev.tagIds;
      if (currentTags.includes(tagId)) {
        return { ...prev, tagIds: currentTags.filter((id) => id !== tagId) };
      } else {
        return { ...prev, tagIds: [...currentTags, tagId] };
      }
    });
  };

  return (
    <FilterWrapper>
      <FilterToggle>
        <Button
          variant={activeFilterCount > 0 ? 'primary' : 'outline-secondary'}
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FontAwesomeIcon icon={faFilter} className="me-1" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <ActiveFilterBadge bg="light" text="primary">
              {activeFilterCount}
            </ActiveFilterBadge>
          )}
          <FontAwesomeIcon
            icon={isOpen ? faChevronUp : faChevronDown}
            className="ms-2"
          />
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleClear}
            className="text-danger p-0"
          >
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Clear all
          </Button>
        )}
      </FilterToggle>

      <Collapse in={isOpen}>
        <FilterContent>
          <Row>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>From</FilterLabel>
                <EmailChipInput
                  value={localFilters.fromContains}
                  onChange={(value) => updateFilter('fromContains', value)}
                  placeholder="Filter by sender..."
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>To</FilterLabel>
                <EmailChipInput
                  value={localFilters.toContains}
                  onChange={(value) => updateFilter('toContains', value)}
                  placeholder="Filter by recipient..."
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>CC</FilterLabel>
                <EmailChipInput
                  value={localFilters.ccContains}
                  onChange={(value) => updateFilter('ccContains', value)}
                  placeholder="Filter by CC..."
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>BCC</FilterLabel>
                <EmailChipInput
                  value={localFilters.bccContains}
                  onChange={(value) => updateFilter('bccContains', value)}
                  placeholder="Filter by BCC..."
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>Subject contains</FilterLabel>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. Invoice"
                  value={localFilters.subjectContains}
                  onChange={(e) => updateFilter('subjectContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <FilterLabel>Body contains</FilterLabel>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. meeting"
                  value={localFilters.bodyContains}
                  onChange={(e) => updateFilter('bodyContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
          </Row>

          {availableTags.length > 0 && (
            <Form.Group className="mb-3">
              <FilterLabel>Tags</FilterLabel>
              <div className="d-flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    bg={localFilters.tagIds.includes(tag.id) ? undefined : 'light'}
                    text={localFilters.tagIds.includes(tag.id) ? 'white' : 'dark'}
                    style={{
                      backgroundColor: localFilters.tagIds.includes(tag.id)
                        ? tag.color
                        : undefined,
                      cursor: 'pointer',
                      border: `1px solid ${tag.color}`,
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </Form.Group>
          )}

          <FilterActions>
            <Button variant="outline-secondary" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="primary" size="sm" onClick={handleApply}>
              Apply Filters
            </Button>
          </FilterActions>
        </FilterContent>
      </Collapse>
    </FilterWrapper>
  );
}

export { emptyFilters };
