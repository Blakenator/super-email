import { Pagination, Form } from 'react-bootstrap';
import {
  PaginationWrapper,
  PageSizeSelector,
  PageInfo,
} from './InboxPagination.wrappers';

interface InboxPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function InboxPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: InboxPaginationProps) {
  if (totalCount === 0) {
    return null;
  }

  // Build pagination items with ellipsis
  const getPaginationItems = () => {
    const items: React.ReactNode[] = [];

    // Always show first page
    items.push(
      <Pagination.Item
        key={1}
        active={currentPage === 1}
        onClick={() => onPageChange(1)}
      >
        1
      </Pagination.Item>,
    );

    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 2; i <= totalPages; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={currentPage === i}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>,
        );
      }
    } else {
      // Complex pagination with ellipsis
      const showLeftEllipsis = currentPage > 4;
      const showRightEllipsis = currentPage < totalPages - 3;

      if (showLeftEllipsis) {
        items.push(<Pagination.Ellipsis key="left-ellipsis" disabled />);
      }

      // Pages around current
      const startPage = showLeftEllipsis
        ? Math.max(2, currentPage - 1)
        : 2;
      const endPage = showRightEllipsis
        ? Math.min(totalPages - 1, currentPage + 1)
        : totalPages - 1;

      // Ensure we show enough pages
      const adjustedStart = showLeftEllipsis
        ? startPage
        : 2;
      const adjustedEnd = showRightEllipsis
        ? endPage
        : totalPages - 1;

      for (let i = adjustedStart; i <= adjustedEnd; i++) {
        items.push(
          <Pagination.Item
            key={i}
            active={currentPage === i}
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>,
        );
      }

      if (showRightEllipsis) {
        items.push(<Pagination.Ellipsis key="right-ellipsis" disabled />);
      }

      // Always show last page
      if (totalPages > 1) {
        items.push(
          <Pagination.Item
            key={totalPages}
            active={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Pagination.Item>,
        );
      }
    }

    return items;
  };

  const startItem = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalCount > 0 ? Math.min(currentPage * pageSize, totalCount) : 0;

  return (
    <PaginationWrapper>
      <PageSizeSelector>
        <span>Show</span>
        <Form.Select
          size="sm"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          style={{ width: 'auto' }}
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Form.Select>
        <span>per page</span>
      </PageSizeSelector>

      <Pagination size="sm" className="mb-0">
        <Pagination.First
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />

        {getPaginationItems()}

        <Pagination.Next
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        />
        <Pagination.Last
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
        />
      </Pagination>

      <PageInfo>
        {startItem}–{endItem} of {totalCount}
      </PageInfo>
    </PaginationWrapper>
  );
}
