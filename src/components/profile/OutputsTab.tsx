import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { getOutputTypeDisplayName, getOutputTypeIconComponent } from "@/lib/outputUtils";

const OutputsTab = () => {
  const [outputs, setOutputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserOutputs();
  }, []);

  const fetchUserOutputs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('research_outputs')
        .select('*')
        .eq('submitter_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOutputs(data || []);
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          我的研究成果
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {outputs.length === 0 ? (
            <div className="text-center text-muted-foreground">
              <p>暂无研究成果</p>
            </div>
          ) : (
            outputs.map((output) => (
              <div key={output.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{output.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={output.type === "paper" ? "default" : "secondary"} className="flex items-center gap-1">
                        {getTypeIcon(output.type)}
                        {getOutputTypeDisplayName(output.type)}
                      </Badge>
                      {!output.approved && (
                        <Badge variant="outline">待审核</Badge>
                      )}
                    </div>
                    {output.abstract && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {output.abstract}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(output.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OutputsTab;