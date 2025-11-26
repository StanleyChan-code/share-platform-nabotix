import { useState, useEffect } from "react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, Plus } from "lucide-react";
import AddInstitutionForm from "@/components/admin/AddInstitutionForm";

const InstitutionManagementTab = ({ institutionId }: { institutionId?: string }) => {
  const [showAddInstitutionForm, setShowAddInstitutionForm] = useState(false);
  // If institutionId is provided, show only that institution, otherwise show all
  const queryOptions = institutionId 
    ? { 
        select: 'id, full_name, short_name, type, contact_email, verified, created_at',
        filter: { id: institutionId }
      }
    : {
        select: 'id, full_name, short_name, type, contact_email, verified, created_at'
      };
      
  const { data: institutions, loading: institutionsLoading, refresh: refreshInstitutions } = useRealtimeQuery('institutions', queryOptions);
  const { toast } = useToast();

  useEffect(() => {
    const handleRefreshInstitutions = () => {
      refreshInstitutions();
    };

    window.addEventListener('refresh-institutions', handleRefreshInstitutions);

    return () => {
      window.removeEventListener('refresh-institutions', handleRefreshInstitutions);
    };
  }, []);

  const handleInstitutionAdded = () => {
    // 重新获取机构数据
    // 刷新机构列表
    setTimeout(() => {
      refreshInstitutions();
    }, 500);
    toast({
      title: "刷新数据",
      description: "机构列表已更新",
    });
  };

  return (
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
        
        {institutionsLoading ? (
          <div>正在加载机构...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>全称</TableHead>
                <TableHead>简称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>联系邮箱</TableHead>
                {!institutionId && <TableHead>状态</TableHead>}
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-medium">{institution.full_name}</TableCell>
                  <TableCell>{institution.short_name}</TableCell>
                  <TableCell>{institution.type}</TableCell>
                  <TableCell>{institution.contact_email}</TableCell>
                  {!institutionId && (
                    <TableCell>
                      {institution.verified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已验证
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          待审核
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{new Date(institution.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default InstitutionManagementTab;