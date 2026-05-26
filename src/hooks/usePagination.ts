import { useState } from 'react';

export const usePagination = (initialPage = 1, initialPageSize = 20) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = () => setPage((prev) => prev + 1);
  const prevPage = () => setPage((prev) => Math.max(prev - 1, 1));
  const goToPage = (pageNumber: number) => setPage(pageNumber);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
  };
};
export default usePagination;
