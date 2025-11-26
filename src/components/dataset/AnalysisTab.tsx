import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";

interface AnalysisTabProps {
  datasetId: string;
}

export function AnalysisTab({ datasetId }: AnalysisTabProps) {
  const { data: analysisResults, loading } = useRealtimeQuery('analysis_results', {
    select: '*',
    eq: ['dataset_id', datasetId],
    limit: 1
  });

  const analysis = analysisResults?.[0];

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        加载分析结果中...
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="mb-2">暂无分析结果</p>
        <p className="text-sm">分析结果将在数据集上传后自动生成</p>
      </div>
    );
  }

  const correlations = analysis.correlations || {};
  const correlationArray = Object.values(correlations).sort((a: any, b: any) => 
    Math.abs(b.correlation) - Math.abs(a.correlation)
  );
  const metadata = analysis.analysis_metadata || {};

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            数据概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">总行数</p>
              <p className="text-2xl font-bold">{analysis.total_rows?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总列数</p>
              <p className="text-2xl font-bold">{analysis.total_columns}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">总体缺失率</p>
              <p className="text-2xl font-bold">
                {analysis.overall_missing_rate 
                  ? `${Number(analysis.overall_missing_rate).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">数值型变量</p>
              <p className="text-2xl font-bold">{metadata.numeric_variables || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      {correlationArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              相关性分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>变量1</TableHead>
                  <TableHead>变量2</TableHead>
                  <TableHead>相关系数</TableHead>
                  <TableHead>强度</TableHead>
                  <TableHead>样本量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {correlationArray.slice(0, 20).map((corr: any, idx: number) => {
                  const absCorr = Math.abs(corr.correlation);
                  let strength = '弱';
                  let variant: "outline" | "secondary" | "default" = "outline";
                  
                  if (absCorr >= 0.7) {
                    strength = '强';
                    variant = "default";
                  } else if (absCorr >= 0.4) {
                    strength = '中';
                    variant = "secondary";
                  }

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-mono text-sm">{corr.variable1}</TableCell>
                      <TableCell className="font-mono text-sm">{corr.variable2}</TableCell>
                      <TableCell>
                        <span className={corr.correlation >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {corr.correlation.toFixed(3)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant}>{strength}</Badge>
                      </TableCell>
                      <TableCell>{corr.sample_size?.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {correlationArray.length > 20 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                显示前 20 个相关性最强的变量对
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Metadata */}
      {metadata.analysis_version && (
        <Card>
          <CardHeader>
            <CardTitle>分析信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">分析版本</p>
                <p className="font-semibold">{metadata.analysis_version}</p>
              </div>
              <div>
                <p className="text-muted-foreground">分析日期</p>
                <p className="font-semibold">
                  {new Date(analysis.analysis_date).toLocaleString('zh-CN')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">分类型变量</p>
                <p className="font-semibold">{metadata.categorical_variables || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
