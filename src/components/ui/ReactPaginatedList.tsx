import React, {useState, useEffect, useCallback, useImperativeHandle, forwardRef} from 'react';
import ReactPaginate from 'react-paginate';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {AxiosError} from "axios";

interface ReactPaginatedListProps<T> {
  fetchData: (page: number, size: number) => Promise<{
    content: T[];
    page: {
      number: number;
      totalPages: number;
      totalElements?: number;
    };
  }>;
  renderItem: (item: T) => React.ReactNode;
  pageSize?: number;
  renderEmptyState?: () => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  gridLayout?: boolean;
  gap?: number;
  onRefetch?: (refetch: () => void) => void;
  renderSkeletonItem?: () => React.ReactNode;
}

export interface ReactPaginatedListRef {
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

const ReactPaginatedList = forwardRef(<T,>({
  fetchData,
  renderItem,
  pageSize = 10,
  renderEmptyState,
  renderHeader,
  gridLayout = false,
  gap = 16,
  onRefetch,
  renderSkeletonItem,
}: ReactPaginatedListProps<T>, ref: React.Ref<ReactPaginatedListRef>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<AxiosError | any | null>(null);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  // 暴露给父组件的方法

  // 处理页面大小变化
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setCurrentPageSize(newSize);
    setCurrentPage(0); // 重置到第一页
  };

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      const data = await fetchData(page, currentPageSize);
      setError(null);
      setItems(data.content);
      setTotalPages(data.page.totalPages);
      setTotalElements(data.page.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err as AxiosError);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchData, currentPageSize]);

  const refetchData = useCallback(async () => {
    await loadPage(currentPage);
  }, [loadPage, currentPage]);

  useEffect(() => {
    if (onRefetch) {
      onRefetch(refetchData);
    }
  }, [onRefetch, refetchData]);

  useImperativeHandle(ref, () => ({
    refresh: refetchData,
    reset: async () => {
      setCurrentPage(0);
      await loadPage(0);
    }
  }), [refetchData, loadPage]);

  useEffect(() => {
    loadPage(0);
  }, [loadPage]);

  const handlePageClick = (event: { selected: number }) => {
    loadPage(event.selected);
  };

  // 计算网格布局样式
  const gridStyle = gridLayout ? {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: `${gap}px`,
    alignItems: 'stretch'
  } : {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: `${gap}px`
  };

  if (loading && (items.length === 0 || error)) {
    const skeletonItemCount = Math.floor(totalElements / pageSize) - currentPage > 0 ? pageSize : totalElements % pageSize;
    return renderSkeletonItem ? (
      <div style={gridStyle}>
        {Array.from({ length: skeletonItemCount || 1 }).map((_, index) => (
          <React.Fragment key={index}>
            {renderSkeletonItem()}
          </React.Fragment>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-red-500">加载数据时出错: {error.response?.data?.message || error.message}</p>
        <Button onClick={() => loadPage(currentPage)} className="mt-4">
          重试
        </Button>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return renderEmptyState ? (
      <>{renderEmptyState()}</>
    ) : (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">暂无数据</p>
        <p className="text-sm mt-2">当前条件下没有找到相关数据</p>
      </div>
    );
  }

  return (
    <>
      {renderHeader && renderHeader()}

      {/* 使用网格或流式布局容器 */}
      <div style={gridStyle} className="paginated-list-container">
        {items.map((item, index) => (
          <React.Fragment key={(item as any).id || index}>
            {renderItem(item)}
          </React.Fragment>
        ))}
      </div>

      {/* 分页控件和总数信息 */}
      <div className="mt-4 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            共 {totalElements} 条记录
          </div>
          <div className="flex items-center gap-2">
            每页显示：
            <Select value={currentPageSize.toString()} onValueChange={(value) => handlePageSizeChange({ target: { value } } as React.ChangeEvent<HTMLSelectElement>)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="显示条数" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5条</SelectItem>
                <SelectItem value="10">10条</SelectItem>
                <SelectItem value="20">20条</SelectItem>
                <SelectItem value="50">50条</SelectItem>
                <SelectItem value="100">100条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-center">
            <ReactPaginate
              breakLabel="..."
              nextLabel={
                <span className="flex items-center gap-1">
                  下一页 <ChevronRightIcon className="h-4 w-4"/>
                </span>
              }
              onPageChange={handlePageClick}
              pageRangeDisplayed={3}
              marginPagesDisplayed={1}
              pageCount={totalPages}
              previousLabel={
                <span className="flex items-center gap-1">
                  <ChevronLeftIcon className="h-4 w-4"/> 上一页
                </span>
              }
              renderOnZeroPageCount={null}
              containerClassName="flex items-center justify-center gap-2 flex-wrap"
              pageClassName=""
              pageLinkClassName="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              previousClassName=""
              previousLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              nextClassName=""
              nextLinkClassName="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600 disabled:hover:border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20"
              breakClassName=""
              breakLinkClassName="flex h-10 w-10 items-center justify-center text-gray-500 dark:text-gray-400"
              activeClassName=""
              activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-500"
              disabledClassName="opacity-40 cursor-not-allowed"
              disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
              forcePage={currentPage}
            />
          </div>
        )}
      </div>
    </>
  );
});

export default ReactPaginatedList as <T>(props: ReactPaginatedListProps<T> & {ref?: React.Ref<ReactPaginatedListRef>}) => React.ReactElement;