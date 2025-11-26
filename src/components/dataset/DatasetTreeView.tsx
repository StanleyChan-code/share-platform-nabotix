import { ChevronRight, ChevronDown, Database } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Dataset {
  id: string;
  title_cn: string;
  type: string;
  parent_dataset_id?: string;
  record_count?: number;
  variable_count?: number;
  created_at: string;
}

interface DatasetTreeViewProps {
  datasets: Dataset[];
  onDatasetClick: (dataset: Dataset) => void;
}

const typeLabels: Record<string, string> = {
  cohort: '队列研究',
  case_control: '病例对照研究',
  cross_sectional: '横断面研究',
  rct: '随机对照试验',
  registry: '登记研究',
  biobank: '生物样本库',
  omics: '组学数据',
  wearable: '可穿戴设备'
};

export function DatasetTreeView({ datasets, onDatasetClick }: DatasetTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Build tree structure
  const baselineDatasets = datasets.filter(d => !d.parent_dataset_id);
  const followupMap = datasets.reduce((acc, d) => {
    if (d.parent_dataset_id) {
      if (!acc[d.parent_dataset_id]) {
        acc[d.parent_dataset_id] = [];
      }
      acc[d.parent_dataset_id].push(d);
    }
    return acc;
  }, {} as Record<string, Dataset[]>);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const renderDataset = (dataset: Dataset, level: number = 0) => {
    const hasChildren = followupMap[dataset.id]?.length > 0;
    const isExpanded = expandedIds.has(dataset.id);
    const children = followupMap[dataset.id] || [];

    return (
      <div key={dataset.id}>
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors",
            level > 0 && "ml-6 border-l-2 border-muted"
          )}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(dataset.id);
              }}
              className="shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <div 
            className="flex-1 flex items-center justify-between gap-4"
            onClick={() => onDatasetClick(dataset)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{dataset.title_cn}</p>
                <div className="flex items-center gap-2 mt-1">
                  {level > 0 && (
                    <Badge variant="outline" className="text-xs">
                      随访数据
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {typeLabels[dataset.type] || dataset.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {dataset.record_count?.toLocaleString() || 0} 条记录
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExpanded && children.map(child => renderDataset(child, level + 1))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据集层级视图</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {baselineDatasets.map(dataset => renderDataset(dataset, 0))}
      </CardContent>
    </Card>
  );
}
