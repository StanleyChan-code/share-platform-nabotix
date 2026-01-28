import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { ResearchOutput } from "@/integrations/api/outputApi.ts";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog.tsx";
import { InstitutionSelector } from "@/components/admin/institution/InstitutionSelector.tsx";
import { api } from "@/integrations/api/client.ts";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  FileText
} from "lucide-react";
import { getAllOutputTypes } from "@/lib/outputUtils.ts";
import { getCurrentUserInfoFromSession } from "@/lib/authUtils";
import { hasPermissionRole, PermissionRoles } from "@/lib/permissionUtils.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useDebounce } from "@/hooks/useDebounce";
import {Input} from "@/components/ui/FormValidator.tsx";
import OutputItem from "@/components/profile/OutputItem.tsx";
import {refreshOutputPendingCount} from "@/lib/pendingCountsController";
import {Card, CardContent} from "@/components/ui/card";
import ReactPaginatedList from "@/components/ui/ReactPaginatedList";
import {cn} from "@/lib/utils.ts";

const ResearchOutputsManagementTab = () => {
  const [selectedInstitution, setSelectedInstitution] = useState<string[] | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [searchTitle, setSearchTitle] = useState(""); // 搜索标题
  const [selectedStatus, setSelectedStatus] = useState<string>("pending"); // 状态筛选
  const [selectedType, setSelectedType] = useState<string>("all"); // 类型筛选
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
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
    const userInfo = getCurrentUserInfoFromSession();
    if (userInfo) {
      const isPlatformAdminUser = hasPermissionRole(PermissionRoles.PLATFORM_ADMIN);
      
      // 只有平台管理员可以访问该组件
      if (!isPlatformAdminUser) {
        navigate("/profile");
        return;
      }


      setIsPlatformAdmin(isPlatformAdminUser);

      // 如果不是平台管理员，设置默认机构为用户所属机构
      if (!isPlatformAdminUser && userInfo.user.institutionId) {
        setSelectedInstitution([userInfo.user.institutionId]);
      }
    }
  }, [toast, navigate]);

  // 获取研究成果数据的方法，适配ReactPaginatedList的接口
  const fetchResearchOutputs = useCallback(async (page: number, size: number): Promise<{
    content: ResearchOutput[];
    page: {
      number: number;
      totalElements: number;
      totalPages: number;
    };
  }> => {
    if ((!selectedInstitution || selectedInstitution.length === 0) && !isPlatformAdmin) {
      // 如果没有选择机构且不是平台管理员，则返回空数据
      return {
        content: [],
        page: {
          number: page,
          totalElements: 0,
          totalPages: 0
        }
      };
    }

    try {
      setLoading(true);
      const params: any = {
        page: page,
        size: size,
        sortBy: 'createdAt',
        sortDir: 'desc',
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        title: debouncedSearchTitle || undefined,
        type: selectedType !== "all" ? selectedType : undefined
      };

      // 只有平台管理员可以选择机构
      if (isPlatformAdmin && selectedInstitution && selectedInstitution.length > 0) {
        params.institutionId = selectedInstitution[0];
      } else if (!isPlatformAdmin && selectedInstitution && selectedInstitution.length > 0) {
        // 非平台管理员默认使用自己的机构
        params.institutionId = selectedInstitution[0];
      }

      const response = await api.get('/manage/research-outputs', {
        params
      });

      // 刷新待审核数量
      refreshOutputPendingCount();

      return response.data.data;
    } catch (err) {
      console.error('Error fetching research outputs:', err);
      toast({
        title: "错误",
        description: "获取研究成果时发生错误",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedInstitution, isPlatformAdmin, selectedStatus, debouncedSearchTitle, selectedType, toast]);

  // 重置搜索
  const handleResetSearch = () => {
    setSearchTitle("");
    setSelectedStatus("all");
    setSelectedType("all");
  };

  // 为ReactPaginatedList创建ref
  const paginatedListRef = useRef<any>(null);

  const handleOutputClick = (output: ResearchOutput) => {
    setSelectedOutput(output);
    setDetailDialogOpen(true);
  };

  // 骨架屏组件
  const OutputItemSkeleton = () => (
    <Card className="border-l-4 border-l-primary max-w-full">
      <CardContent className="p-6 max-w-full">
        <div className="flex flex-col sm:flex-row items-start gap-4 max-w-full">
          <div className="flex-1 min-w-0 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1 max-w-full">
                <div className="h-6 w-24 rounded-full bg-muted animate-pulse"></div>
                <div className="h-6 w-3/4 rounded bg-muted animate-pulse"></div>
              </div>
              <div className="flex flex-row items-center gap-2">
                <div className="h-6 w-24 rounded-full bg-muted animate-pulse flex-shrink-0"></div>
                <div className="flex gap-1">
                  <div className="h-10 w-10 rounded-lg border border-gray-200 bg-muted animate-pulse"></div>
                  <div className="h-10 w-10 rounded-lg border border-gray-200 bg-muted animate-pulse"></div>
                  <div className="h-10 w-10 rounded-lg border border-gray-200 bg-muted animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* 基本信息行 */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 text-sm text-muted-foreground mb-2 max-w-full">
              <div className="flex items-center gap-2 min-w-0 max-w-full">
                <div className="h-4 w-4 bg-muted animate-pulse rounded flex-shrink-0"></div>
                <div className="h-4 w-24 rounded bg-muted animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2 min-w-0 max-w-full">
                <div className="h-4 w-4 bg-muted animate-pulse rounded flex-shrink-0"></div>
                <div className="h-4 w-32 rounded bg-muted animate-pulse"></div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-6 text-sm text-muted-foreground mb-3 max-w-full">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted animate-pulse rounded flex-shrink-0"></div>
                <div className="h-4 w-32 rounded bg-muted animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-muted animate-pulse rounded flex-shrink-0"></div>
                <div className="h-4 w-32 rounded bg-muted animate-pulse"></div>
              </div>
            </div>

            {/* 摘要 */}
            <div className="space-y-2 mb-3 max-w-full">
              <div className="h-4 w-full rounded bg-muted animate-pulse"></div>
              <div className="h-4 w-3/4 rounded bg-muted animate-pulse"></div>
              <div className="h-4 w-1/2 rounded bg-muted animate-pulse"></div>
            </div>

            {/* 其他关键信息预览 */}
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="h-5 w-28 rounded-full bg-muted animate-pulse"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderOutputItem = (output: ResearchOutput) => (
      <OutputItem
        key={output.id}
        output={output}
        onDetail={handleOutputClick}
        onDelete={()  => {
             paginatedListRef.current?.refresh();
        }}
        managementMode={true}
      />
  );

  const renderEmptyState = () => (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-50"/>
        <p className="text-lg">暂无研究成果</p>
        <p className="text-sm mt-2">当前筛选条件下没有找到相关研究成果</p>
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
                    <InstitutionSelector
                        value={selectedInstitution}
                        onChange={setSelectedInstitution}
                        placeholder="选择要管理的机构（可选）"
                        allowMultiple={false}
                    />
                  </div>
                </div>
            )}

            {/* 搜索和筛选控件 */}
            <div className="mb-6 p-4 border rounded-lg bg-muted/50 flex flex-col md:flex-row gap-4">
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
                <Button variant="outline" disabled={loading} onClick={() => paginatedListRef.current?.refresh()} className="gap-2">
                  <RefreshCw className={cn("h-4 w-4", loading ? "animate-spin" : "")} />
                  刷新
                </Button>
                <Button variant="outline" onClick={handleResetSearch}>重置筛选</Button>
              </div>
            </div>
          </div>

          {/* 使用ReactPaginatedList组件显示成果列表 */}
          <ReactPaginatedList
            ref={paginatedListRef}
            fetchData={fetchResearchOutputs}
            renderItem={renderOutputItem}
            renderEmptyState={renderEmptyState}
            renderSkeletonItem={OutputItemSkeleton}
            pageSize={10}
          />

          <OutputDetailDialog
              open={detailDialogOpen}
              onOpenChange={setDetailDialogOpen}
              output={selectedOutput}
              canApprove={true}
              onApprovalChange={() => {
                  // 审核状态变化后刷新列表
                  paginatedListRef.current?.refresh();
                  // 刷新待审核数量
                  refreshOutputPendingCount();
              }}
              managementMode={true}
          />
        </div>
      </>
  );
};

export default ResearchOutputsManagementTab;