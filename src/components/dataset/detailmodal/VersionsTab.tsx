import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Clock, CheckCircle, XCircle, HelpCircle, Database, Hash, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import {AddDatasetVersionForm} from "@/components/upload/AddDatasetVersionForm.tsx";


interface VersionsTabProps {
  versions: any[];
  currentVersionNumber?: string;
  showAllVersions?: boolean; // 新增属性，控制是否显示所有版本
  useAdvancedQuery?: boolean; // 新增属性，控制是否使用高级查询
  datasetId?: string; // 新增属性，数据集ID
  onVersionAdded?: () => void; // 新增属性，版本添加后的回调函数
}

export function VersionsTab({ 
  versions, 
  currentVersionNumber, 
  showAllVersions = false,
  useAdvancedQuery = false,
  datasetId,
  onVersionAdded
}: VersionsTabProps) {
  const [isAddVersionDialogOpen, setIsAddVersionDialogOpen] = useState(false);
  
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

  // 根据showAllVersions属性决定是否过滤版本
  const displayedVersions = showAllVersions 
    ? versions 
    : versions?.filter(version => version.approved === true) || [];

  // 检查是否存在待审核的版本
  const hasPendingVersion = versions?.some(version => version.approved === null);

  // 处理版本添加完成
  const handleVersionAdded = () => {
    setIsAddVersionDialogOpen(false);
    if (onVersionAdded) {
      onVersionAdded();
    }
  };

  return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              版本历史
            </CardTitle>
            
            {/* 仅在高级查询模式下且没有待审核版本时显示添加版本按钮 */}
            {useAdvancedQuery && !hasPendingVersion && datasetId && (
              <Dialog open={isAddVersionDialogOpen} onOpenChange={setIsAddVersionDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    添加新版本
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>添加数据集新版本</DialogTitle>
                  </DialogHeader>
                  <AddDatasetVersionForm 
                    datasetId={datasetId} 
                    onSuccess={handleVersionAdded}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {displayedVersions && displayedVersions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">版本号</TableHead>
                    <TableHead className="w-[100px]">状态</TableHead>
                    <TableHead className="w-[140px]">发布时间</TableHead>
                    <TableHead className="w-[130px]">数据统计</TableHead>
                    <TableHead className="min-w-[200px]">版本说明</TableHead>
                    {/*<TableHead className="w-[100px]">操作</TableHead>*/}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedVersions.map((version: any) => {
                    const statusInfo = getVersionStatusInfo(version);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <TableRow key={version.id}>
                          <TableCell className="font-semibold">
                            <div className="flex items-center">
                              {version.versionNumber}
                              {version.versionNumber === currentVersionNumber && (
                                  <Badge variant="secondary" className="ml-2">当前</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <StatusIcon className="h-4 w-4" />
                              <span>{statusInfo.text}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {version.publishedDate ?
                                format(new Date(version.publishedDate), 'yyyy-MM-dd') :
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
                          <TableCell className="max-w-[300px] min-w-[200px]">
                            <div className="text-sm text-muted-foreground line-clamp-3">
                              {version.description || version.changesDescription || '无变更说明'}
                            </div>
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