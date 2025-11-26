import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { getOutputTypeDisplayName } from "@/lib/outputUtils";
import { Database } from '@/integrations/supabase/types';

interface SubmitOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (output: Database["public"]["Tables"]["research_outputs"]["Row"]) => void;
}

const SubmitOutputDialog = ({ open, onOpenChange, onSubmit }: SubmitOutputDialogProps) => {
  const [newOutput, setNewOutput] = useState({
    title: "",
    abstract: "",
    type: "paper",
    journal: "",
    patentNumber: "",
    datasetId: "",
    publicationUrl: "",
    pubmedId: "",
    authors: "",
    citationCount: 0
  });

  const [isLoadingPubmed, setIsLoadingPubmed] = useState(false);
  const [pubmedError, setPubmedError] = useState("");
  const { toast } = useToast();

  const fetchPubMedData = async (pubmedId: string) => {
    if (!pubmedId.trim()) {
      setPubmedError("");
      return;
    }

    setIsLoadingPubmed(true);
    setPubmedError("");

    try {
      const { data, error } = await supabase.functions.invoke('fetch-pubmed', {
        body: { pubmedId: pubmedId.trim() }
      });

      if (error) {
        setPubmedError("无法获取PubMed数据，请检查ID是否正确");
        return;
      }

      if (data) {
        setNewOutput(prev => ({
          ...prev,
          title: data.title || prev.title,
          abstract: data.abstract || prev.abstract,
          journal: data.journal || prev.journal,
          authors: data.authors || prev.authors,
          citationCount: data.citationCount || prev.citationCount,
          publicationUrl: data.publicationUrl || prev.publicationUrl
        }));
      }
    } catch (error) {
      setPubmedError("获取PubMed数据时出现错误");
      console.error('PubMed fetch error:', error);
    } finally {
      setIsLoadingPubmed(false);
    }
  };

  const handlePubmedIdChange = (value: string) => {
    setNewOutput(prev => ({ ...prev, pubmedId: value }));
    
    // Auto-fetch when ID looks complete (typically 8 digits)
    if (value.length >= 7 && /^\d+$/.test(value)) {
      fetchPubMedData(value);
    }
  };

  const handleSubmitOutput = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newOutput.title || !newOutput.abstract || !newOutput.datasetId) {
      toast({
        title: "提交失败",
        description: "请填写所有必填字段",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "提交失败",
          description: "请先登录后再提交成果",
          variant: "destructive"
        });
        return;
      }

      // Insert the research output into database
      const { data, error } = await supabase
        .from('research_outputs')
        .insert({
          title: newOutput.title,
          abstract: newOutput.abstract,
          type: newOutput.type as Database["public"]["Enums"]["output_type"],
          dataset_id: newOutput.datasetId,
          submitter_id: user.id,
          journal: newOutput.type === 'paper' ? newOutput.journal : undefined,
          patent_number: newOutput.type !== 'paper' ? newOutput.patentNumber : undefined,
          publication_url: newOutput.publicationUrl || undefined,
          citation_count: newOutput.citationCount || 0,
          // New fields for approval status - default to false for new submissions
          approved: false
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "提交成功",
        description: "研究成果已成功提交，等待管理员审核"
      });

      onSubmit(data);
      onOpenChange(false);
      
      // Reset form
      setNewOutput({
        title: "",
        abstract: "",
        type: "paper",
        journal: "",
        patentNumber: "",
        datasetId: "",
        publicationUrl: "",
        pubmedId: "",
        authors: "",
        citationCount: 0
      });
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "提交失败",
        description: "提交研究成果时出现错误，请稍后重试",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>提交研究成果</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          请填写以下信息，并提交您的成果。
        </DialogDescription>
        <ScrollArea className="flex-grow py-2">
          <form onSubmit={handleSubmitOutput} className="space-y-4 pr-4">
            <div className="space-y-2">
              <Label htmlFor="pubmedId">PubMed ID</Label>
              <div className="flex gap-2 mx-1">
                <Input
                  id="pubmedId"
                  value={newOutput.pubmedId}
                  onChange={(e) => handlePubmedIdChange(e.target.value)}
                  placeholder="输入PubMed ID自动获取论文信息"
                />
                {isLoadingPubmed && <Loader2 className="h-5 w-5 animate-spin self-center" />}
              </div>
              {pubmedError && (
                <p className="text-sm text-destructive">{pubmedError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputTitle">成果标题 *</Label>
              <Input
                id="outputTitle"
                value={newOutput.title}
                onChange={(e) => setNewOutput(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入论文或专利标题"
                className="mx-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="outputType">成果类型 *</Label>
              <Select value={newOutput.type} onValueChange={(value) => 
                setNewOutput(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger className={"mx-1"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project">{getOutputTypeDisplayName("project")}</SelectItem>
                  <SelectItem value="paper">{getOutputTypeDisplayName("paper")}</SelectItem>
                  <SelectItem value="publication">{getOutputTypeDisplayName("publication")}</SelectItem>
                  <SelectItem value="patent">{getOutputTypeDisplayName("patent")}</SelectItem>
                  <SelectItem value="invention_patent">{getOutputTypeDisplayName("invention_patent")}</SelectItem>
                  <SelectItem value="utility_patent">{getOutputTypeDisplayName("utility_patent")}</SelectItem>
                  <SelectItem value="software_copyright">{getOutputTypeDisplayName("software_copyright")}</SelectItem>
                  <SelectItem value="software">{getOutputTypeDisplayName("software")}</SelectItem>
                  <SelectItem value="other_award">{getOutputTypeDisplayName("other_award")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataset">关联数据集 *</Label>
              <Select value={newOutput.datasetId} onValueChange={(value) =>
                setNewOutput(prev => ({ ...prev, datasetId: value }))
              }>
                <SelectTrigger className="mx-1">
                  <SelectValue placeholder="选择使用的数据集" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="77777777-7777-7777-7777-777777777777">冠心病队列研究数据集</SelectItem>
                  <SelectItem value="88888888-8888-8888-8888-888888888888">糖尿病患者生物标志物数据</SelectItem>
                  <SelectItem value="99999999-9999-9999-9999-999999999999">脑卒中康复随访数据</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newOutput.type === "paper" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="journal">发表期刊</Label>
                  <Input
                    id="journal"
                    value={newOutput.journal}
                    onChange={(e) => setNewOutput(prev => ({ ...prev, journal: e.target.value }))}
                    placeholder="期刊名称"
                    className="mx-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authors">作者</Label>
                  <Input
                    id="authors"
                    value={newOutput.authors}
                    onChange={(e) => setNewOutput(prev => ({ ...prev, authors: e.target.value }))}
                    placeholder="作者姓名"
                    className="mx-1"
                  />
                </div>

                {newOutput.citationCount > 0 && (
                  <div className="space-y-2">
                    <Label>引用次数</Label>
                    <p className="text-sm text-muted-foreground">{newOutput.citationCount} 次引用</p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="patentNumber">专利号</Label>
                <Input
                  id="patentNumber"
                  value={newOutput.patentNumber}
                  onChange={(e) => setNewOutput(prev => ({ ...prev, patentNumber: e.target.value }))}
                  placeholder="专利申请号或授权号"
                  className="mx-1"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="abstract">摘要 *</Label>
              <Textarea
                id="abstract"
                rows={4}
                value={newOutput.abstract}
                onChange={(e) => setNewOutput(prev => ({ ...prev, abstract: e.target.value }))}
                placeholder="简要描述研究内容、方法和主要发现"
                className="mx-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">链接</Label>
              <Input
                id="url"
                value={newOutput.publicationUrl}
                onChange={(e) => setNewOutput(prev => ({ ...prev, publicationUrl: e.target.value }))}
                placeholder="论文DOI或专利查询链接"
                className="mx-1"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button type="submit">
                提交成果
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitOutputDialog;