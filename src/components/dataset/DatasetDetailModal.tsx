import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useRealtimeQuery } from "@/hooks/useRealtimeQuery";
import { Users, Calendar, Database, TrendingUp, FileText, Download, Info, Shield, Clock, BarChart3, Link2, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { AnalysisTab } from "./AnalysisTab";

interface DatasetDetailModalProps {
  dataset: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DatasetDetailModal({ dataset, open, onOpenChange }: DatasetDetailModalProps) {
  const { data: versions } = useRealtimeQuery('dataset_versions', {
    select: '*',
    eq: ['dataset_id', dataset?.id],
    order: ['published_date', { ascending: false }]
  });

  const { data: statistics } = useRealtimeQuery('dataset_statistics', {
    select: '*',
    eq: ['dataset_id', dataset?.id]
  });

  // Fetch parent dataset if this is a follow-up
  const { data: parentDatasets } = useRealtimeQuery('datasets', {
    select: '*',
    eq: ['id', dataset?.parent_dataset_id],
    limit: 1
  });

  // Fetch follow-up datasets if this is a baseline
  const { data: followupDatasets } = useRealtimeQuery('datasets', {
    select: '*',
    eq: ['parent_dataset_id', dataset?.id]
  });

  if (!dataset) return null;

  const parentDataset = parentDatasets?.[0];
  const followups = followupDatasets || [];

  const demographicFields = dataset.demographic_fields || [];
  const outcomeFields = dataset.outcome_fields || [];
  const stats = statistics || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{dataset.title_cn}</DialogTitle>
          
          {/* Navigation Links for Baseline/Follow-up */}
          {(parentDataset || followups.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {parentDataset && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    // Open parent dataset in a new modal
                    setTimeout(() => {
                      const event = new CustomEvent('openDatasetDetail', { detail: parentDataset });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                >
                  <Link2 className="h-4 w-4" />
                  查看基线数据集
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
              
              {followups.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-sm text-muted-foreground">随访数据集:</span>
                  {followups.map((followup: any) => (
                    <Button
                      key={followup.id}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        onOpenChange(false);
                        // Open follow-up dataset in a new modal
                        setTimeout(() => {
                          const event = new CustomEvent('openDatasetDetail', { detail: followup });
                          window.dispatchEvent(event);
                        }, 100);
                      }}
                    >
                      <Link2 className="h-4 w-4" />
                      {followup.title_cn}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="gap-2">
              <Info className="h-4 w-4" />
              概述
            </TabsTrigger>
            <TabsTrigger value="statistics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              统计数据
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              分析
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FileText className="h-4 w-4" />
              文件
            </TabsTrigger>
            <TabsTrigger value="terms" className="gap-2">
              <Shield className="h-4 w-4" />
              条款
            </TabsTrigger>
            <TabsTrigger value="versions" className="gap-2">
              <Clock className="h-4 w-4" />
              版本信息
            </TabsTrigger>
          </TabsList>

          {/* (1) Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  基本信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">标题</p>
                    <p className="font-semibold">{dataset.title_cn}</p>
                  </div>
                  {dataset.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">学科分类</p>
                      <p className="font-semibold">{dataset.category}</p>
                    </div>
                  )}
                </div>

                {dataset.keywords && dataset.keywords.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">关键词</p>
                    <div className="flex flex-wrap gap-2">
                      {dataset.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">描述</p>
                  <p className="text-sm mt-1">{dataset.description}</p>
                </div>

                {dataset.sampling_method && (
                  <div>
                    <p className="text-sm text-muted-foreground">抽样方法</p>
                    <p className="font-semibold">{dataset.sampling_method}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                  {dataset.dataset_leader && (
                    <div>
                      <p className="text-sm text-muted-foreground">数据集负责人</p>
                      <p className="font-semibold">{dataset.dataset_leader}</p>
                    </div>
                  )}
                  {dataset.data_collection_unit && (
                    <div>
                      <p className="text-sm text-muted-foreground">数据采集单位</p>
                      <p className="font-semibold">{dataset.data_collection_unit}</p>
                    </div>
                  )}
                  {dataset.contact_person && (
                    <div>
                      <p className="text-sm text-muted-foreground">联系人</p>
                      <p className="font-semibold">{dataset.contact_person}</p>
                    </div>
                  )}
                  {dataset.contact_info && (
                    <div>
                      <p className="text-sm text-muted-foreground">联系方式</p>
                      <p className="font-semibold">{dataset.contact_info}</p>
                    </div>
                  )}
                  {dataset.principal_investigator && (
                    <div>
                      <p className="text-sm text-muted-foreground">首席研究员（PI）</p>
                      <p className="font-semibold">{dataset.principal_investigator}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">样本量</p>
                      <p className="font-semibold">{dataset.record_count?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">变量数</p>
                      <p className="font-semibold">{dataset.variable_count}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">采集时间</p>
                      <p className="font-semibold text-sm">
                        {dataset.start_date && dataset.end_date 
                          ? `${dataset.start_date} 至 ${dataset.end_date}`
                          : '未设置'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">查看次数</p>
                      <p className="font-semibold">{dataset.search_count}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  {dataset.version_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">版本号</p>
                      <p className="font-semibold">{dataset.version_number}</p>
                    </div>
                  )}
                  {dataset.first_published_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">首次发布日期</p>
                      <p className="font-semibold">
                        {format(new Date(dataset.first_published_date), 'yyyy-MM-dd')}
                      </p>
                    </div>
                  )}
                  {dataset.current_version_date && (
                    <div>
                      <p className="text-sm text-muted-foreground">当前版本发布日期</p>
                      <p className="font-semibold">
                        {format(new Date(dataset.current_version_date), 'yyyy-MM-dd')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Demographic Fields */}
            {demographicFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    人口统计学字段
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段名</TableHead>
                        <TableHead>标签</TableHead>
                        <TableHead>类型</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demographicFields.map((field: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{field.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Outcome Fields */}
            {outcomeFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    结局指标字段
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段名</TableHead>
                        <TableHead>标签</TableHead>
                        <TableHead>类型</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outcomeFields.map((field: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{field.type}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* (2) Analysis Tab */}
          <TabsContent value="analysis" className="mt-4">
            <AnalysisTab datasetId={dataset.id} />
          </TabsContent>

          {/* (3) Statistics Tab */}
          <TabsContent value="statistics" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  变量统计概览
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>变量名</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>均值</TableHead>
                        <TableHead>标准差</TableHead>
                        <TableHead>总数</TableHead>
                        <TableHead>缺失值</TableHead>
                        <TableHead>缺失率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.map((stat: any) => (
                        <TableRow key={stat.id}>
                          <TableCell className="font-mono text-sm">{stat.variable_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stat.variable_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {stat.mean_value ? Number(stat.mean_value).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell>
                            {stat.std_deviation ? Number(stat.std_deviation).toFixed(2) : '-'}
                          </TableCell>
                          <TableCell>{stat.total_count?.toLocaleString() || '-'}</TableCell>
                          <TableCell>{stat.missing_count?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            {stat.percentage ? `${Number(stat.percentage).toFixed(1)}%` : '0%'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-2">暂无统计数据</p>
                    <p className="text-sm">统计数据将在数据处理后显示</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demographic Statistics */}
            {demographicFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    人口统计学指标统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>统计信息</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demographicFields.map((field: any, index: number) => {
                        const fieldStat = stats.find((s: any) => s.variable_name === field.name);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-mono text-sm">{field.name}</p>
                                <p className="text-xs text-muted-foreground">{field.label}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {fieldStat ? (
                                <div className="text-sm">
                                  {fieldStat.mean_value && (
                                    <p>均值: {Number(fieldStat.mean_value).toFixed(2)}</p>
                                  )}
                                  {fieldStat.std_deviation && (
                                    <p>标准差: {Number(fieldStat.std_deviation).toFixed(2)}</p>
                                  )}
                                  {fieldStat.total_count && (
                                    <p>样本数: {fieldStat.total_count.toLocaleString()}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">暂无统计</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Outcome Statistics */}
            {outcomeFields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    结局指标统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>字段</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>统计信息</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {outcomeFields.map((field: any, index: number) => {
                        const fieldStat = stats.find((s: any) => s.variable_name === field.name);
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-mono text-sm">{field.name}</p>
                                <p className="text-xs text-muted-foreground">{field.label}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{field.type}</Badge>
                            </TableCell>
                            <TableCell>
                              {fieldStat ? (
                                <div className="text-sm">
                                  {fieldStat.mean_value && (
                                    <p>均值: {Number(fieldStat.mean_value).toFixed(2)}</p>
                                  )}
                                  {fieldStat.std_deviation && (
                                    <p>标准差: {Number(fieldStat.std_deviation).toFixed(2)}</p>
                                  )}
                                  {fieldStat.total_count && (
                                    <p>样本数: {fieldStat.total_count.toLocaleString()}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">暂无统计</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* (2) Files Tab */}
          <TabsContent value="files" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>可下载文件</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dataset.file_url && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">数据文件</p>
                        <p className="text-sm text-muted-foreground">Dataset file</p>
                      </div>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>
                )}

                {dataset.data_dict_url && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-semibold">数据字典</p>
                        <p className="text-sm text-muted-foreground">Data Dictionary</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>
                )}

                {dataset.terms_agreement_url && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-semibold">数据使用协议</p>
                        <p className="text-sm text-muted-foreground">Data Use Agreement</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>
                )}

                {!dataset.file_url && !dataset.data_dict_url && !dataset.terms_agreement_url && (
                  <p className="text-center text-muted-foreground py-8">暂无可下载文件</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* (3) Terms Tab */}
          <TabsContent value="terms" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  数据使用协议
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none">
                  <h4 className="font-semibold mb-2">数据使用条款</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>数据仅用于学术研究，不得用于商业用途</li>
                    <li>严格保护数据隐私，不得尝试重新识别受试者身份</li>
                    <li>研究成果发表时需注明数据来源</li>
                    <li>不得将数据转让给第三方</li>
                    <li>使用结束后需删除本地数据副本</li>
                    <li>发现数据质量问题应及时反馈给数据提供方</li>
                    <li>遵守相关法律法规和伦理准则</li>
                  </ul>

                  {dataset.terms_agreement_url && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="text-sm mb-2">
                        详细的数据使用协议请下载完整文档查看：
                      </p>
                      <Button className="gap-2">
                        <Download className="h-4 w-4" />
                        下载完整协议
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* (4) Versions Tab */}
          <TabsContent value="versions" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  版本历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                {versions && versions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>版本号</TableHead>
                        <TableHead>发布时间</TableHead>
                        <TableHead>变更说明</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {versions.map((version: any) => (
                        <TableRow key={version.id}>
                          <TableCell className="font-semibold">
                            {version.version_number}
                            {version.version_number === dataset.version_number && (
                              <Badge variant="secondary" className="ml-2">当前</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(version.published_date), 'yyyy-MM-dd HH:mm')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {version.changes_description || '无变更说明'}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              版本比对
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">暂无版本历史记录</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      当前版本：{dataset.version_number || '1.0'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}