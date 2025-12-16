import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Database, Calendar, Search, Download } from "lucide-react";
import { DatasetTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

// Type mappings for database enum values
const typeLabels = DatasetTypes;

// Helper function to get the latest approved version
const getLatestApprovedVersion = (versions: any[]) => {
  if (!versions || versions.length === 0) return null;
  
  const approvedVersions = versions
    .filter(version => version.approved === true)
    .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
    
  return approvedVersions.length > 0 ? approvedVersions[0] : null;
};

interface DatasetGridProps {
  datasets: any[];
  onDatasetClick: (dataset: any) => void;
}

export const DatasetGrid = ({ datasets, onDatasetClick }: DatasetGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {datasets.map((dataset: any) => {
        const latestApprovedVersion = getLatestApprovedVersion(dataset.versions);
        const recordCount = latestApprovedVersion?.recordCount;
        const variableCount = latestApprovedVersion?.variableCount;
        
        return (
          <Card 
            key={dataset.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onDatasetClick(dataset)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight truncate max-w-[400px]">
                  {dataset.titleCn?.length > 30 ? `${dataset.titleCn.substring(0, 30)}...` : dataset.titleCn}
                </CardTitle>
                <div className="flex flex-col gap-1 shrink-0">
                  <Badge variant="secondary">
                    {typeLabels[dataset.type as keyof typeof typeLabels] || dataset.type}
                  </Badge>
                  {dataset.parentDatasetId && (
                    <Badge variant="outline" className="text-xs">
                      随访数据
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {(dataset.keywords || []).map((keyword: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {dataset.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{recordCount?.toLocaleString() || '未知'} 条记录</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>{variableCount || '未知'} 个变量</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>采集时间 {formatDate(dataset.startDate)} 至 {formatDate(dataset.endDate)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    提供者: {dataset.provider?.realName || '未知'}
                  </p>
                  {dataset.dataCollectionUnit && (
                    <p className="text-xs text-muted-foreground">
                      采集单位: {dataset.dataCollectionUnit}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    发布于 {formatDate(dataset.currentVersionDate || dataset.createdAt)}
                  </p>
                </div>
                <Button size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  申请数据
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};