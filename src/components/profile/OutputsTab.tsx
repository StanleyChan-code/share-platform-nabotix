import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Download, FileText, Plus, Trash2} from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getOutputTypeDisplayName, getOutputTypeIconComponent } from "@/lib/outputUtils";
import { outputApi, ResearchOutput } from "@/integrations/api/outputApi";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/integrations/api/client";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import { formatDateTime } from "@/lib/utils";

const OutputsTab = () => {
  const [outputs, setOutputs] = useState<ResearchOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outputToDelete, setOutputToDelete] = useState<ResearchOutput | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserOutputs();
  }, []);

  const fetchUserOutputs = async () => {
    try {
      const data = await outputApi.getMySubmissions();
      setOutputs(data.content || []);
    } catch (error) {
      console.error('Error fetching outputs:', error);
      toast({
        title: "加载失败",
        description: "无法加载您的研究成果列表",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const IconComponent = getOutputTypeIconComponent(type);
    return <IconComponent className="h-4 w-4" />;
  };

  const getStatusBadge = (approved: boolean | null) => {
    if (approved === true) {
      return <Badge variant="default">已审核</Badge>; // 绿色
    } else if (approved === false) {
      return <Badge variant="destructive">已拒绝</Badge>; // 红色
    } else {
      return <Badge variant="secondary">待审核</Badge>; // 黄色
    }
  };

  const handleDeleteClick = (output: ResearchOutput) => {
    setOutputToDelete(output);
    setDeleteDialogOpen(true);
  };

  const handleOutputClick = (output: ResearchOutput) => {
    setSelectedOutput(output);
    setDetailDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!outputToDelete) return;
    
    try {
      // 调用API删除研究成果
      await api.delete(`/research-outputs/${outputToDelete.id}`);
      
      // 从列表中移除已删除的项
      setOutputs(outputs.filter(output => output.id !== outputToDelete.id));
      
      toast({
        title: "删除成功",
        description: "研究成果已成功删除",
      });
    } catch (error) {
      console.error('Error deleting output:', error);
      toast({
        title: "删除失败",
        description: "无法删除该研究成果",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setOutputToDelete(null);
    }
  };

  const handleAddOutput = () => {
    setSubmitDialogOpen(true);
  };

  const handleOutputSubmitted = () => {
    // 成果提交后刷新列表
    fetchUserOutputs();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            我的研究成果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center text-muted-foreground">
              <p>加载中...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          我的研究成果
        </CardTitle>
        <Button onClick={handleAddOutput}>
          <Plus className="mr-2 h-4 w-4" />
          提交新成果
        </Button>
      </CardHeader>
      <CardContent>
        
        <div className="space-y-4">
          {outputs.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>暂无研究成果</p>
            </div>
          ) : (
            outputs.map((output) => (
              <div 
                key={output.id} 
                className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOutputClick(output)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{output.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={output.type === "paper" ? "default" : "secondary"} className="flex items-center gap-1">
                        {getTypeIcon(output.type)}
                        {getOutputTypeDisplayName(output.type)}
                      </Badge>
                      {getStatusBadge(output.approved)}
                    </div>
                    {output.abstractText && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {output.abstractText}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formatDateTime(output.createdAt)}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(output);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这项研究成果吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SubmitOutputDialog 
        open={submitDialogOpen} 
        onOpenChange={setSubmitDialogOpen}
        onSubmit={handleOutputSubmitted}
      />

      <OutputDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        output={selectedOutput}
      />
    </Card>
  );
};

export default OutputsTab;