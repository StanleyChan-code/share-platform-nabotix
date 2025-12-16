import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { TrendingUp, Users } from "lucide-react";

interface StatisticsTabProps {
  statistics: any[];
  demographicFields: any[];
  outcomeFields: any[];
}

export function StatisticsTab({ 
  statistics: stats, 
  demographicFields, 
  outcomeFields 
}: StatisticsTabProps) {
  return (
    <>
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
                    <TableCell className="font-mono text-sm">{stat.variableName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{stat.variableType}</Badge>
                    </TableCell>
                    <TableCell>
                      {stat.meanValue ? Number(stat.meanValue).toFixed(2) : '-'}
                    </TableCell>
                    <TableCell>
                      {stat.stdDeviation ? Number(stat.stdDeviation).toFixed(2) : '-'}
                    </TableCell>
                    <TableCell>{stat.totalCount?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{stat.missingCount?.toLocaleString() || '0'}</TableCell>
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
                  const fieldStat = stats.find((s: any) => s.variableName === field.name);
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
                            {fieldStat.meanValue && (
                              <p>均值: {Number(fieldStat.meanValue).toFixed(2)}</p>
                            )}
                            {fieldStat.stdDeviation && (
                              <p>标准差: {Number(fieldStat.stdDeviation).toFixed(2)}</p>
                            )}
                            {fieldStat.totalCount && (
                              <p>样本数: {fieldStat.totalCount.toLocaleString()}</p>
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
                  const fieldStat = stats.find((s: any) => s.variableName === field.name);
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
                            {fieldStat.meanValue && (
                              <p>均值: {Number(fieldStat.meanValue).toFixed(2)}</p>
                            )}
                            {fieldStat.stdDeviation && (
                              <p>标准差: {Number(fieldStat.stdDeviation).toFixed(2)}</p>
                            )}
                            {fieldStat.totalCount && (
                              <p>样本数: {fieldStat.totalCount.toLocaleString()}</p>
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
    </>
  );
}