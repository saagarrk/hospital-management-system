import { useState, useMemo } from 'react';

/**
 * Custom hook for client-side or server-side pagination management
 */
export const usePagination = ({ initialPage = 1, initialPageSize = 10, totalItems = 0 }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / pageSize));
  }, [totalItems, pageSize]);

  const onPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const onPageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

  // Helper to slice an array for client-side pagination
  const paginateArray = (items = []) => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    onPageChange,
    onPageSizeChange,
    paginateArray,
    setCurrentPage,
  };
};

export default usePagination;
