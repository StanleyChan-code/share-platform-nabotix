import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";

const DatasetApprovalTab = ({ institutionId }: { institutionId?: string }) => {
  // If institutionId is provided, filter datasets by institution
  const queryOptions = institutionId 
    ? { 
        select: 'id, title_cn, type, provider_id, approved, published, created_at, users!datasets_provider_id_fkey(real_name, institution_id)',
        filter: { 'users.institution_id': institutionId }
      }
    : {
        select: 'id, title_cn, type, provider_id, approved, published, created_at, users!datasets_provider_id_fkey(real_name)'
      };
      
  const { data: datasets, loading: datasetsLoading } = useRealtimeQuery('datasets', queryOptions);
  const { toast } = useToast();

  const handleApproveDataset = async (datasetId: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ approved: true, published: true })
        .eq('id', datasetId);

      if (error) throw error;

      toast({
        title: "数据集已批准",
        description: "数据集已批准并发布。",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "批准数据集失败。",
        variant: "destructive",
      });
    }
  };

  const handleRejectDataset = async (datasetId: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .update({ approved: false, published: false })
        .eq('id', datasetId);

      if (error) throw error;

      toast({
        title: "数据集已拒绝",
        description: "数据集已被拒绝。",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "拒绝数据集失败。",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据集审批</CardTitle>
        <CardDescription>
          {institutionId ? "审查和批准机构内的数据集发布" : "审查和批准数据集发布"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {datasetsLoading ? (
          <div>正在加载数据集...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>提供者</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((dataset) => (
                <TableRow key={dataset.id}>
                  <TableCell className="font-medium">{dataset.title_cn}</TableCell>
                  <TableCell>{dataset.type}</TableCell>
                  <TableCell>{dataset.users?.real_name}</TableCell>
                  <TableCell>
                    {dataset.approved && dataset.published ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">已发布</Badge>
                    ) : dataset.approved ? (
                      <Badge variant="secondary">已批准</Badge>
                    ) : (
                      <Badge variant="outline">待审批</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {!dataset.approved && (
                      <>
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveDataset(dataset.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          批准
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRejectDataset(dataset.id)}
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

export default DatasetApprovalTab;