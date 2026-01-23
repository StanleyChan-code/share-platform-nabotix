import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.tsx';
import { CustomDatePicker } from '@/components/ui/date-picker.tsx';
import { Label } from '@/components/ui/label.tsx';
import { toast } from '@/hooks/use-toast.ts';
import {formatDateTime, formatISOString} from '@/lib/utils.ts';
import { Search, Filter, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditLogApi, AuditLog, AuditLogParams } from '@/integrations/api/auditLogApi.ts';
import ReactPaginate from 'react-paginate';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import AuditLogDetailDialog from './AuditLogDetailDialog.tsx';
import { AuditLogConstants, ACTION_DISPLAY_NAMES } from '@/lib/auditLogConstants.ts';
import UserInfoDialog from '../user/UserInfoDialog.tsx';
import { userApi } from '@/integrations/api/userApi.ts';
import { institutionApi } from '@/integrations/api/institutionApi.ts';
import { User } from '@/integrations/api/userApi.ts';
import {useDebounce} from "@/hooks/useDebounce.ts";

export default function AuditLogsTab() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  // 单独的筛选条件状态变量
  const [startTime, setStartTime] = useState<Date | undefined>(null);
  const [endTime, setEndTime] = useState<Date | undefined>(null);
  const [action, setAction] = useState<string>('ALL');
  const [instanceType, setInstanceType] = useState<string>('ALL');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentAuditLog, setCurrentAuditLog] = useState<AuditLog | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 5,
    sortBy: 'createdAt',
    sortDir: 'desc',
    totalPages: 0,
    totalElements: 0,
  });
  
  // 用户详情对话框相关状态
  const [userInfoDialogOpen, setUserInfoDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [institutionMap, setInstitutionMap] = useState<Record<string, { fullName: string }>>({});
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  // 添加防抖处理，延迟550ms
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 550);

  // 加载审计日志
  const loadAuditLogs = async (resetPage = false, page?: number) => {
    setLoading(true);
    try {
      // 使用传入的page参数，如果没有则使用当前分页状态，或者在resetPage时使用0
      const targetPage = resetPage ? 0 : (page !== undefined ? page : pagination.page);
      
      const params: AuditLogParams = {
        startTime: startTime ? formatISOString(startTime) : undefined,
        endTime: endTime ? formatISOString(endTime, true) : undefined,
        userId: debouncedSearchTerm || undefined,
        action: action === 'ALL' ? undefined : action,
        instanceType: instanceType === 'ALL' ? undefined : instanceType,
        page: targetPage,
        size: pagination.size,
        sortBy: pagination.sortBy,
        sortDir: pagination.sortDir,
      };

      const data = await auditLogApi.getAuditLogs(params);
      
      setAuditLogs(data.content);
      
      // 只在页码、总页数或总元素数变化时更新pagination状态，避免无限循环
      setPagination(prev => {
        // 如果页码没有变化，则只更新总页数和总元素数
        if (prev.page === data.page.number) {
          return {
            ...prev,
            totalPages: data.page.totalPages,
            totalElements: data.page.totalElements,
          };
        }
        // 否则更新所有分页信息
        return {
          ...prev,
          page: data.page.number,
          totalPages: data.page.totalPages,
          totalElements: data.page.totalElements,
        };
      });
    } catch (error) {
      console.error('加载审计日志失败:', error);
      toast({
        title: '错误',
        description: error.response?.data?.message || '加载审计日志失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadAuditLogs(false, 0);
  }, []);

  // 筛选变更时重新加载（重置到第一页）
  useEffect(() => {
    loadAuditLogs(true, 0);
  }, [startTime, endTime, action, instanceType, debouncedSearchTerm]);

  // 分页、排序或每页大小变更时重新加载
  useEffect(() => {
    loadAuditLogs(false);
  }, [pagination.page, pagination.sortBy, pagination.sortDir, pagination.size]);

  // 处理筛选条件变更 - 不再需要，直接使用各个状态的setter函数

  // 重置筛选条件
  const resetFilters = async () => {
    // 重置所有筛选条件
    setSearchTerm('');
    setStartTime(null);
    setEndTime(null);
    setAction('ALL');
    setInstanceType('ALL');
  };

  // 处理分页变更
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage,
    }));
    loadAuditLogs(false, newPage);
  };

  // 处理ReactPaginate的页面点击事件
  const handlePageClick = (event: { selected: number }) => {
    const page = event.selected;
    handlePageChange(page);
  };

  // 处理排序变更
  const handleSortChange = (field: string) => {
    setPagination(prev => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'asc' ? 'desc' : 'asc',
    }));
  };

  // 获取用户信息
  const fetchUserInfo = async (userId: string) => {
    setUserLoading(true);
    try {
      // 获取用户基本信息
      const response = await userApi.getUserById(userId);
      if (!response.success) {
        toast({
          title: '错误',
          description: response.message || '获取用户信息失败',
          variant: 'destructive',
        });
        return
      }
      const user = response.data;
      setUserRoles(prev => ({
        ...prev,
        [userId]: user.authorities || []
      }));
      setCurrentUser(user);

      // 获取用户所属机构信息
      if (user.institutionId) {
        const response = await institutionApi.getInstitutionById(user.institutionId);
        if (response.success) {
          setInstitutionMap(prev => ({
            ...prev,
            [user.institutionId]: { fullName: response.data.fullName }
          }));
        }
      }

      setIsPlatformAdmin(true);

      // 打开用户详情对话框
      setUserInfoDialogOpen(true);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      toast({
        title: '错误',
        description: '获取用户信息失败，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setUserLoading(false);
    }
  };



  return (
    <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 items-end">
                {/* 开始时间 */}
                <div className="sm:col-span-1">
                  <Label htmlFor="startTime" className="mb-2 block text-sm font-medium text-gray-700">
                    开始时间
                  </Label>
                  <CustomDatePicker
                      selected={startTime}
                      onChange={setStartTime}
                      placeholder="选择开始时间"
                      maxDate={endTime || undefined}
                      className="w-full"
                      dateFormat="yyyy-MM-dd"
                  />
                </div>

                {/* 结束时间 */}
                <div className="sm:col-span-1">
                  <Label htmlFor="endTime" className="mb-2 block text-sm font-medium text-gray-700">
                    结束时间
                  </Label>
                  <CustomDatePicker
                      selected={endTime}
                      onChange={setEndTime}
                      placeholder="选择结束时间"
                      minDate={startTime}
                      className="w-full"
                      dateFormat="yyyy-MM-dd"
                  />
                </div>

                {/* 用户 ID */}
                <div className="sm:col-span-1">
                  <Label htmlFor="userId" className="mb-2 block text-sm font-medium text-gray-700">
                    操作用户 ID
                  </Label>
                  <Input
                      id="userId"
                      placeholder="输入用户 ID"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                  />
                </div>

                {/* 操作行为 */}
                <div className="sm:col-span-1">
                  <Label htmlFor="action" className="mb-2 block text-sm font-medium text-gray-700">
                    操作行为
                  </Label>
                  <Select
                      value={action}
                      onValueChange={setAction}
                  >
                    <SelectTrigger id="action" className="w-full">
                      <SelectValue placeholder="所有操作行为" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有操作行为</SelectItem>
                      {Object.entries(ACTION_DISPLAY_NAMES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 实例类型 */}
                <div className="sm:col-span-1">
                  <Label htmlFor="instanceType" className="mb-2 block text-sm font-medium text-gray-700">
                    实例类型
                  </Label>
                  <Select
                      value={instanceType}
                      onValueChange={setInstanceType}
                  >
                    <SelectTrigger id="instanceType" className="w-full">
                      <SelectValue placeholder="所有实例类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">所有实例类型</SelectItem>
                      {Object.entries(AuditLogConstants)
                          .filter(([key]) => key.startsWith('RESOURCE_TYPE_'))
                          .map(([_, value]) => (
                              <SelectItem key={value} value={value}>
                                {value}
                              </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 操作按钮 */}
                <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1 flex flex-wrap gap-2 pt-2">
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => loadAuditLogs(true)}
                      disabled={loading}
                      className="flex-1 min-w-[80px]"
                  >
                    {loading ? '加载中...' : '刷新'}
                  </Button>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={resetFilters}
                      className="flex-1 min-w-[80px]"
                  >
                    重置
                  </Button>
                </div>
              </div>


          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSortChange('createdAt')}
                      className="p-0 h-auto"
                    >
                      操作时间
                      {pagination.sortBy === 'createdAt' && (
                        <span className="ml-1">
                          {pagination.sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">操作用户ID</TableHead>
                  <TableHead>IP地址</TableHead>
                  <TableHead className={'min-w-[90px] text-center'}>操作行为</TableHead>
                  <TableHead>实例类型</TableHead>
                  <TableHead className="w-[120px]">实例ID</TableHead>
                  <TableHead className="w-[150px]">实例标题</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: pagination.size }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`}>
                      <TableCell>
                        <Skeleton className="h-8 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-16 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      没有找到审计日志
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className={'font-mono text-sm whitespace-nowrap'}>{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell
                          title={log.operatorId}
                          className={'font-mono text-sm truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]'}>
                        <Button
                          variant="link"
                          onClick={() => log.operatorId && fetchUserInfo(log.operatorId)}
                          disabled={!log.operatorId || userLoading}
                          className="p-0 h-auto text-primary hover:text-primary/80"
                        >
                          {log.operatorId}
                        </Button>
                      </TableCell>
                      <TableCell className={'font-mono text-sm'}>{log.ipAddress}</TableCell>
                      <TableCell className={'font-mono text-sm text-center'}>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {ACTION_DISPLAY_NAMES[log.action] || log.action}
                        </span>
                      </TableCell>
                      <TableCell className={'font-mono text-sm'}>{log.instanceType}</TableCell>
                      <TableCell
                          title={log.instanceId || '-'}
                          className={'font-mono text-sm truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-[120px]'}>
                        {log.instanceId || '-'}
                      </TableCell>
                      <TableCell
                          title={log.resourceTitle || '-'}
                          className={'font-mono text-sm truncate overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px]'}>
                        {log.resourceTitle || '-'}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            setCurrentAuditLog(log);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                          </div>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页控件 */}
          <div className="mt-4 text-sm text-muted-foreground flex justify-between items-center">
            <div>
              共 {pagination.totalElements} 条记录
            </div>
            {/* 只有在总页数大于1时才显示分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center">
                <ReactPaginate
                  breakLabel="..."
                  nextLabel={
                    <span className="flex items-center gap-1">
                      下一页 <ChevronRight className="h-4 w-4"/>
                    </span>
                  }
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={pagination.totalPages}
                  previousLabel={
                    <span className="flex items-center gap-1">
                      <ChevronLeft className="h-4 w-4"/> 上一页
                    </span>
                  }
                  renderOnZeroPageCount={null}
                  containerClassName="flex items-center justify-center gap-2"
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
                  forcePage={pagination.page}
                />
              </div>
            )}
          </div>

          {/* 审计详情对话框 */}
          <AuditLogDetailDialog
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            auditLog={currentAuditLog}
          />
          
          {/* 用户详情对话框 */}
          <UserInfoDialog
            open={userInfoDialogOpen}
            onOpenChange={setUserInfoDialogOpen}
            user={currentUser}
            institutionMap={institutionMap}
            userRoles={userRoles}
            isPlatformAdmin={isPlatformAdmin}
          />
    </div>
  );
}