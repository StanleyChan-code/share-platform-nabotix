import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { outputApi, ResearchOutput } from "@/integrations/api/outputApi.ts";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog.tsx";
import { AdminInstitutionSelector } from "@/components/admin/institution/AdminInstitutionSelector.tsx";
import { api } from "@/integrations/api/client.ts";
import { CheckCircle, XCircle, Clock, Eye, ChevronLeftIcon, ChevronRightIcon, Search } from "lucide-react";
import { formatDate } from "@/lib/utils.ts";
import { getOutputTypeDisplayName, getOutputTypeIconComponent, getAllOutputTypes } from "@/lib/outputUtils.ts";
import ReactPaginate from "react-paginate";
import { getCurrentUserInfo } from "@/lib/authUtils.ts";
import { hasPermissionRole, PermissionRoles } from "@/lib/permissionUtils.ts";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useDebounce } from "@/hooks/useDebounce";

const ResearchOutputsManagementTab = () => {
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
  const [outputs, setOutputs] = useState<ResearchOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [canApproveOutputs, setCanApproveOutputs] = useState(false);
  const [searchTitle, setSearchTitle] = useState(""); // 搜索标题
  const [selectedStatus, setSelectedStatus] = useState<string>("all"); // 状态筛选
  const [selectedType, setSelectedType] = useState<string>("all"); // 类型筛选
  const { toast } = useToast();
  
  // 添加防抖处理，延迟550ms
  const debouncedSearchTitle = useDebounce(searchTitle, 550);

  // 使用 ref 来跟踪搜索条件变化，避免不必要的重渲染
  const searchParamsRef = useRef({
    selectedInstitution,
    isPlatformAdmin,
    selectedStatus,
    selectedType,
    searchTitle
  });

  // 检查是否为平台管理员
  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
      const isPlatformAdminUser = hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
      const canApprove = hasPermissionRole(PermissionRoles.RESEARCH_OUTPUT_APPROVER) ||
          hasPermissionRole(PermissionRoles.INSTITUTION_SUPERVISOR) ||
          isPlatformAdminUser;

      setIsPlatformAdmin(isPlatformAdminUser);
      setCanApproveOutputs(canApprove);

      // 如果不是平台管理员，设置默认机构为用户所属机构
      if (!isPlatformAdminUser && userInfo.user.institutionId) {
        setSelectedInstitution(userInfo.user.institutionId);
      }
    }
  }, []);

  // 获取研究成果数据的方法
  const fetchResearchOutputs = useCallback(async (page: number) => {
    if (!selectedInstitution && !isPlatformAdmin) {
      // 如果没有选择机构且不是平台管理员，则不加载数据
      setOutputs([]);
      setTotalPages(0);
      setTotalElements(0);
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        page,
        size: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        title: debouncedSearchTitle || undefined,
        type: selectedType !== "all" ? selectedType : undefined
      };

      // 只有平台管理员可以选择机构
      if (isPlatformAdmin && selectedInstitution) {
        params.institutionId = selectedInstitution;
      } else if (!isPlatformAdmin && selectedInstitution) {
        // 非平台管理员默认使用自己的机构
        params.institutionId = selectedInstitution;
      }

      const response = await api.get('/manage/research-outputs', {
        params
      });

      setOutputs(response.data.data.content);
      setTotalPages(response.data.data.page.totalPages);
      setTotalElements(response.data.data.page.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching research outputs:', err);
      toast({
        title: "错误",
        description: "获取研究成果时发生错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [selectedInstitution, isPlatformAdmin, selectedStatus, debouncedSearchTitle, selectedType, toast]);

  // 页面更改处理
  const handlePageClick = (event: { selected: number }) => {
    const page = event.selected;
    fetchResearchOutputs(page);
  };

  // 搜索处理
  const handleSearch = () => {
    fetchResearchOutputs(0);
  };

  // 重置搜索
  const handleResetSearch = () => {
    setSearchTitle("");
    setSelectedStatus("all");
    setSelectedType("all");
    // 重置后立即搜索，而不是等待 useEffect
    setTimeout(() => fetchResearchOutputs(0), 0);
  };

  // 使用 ref 来跟踪搜索条件变化，避免无限重渲染
  useEffect(() => {
    const currentParams = {
      selectedInstitution,
      isPlatformAdmin,
      selectedStatus,
      selectedType,
      searchTitle
    };

    // 只有当搜索条件真正发生变化时才执行搜索
    const paramsChanged = JSON.stringify(currentParams) !== JSON.stringify(searchParamsRef.current);

    if (paramsChanged) {
      searchParamsRef.current = currentParams;
      fetchResearchOutputs(0);
    }
  }, [selectedInstitution, isPlatformAdmin, selectedStatus, selectedType, debouncedSearchTitle, fetchResearchOutputs]);

  // 初始加载数据
  useEffect(() => {
    fetchResearchOutputs(0);
  }, []); // 空依赖数组，只在组件挂载时执行一次

  const handleOutputClick = (output: ResearchOutput) => {
    setSelectedOutput(output);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (approved: boolean | null) => {
    switch (approved) {
      case true:
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="mr-1 h-3 w-3" />
              已审核
            </div>
        );
      case false:
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <XCircle className="mr-1 h-3 w-3" />
              已拒绝
            </div>
        );
      default:
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <Clock className="mr-1 h-3 w-3" />
              待审核
            </div>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = getOutputTypeIconComponent(type);
    return <IconComponent className="h-4 w-4" />;
  };

  const renderOutputItem = (output: ResearchOutput) => (
      <div
          key={output.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
          onClick={() => handleOutputClick(output)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                {getTypeIcon(output.type)}
              </div>
              <h3 className="text-sm font-medium truncate">{output.title}</h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
              <span>{getOutputTypeDisplayName(output.type)}</span>
              <span>•</span>
              <span>{output.submitter?.realName || output.submitter?.username}</span>
              <span>•</span>
              <span>{formatDate(output.createdAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(output.approved)}
            </div>
          </div>

          <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOutputClick(output);
              }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
  );

  const renderEmptyState = () => (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">暂无研究成果</p>
        <p className="text-sm mt-2">当前条件下没有找到相关研究成果</p>
      </div>
  );

  return (
      <>
        <div className="space-y-6">
          {/* 筛选和搜索区域 */}
          <div className="space-y-4">
            {/* 仅平台管理员可以使用机构选择器 */}
            {isPlatformAdmin && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <AdminInstitutionSelector
                        value={selectedInstitution}
                        onChange={setSelectedInstitution}
                        placeholder="选择要管理的机构（可选）"
                    />
                  </div>
                </div>
            )}

            {/* 搜索和筛选控件 */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                  <Input
                      placeholder="输入成果标题进行搜索"
                      value={searchTitle}
                      onChange={(e) => setSearchTitle(e.target.value)}
                      className="pl-8"
                      maxLength={100}
                  />
                </div>

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="所有状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有状态</SelectItem>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="processed">已审核</SelectItem>
                    <SelectItem value="denied">已拒绝</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="所有类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有类型</SelectItem>
                    {getAllOutputTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.name}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSearch}>搜索</Button>
                <Button variant="outline" onClick={handleResetSearch}>重置</Button>
              </div>
            </div>
          </div>

          {loading && outputs.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
          ) : (
              <>
                <div className="space-y-4">
                  {outputs.length > 0 ? (
                      <>
                        <div className="grid gap-4">
                          {outputs.map(renderOutputItem)}
                        </div>

                        {/* 分页控件和总数显示 */}
                        <div className="flex justify-between items-center mt-6">
                          <div className="text-sm text-muted-foreground">
                            总计 {totalElements} 条记录
                          </div>

                          {totalPages > 1 && (
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
                                  activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-5500"
                                  disabledClassName="opacity-40 cursor-not-allowed"
                                  disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                                  forcePage={currentPage}
                              />
                          )}
                        </div>
                      </>
                  ) : (
                      !loading && renderEmptyState()
                  )}
                </div>
              </>
          )}

          <OutputDetailDialog
              open={detailDialogOpen}
              onOpenChange={setDetailDialogOpen}
              output={selectedOutput}
              canApprove={canApproveOutputs}
              onApprovalChange={() => fetchResearchOutputs(currentPage)}
              managementMode={true}
          />
        </div>
      </>
  );
};

export default ResearchOutputsManagementTab;