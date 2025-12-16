import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Users, Database, Calendar, TrendingUp, Building } from "lucide-react";
import { formatDate } from "@/lib/utils.ts";

interface OverviewTabProps {
  dataset: any;
  recordCount?: number;
  variableCount?: number;
  demographicFields: any[];
  outcomeFields: any[];
  institution?: any;
}

export function OverviewTab({ 
  dataset, 
  recordCount, 
  variableCount, 
  demographicFields, 
  outcomeFields,
  institution
}: OverviewTabProps) {
  return (
    <>
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
              <p className="font-semibold">{dataset.titleCn}</p>
            </div>
            {dataset.subjectArea && (
              <div>
                <p className="text-sm text-muted-foreground">学科分类</p>
                <p className="font-semibold">{dataset.subjectArea.name}</p>
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

          {dataset.samplingMethod && (
            <div>
              <p className="text-sm text-muted-foreground">抽样方法</p>
              <p className="font-semibold">{dataset.samplingMethod}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            {dataset.datasetLeader && (
              <div>
                <p className="text-sm text-muted-foreground">数据集负责人</p>
                <p className="font-semibold">{dataset.datasetLeader}</p>
              </div>
            )}
            {dataset.dataCollectionUnit && (
              <div>
                <p className="text-sm text-muted-foreground">数据采集单位</p>
                <p className="font-semibold">{dataset.dataCollectionUnit}</p>
              </div>
            )}
            {dataset.contactPerson && (
              <div>
                <p className="text-sm text-muted-foreground">联系人</p>
                <p className="font-semibold">{dataset.contactPerson}</p>
              </div>
            )}
            {dataset.contactInfo && (
              <div>
                <p className="text-sm text-muted-foreground">联系方式</p>
                <p className="font-semibold">{dataset.contactInfo}</p>
              </div>
            )}
            {dataset.principalInvestigator && (
              <div>
                <p className="text-sm text-muted-foreground">首席研究员（PI）</p>
                <p className="font-semibold">{dataset.principalInvestigator}</p>
              </div>
            )}
            {institution && (
              <div>
                <p className="text-sm text-muted-foreground">归属机构</p>
                <p className="font-semibold flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {institution.fullName}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">样本量</p>
                <p className="font-semibold">{recordCount?.toLocaleString() || '未知'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">变量数</p>
                <p className="font-semibold">{variableCount || '未知'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">采集时间</p>
                <p className="font-semibold text-sm">
                  {dataset.startDate && dataset.endDate 
                    ? `${formatDate(dataset.startDate)} 至 ${formatDate(dataset.endDate)}`
                    : '未设置'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">查看次数</p>
                <p className="font-semibold">{dataset.searchCount}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            {dataset.versionNumber && (
              <div>
                <p className="text-sm text-muted-foreground">版本号</p>
                <p className="font-semibold">{dataset.versionNumber}</p>
              </div>
            )}
            {dataset.firstPublishedDate && (
              <div>
                <p className="text-sm text-muted-foreground">首次发布日期</p>
                <p className="font-semibold">
                  {formatDate(dataset.firstPublishedDate)}
                </p>
              </div>
            )}
            {dataset.currentVersionDate && (
              <div>
                <p className="text-sm text-muted-foreground">当前版本发布日期</p>
                <p className="font-semibold">
                  {formatDate(dataset.currentVersionDate)}
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
    </>
  );
}