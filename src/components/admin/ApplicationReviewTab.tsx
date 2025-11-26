import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'approved':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">已批准</Badge>;
    case 'denied':
      return <Badge variant="destructive">已拒绝</Badge>;
    case 'under_review':
      return <Badge variant="secondary">审查中</Badge>;
    case 'submitted':
      return <Badge variant="secondary">待审核</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const ApplicationReviewTab = ({ institutionId }: { institutionId?: string }) => {
  // If institutionId is provided, filter applications by institution
  const queryOptions = institutionId 
    ? { 
        select: 'id, project_title, status, submitted_at, applicant_id, dataset_id, users!applications_applicant_id_fkey(real_name, institution_id), datasets(title_cn, provider_id, users!datasets_provider_id_fkey(institution_id))',
        filter: { 
          or: [
            { 'users.institution_id': institutionId },
            { 'datasets.users.institution_id': institutionId }
          ]
        }
      }
    : {
        select: 'id, project_title, status, submitted_at, applicant_id, dataset_id, users!applications_applicant_id_fkey(real_name), datasets(title_cn)'
      };
      
  const { data: applications, loading: applicationsLoading } = useRealtimeQuery('applications', queryOptions);
  const { toast } = useToast();

  const handleApproveApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "申请已批准",
        description: "申请已被批准。",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "批准申请失败。",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: 'denied',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "申请已拒绝", 
        description: "申请已被拒绝。",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "拒绝申请失败。",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>申请审查</CardTitle>
        <CardDescription>
          {institutionId ? "审查和管理机构内的数据访问申请" : "审查和管理数据访问申请"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {applicationsLoading ? (
          <div>正在加载申请...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>项目标题</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>数据集</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">{application.project_title}</TableCell>
                  <TableCell>{application.users?.real_name}</TableCell>
                  <TableCell>{application.datasets?.title_cn}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>{new Date(application.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell className="space-x-2">
                    {application.status === 'submitted' && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveApplication(application.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          批准
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRejectApplication(application.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationReviewTab;