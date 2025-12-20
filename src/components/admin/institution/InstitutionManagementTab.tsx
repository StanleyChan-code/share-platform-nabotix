import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { useToast } from "@/hooks/use-toast.ts";
import { CheckCircle, Clock, Plus, Loader2, Search, ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import AddInstitutionForm from "@/components/admin/institution/AddInstitutionForm.tsx";
import { formatDate } from "@/lib/utils.ts";
import InstitutionProfileTab from "@/components/admin/institution/InstitutionProfileTab.tsx";
import { institutionApi, Institution } from "@/integrations/api/institutionApi.ts";
import ReactPaginate from "react-paginate";

const InstitutionManagementTab = ({ institutionId }: { institutionId?: string }) => {
  const [showAddInstitutionForm, setShowAddInstitutionForm] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 5;
  
  // 搜索相关状态
  const [searchTerm, setSearchTerm] = useState("");

  // 获取机构列表
  const fetchInstitutions = useCallback(async (page: number = 0, searchName: string = "") => {
    try {
      setLoading(true);
      let response;
      
      if (institutionId) {
        // 如果指定了 institutionId，只获取该机构信息
        response = await institutionApi.getInstitutionById(institutionId);
        setInstitutions([response.data]);
        setTotalPages(1);
      } else {
        // 否则获取所有机构列表（支持搜索和分页）
        if (searchName) {
          response = await institutionApi.searchInstitutionsForAdmin(searchName, page, pageSize);
        } else {
          response = await institutionApi.getAllInstitutionsForAdmin(page, pageSize);
        }
        setInstitutions(response.data.content);
        setTotalPages(response.data.page.totalPages);
        setCurrentPage(page);
      }
    } catch (error: any) {
      console.error("获取机构列表失败:", error);
      toast({
        title: "错误",
        description: error.message || "获取机构列表时发生错误",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [institutionId, toast]);

  useEffect(() => {
    fetchInstitutions(0);
  }, [fetchInstitutions]);

  const handleInstitutionAdded = () => {
    // 重新获取机构数据
    fetchInstitutions(currentPage, searchTerm);
    
    toast({
      title: "刷新数据",
      description: "机构列表已更新",
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInstitutions(0, searchTerm);
  };

  const handlePageClick = (event: { selected: number }) => {
    const page = event.selected;
    fetchInstitutions(page, searchTerm);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>机构管理</CardTitle>
              <CardDescription>
                {institutionId ? "查看机构信息" : "验证和管理机构"}
              </CardDescription>
            </div>
            {!institutionId && (
              <Button 
                onClick={() => setShowAddInstitutionForm(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                添加机构
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!institutionId && (
            <AddInstitutionForm 
              open={showAddInstitutionForm} 
              onOpenChange={setShowAddInstitutionForm} 
              onInstitutionAdded={handleInstitutionAdded} 
            />
          )}
          
          {!institutionId && (
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索机构名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                搜索
              </Button>
            </form>
          )}
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>全称</TableHead>
                    <TableHead>简称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>联系邮箱</TableHead>
                    <TableHead>创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {institutions.map((institution) => (
                    <TableRow 
                      key={institution.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInstitutionId(institution.id)}
                    >
                      <TableCell className="font-medium">{institution.fullName}</TableCell>
                      <TableCell>{institution.shortName}</TableCell>
                      <TableCell>{institution.type}</TableCell>
                      <TableCell>{institution.contactEmail}</TableCell>
                      <TableCell>{formatDate(institution.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {!institutionId && totalPages > 1 && (
                <div className="mt-6 flex justify-center">
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
                    activeLinkClassName="!border-blue-500 !bg-blue-500 !text-white hover:!bg-blue-600 hover:!border-blue-600 dark:!border-blue-500 dark:!bg-blue-500"
                    disabledClassName="opacity-40 cursor-not-allowed"
                    disabledLinkClassName="hover:border-gray-200 hover:bg-white hover:text-gray-700 dark:hover:border-gray-700 dark:hover:bg-gray-800"
                    forcePage={currentPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

        <InstitutionProfileTab institutionId={selectedInstitutionId} />
    </div>
  );
};

export default InstitutionManagementTab;