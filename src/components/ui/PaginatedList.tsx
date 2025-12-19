import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginatedListProps<T> {
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
  autoLoad?: boolean;
  showManualLoadButton?: boolean;
  // 新增属性：是否使用网格布局和间距
  gridLayout?: boolean; // 是否使用网格布局，默认为false（流式布局）
  gap?: number; // 项目之间的间距，单位px，默认为16
}

const PaginatedList = <T,>({
                             fetchData,
                             renderItem,
                             pageSize = 10,
                             renderEmptyState,
                             renderHeader,
                             autoLoad = true,
                             showManualLoadButton = true,
                             gridLayout = false, // 默认不使用网格布局
                             gap = 16 // 默认间距16px
                           }: PaginatedListProps<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [autoLoadFailed, setAutoLoadFailed] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setItems([]);
      setPage(0);
      setHasMore(true);
      setTotalElements(0);
      setAutoLoadFailed(false);
      setLastError(null);

      const data = await fetchData(0, pageSize);
      setItems(data.content);
      setTotalElements(data.page.totalElements || 0);
      setHasMore(data.page.number + 1 < data.page.totalPages);
      setPage(1);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setLastError(error as Error);
    } finally {
      setLoading(false);
    }
  }, [fetchData, pageSize]);

  const fetchMoreData = useCallback(async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);
      setAutoLoadFailed(false);
      setLastError(null);

      const data = await fetchData(page, pageSize);

      // Filter duplicates
      const newItems = data.content.filter(newItem =>
          !items.some((existingItem: any) =>
              (existingItem as any).id === (newItem as any).id)
      );

      if (newItems.length > 0) {
        setItems(prev => [...prev, ...newItems]);
      }

      // Check if there's no more data
      if (data.content.length === 0 || data.page.number + 1 >= data.page.totalPages) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error fetching more data:', error);
      setAutoLoadFailed(true);
      setLastError(error as Error);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchData, items, page, pageSize, loadingMore]);

  // Load more items (public method)
  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      fetchMoreData();
    }
  }, [loading, loadingMore, hasMore, fetchMoreData]);

  // Manual retry function
  const handleManualRetry = useCallback(() => {
    setAutoLoadFailed(false);
    setLastError(null);
    loadMore();
  }, [loadMore]);

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Setup intersection observer for auto-loading
  useEffect(() => {
    if (!autoLoad) return;

    const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !autoLoadFailed) {
            loadMore();
          }
        },
        {
          root: null,
          rootMargin: "100px",
          threshold: 0.1
        }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, autoLoadFailed, autoLoad, loadMore]);

  // Public API for parent components
  const refresh = useCallback(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Remove duplicates (in case some slipped through)
  const uniqueItems = Array.from(
      new Map(items.map((item: any) => [item.id, item])).values()
  );

  // Calculate if all items are loaded
  const loadedCount = uniqueItems.length;
  const isAllLoaded = totalElements > 0 && loadedCount >= totalElements;

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

  if (loading && items.length === 0) {
    return (
        <div className="text-center py-8 text-muted-foreground">
          加载中...
        </div>
    );
  }

  if (!loading && uniqueItems.length === 0) {
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
          {uniqueItems.map((item, index) => (
              <React.Fragment key={(item as any).id || index}>
                {renderItem(item)}
              </React.Fragment>
          ))}
        </div>

        {/* Observer target for triggering auto-load */}
        {autoLoad && <div ref={observerTarget} className="h-4"></div>}

        {/* Loading status and completion提示 */}
        <div className="flex justify-center py-4">
          {loadingMore ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
          ) : isAllLoaded ? (
              <div className="text-center text-muted-foreground py-4">
                已加载全部数据
                {/*({loadedCount}/{totalElements})*/}
              </div>
          ) : autoLoadFailed ? (
              <div className="text-center space-y-2">
                <div className="text-sm text-amber-600 mb-2">
                  自动加载失败，请手动重试
                </div>
                <Button
                    onClick={handleManualRetry}
                    variant="outline"
                    className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  手动加载更多
                </Button>
              </div>
          ) : hasMore ? (
              showManualLoadButton && !autoLoad ? (
                  <Button
                      onClick={loadMore}
                      variant="outline"
                  >
                    加载更多
                  </Button>
              ) : null
          ) : (
              <div className="text-center text-muted-foreground py-4">
                没有更多数据了
              </div>
          )}
        </div>
      </>
  );
};

export default PaginatedList;