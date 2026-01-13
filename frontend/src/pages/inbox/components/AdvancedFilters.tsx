import { useState, useCallback } from 'react';
import { Button, Form, Collapse, Row, Col, Badge } from 'react-bootstrap';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFilter,
  faChevronDown,
  faChevronUp,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

const FilterWrapper = styled.div`
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 ${({ theme }) => theme.spacing.lg};
`;

const FilterToggle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`;

const FilterContent = styled.div`
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ActiveFilterBadge = styled(Badge)`
  margin-left: ${({ theme }) => theme.spacing.xs};
`;

export interface EmailFilters {
  fromContains: string;
  toContains: string;
  ccContains: string;
  bccContains: string;
  subjectContains: string;
  bodyContains: string;
}

const emptyFilters: EmailFilters = {
  fromContains: '',
  toContains: '',
  ccContains: '',
  bccContains: '',
  subjectContains: '',
  bodyContains: '',
};

interface AdvancedFiltersProps {
  filters: EmailFilters;
  onFiltersChange: (filters: EmailFilters) => void;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<EmailFilters>(filters);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v.trim() !== '',
  ).length;

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

  const updateFilter = (field: keyof EmailFilters, value: string) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }));
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
                <Form.Label className="small text-muted">From contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. john@example.com"
                  value={localFilters.fromContains}
                  onChange={(e) => updateFilter('fromContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">To contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. team@company.com"
                  value={localFilters.toContains}
                  onChange={(e) => updateFilter('toContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">CC contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. manager@company.com"
                  value={localFilters.ccContains}
                  onChange={(e) => updateFilter('ccContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">BCC contains</Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="e.g. archive@company.com"
                  value={localFilters.bccContains}
                  onChange={(e) => updateFilter('bccContains', e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={4}>
              <Form.Group className="mb-3">
                <Form.Label className="small text-muted">Subject contains</Form.Label>
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
                <Form.Label className="small text-muted">Body contains</Form.Label>
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
