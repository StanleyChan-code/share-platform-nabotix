import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Clock, CheckCircle, XCircle, HelpCircle, Database, Hash } from "lucide-react";
import { format } from "date-fns";

interface VersionsTabProps {
  versions: any[];
  currentVersionNumber?: string;
}

export function VersionsTab({ versions, currentVersionNumber }: VersionsTabProps) {
  // 获取版本状态显示信息
  const getVersionStatusInfo = (version: any) => {
    if (version.approved === true) {
      return { icon: CheckCircle, text: "已批准", variant: "default" };
    } else if (version.approved === false) {
      return { icon: XCircle, text: "已拒绝", variant: "destructive" as const };
    } else {
      return { icon: HelpCircle, text: "待审核", variant: "secondary" as const };
    }
  };

  // 过滤出已审批通过的版本
  const approvedVersions = versions?.filter(version => version.approved === true) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          版本历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        {approvedVersions && approvedVersions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本号</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead>数据统计</TableHead>
                <TableHead>变更说明</TableHead>
                {/*<TableHead>操作</TableHead>*/}
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedVersions.map((version: any) => {
                const statusInfo = getVersionStatusInfo(version);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <TableRow key={version.id}>
                    <TableCell className="font-semibold">
                      {version.versionNumber}
                      {version.versionNumber === currentVersionNumber && (
                        <Badge variant="secondary" className="ml-2">当前</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <StatusIcon className="h-4 w-4" />
                        <span>{statusInfo.text}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {version.publishedDate ? 
                        format(new Date(version.publishedDate), 'yyyy-MM-dd HH:mm') : 
                        '无'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Database className="h-3 w-3" />
                          <span>{version.recordCount?.toLocaleString() || '0'} 条记录</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Hash className="h-3 w-3" />
                          <span>{version.variableCount || '0'} 个变量</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {version.description || version.changesDescription || '无变更说明'}
                    </TableCell>
                    {/*<TableCell>*/}
                    {/*  <Button size="sm" variant="outline">*/}
                    {/*    版本比对*/}
                    {/*  </Button>*/}
                    {/*</TableCell>*/}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">暂无版本历史记录</p>
            <p className="text-sm text-muted-foreground mt-2">
              当前版本：{currentVersionNumber || '1.0'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}