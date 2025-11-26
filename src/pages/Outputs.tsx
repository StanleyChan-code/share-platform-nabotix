import { Navigation } from "@/components/Navigation";
import { Card, CardContent} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Award, BookOpen, TrendingUp, ExternalLink, Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getOutputTypeDisplayName } from "@/lib/outputUtils";

const Outputs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOutputs();
  }, []);

  const fetchOutputs = async () => {
    try {
      const { data, error } = await supabase
        .from('research_outputs')
        .select(`
          *,
          datasets(title_cn),
          users!research_outputs_submitter_id_fkey(real_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutputs(data || []);
    } catch (error) {
      console.error('Error fetching outputs:', error);
      toast({
        title: "加载失败",
        description: "无法加载研究成果列表",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOutput = async (output: any) => {
    // Refresh the outputs list after successful submission
    await fetchOutputs();
  };

  const filteredOutputs = outputs.filter(output => {
    const matchesSearch = output.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         output.abstract?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || output.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">研究成果</h1>
            <p className="text-muted-foreground">
              基于平台数据产生的学术论文、专利等研究成果展示
            </p>
          </div>
          
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            提交成果
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{outputs.filter(o => o.approved).length}</p>
                  <p className="text-xs text-muted-foreground">研究成果总数</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {outputs.filter(o => o.type === 'paper' && o.approved).length}
                  </p>
                  <p className="text-xs text-muted-foreground">学术论文</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {outputs.filter(o => o.type !== 'paper' && o.approved).length}
                  </p>
                  <p className="text-xs text-muted-foreground">专利成果</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">
                    {outputs.filter(o => o.approved).reduce((sum, output) => sum + (output.citation_count || 0), 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">总引用次数</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索成果标题或摘要..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="成果类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
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
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          ) : (
            filteredOutputs.map((output) => (
              <Card key={output.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{output.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={output.type === "paper" ? "default" : "secondary"}>
                              {getOutputTypeDisplayName(output.type)}
                            </Badge>
                            {output.journal && (
                              <span className="text-sm text-muted-foreground">
                                发表于 {output.journal}
                              </span>
                            )}
                            {output.patent_number && (
                              <span className="text-sm text-muted-foreground">
                                专利号: {output.patent_number}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          {output.citation_count > 0 && (
                            <div className="text-center">
                              <p className="font-bold text-lg">{output.citation_count}</p>
                              <p className="text-xs text-muted-foreground">引用</p>
                            </div>
                          )}
                          {output.publication_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={output.publication_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{output.abstract}</p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>基于数据集：{output.datasets?.title_cn || '未知数据集'}</span>
                          <span>提交者：{output.users?.real_name || '未知用户'}</span>
                          <span>提交时间：{new Date(output.created_at).toLocaleDateString('zh-CN')}</span>
                          {!output.approved && (
                            <Badge variant="secondary">待审核</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        <SubmitOutputDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          onSubmit={handleSubmitOutput}
        />
      </main>
    </div>
  );
};

export default Outputs;