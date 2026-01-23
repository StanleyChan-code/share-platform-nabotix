import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {Users, Database, Calendar, Building, User, Target, BarChart3, Eye, Star, Clock, Hash} from "lucide-react";
import { DatasetTypes } from "@/lib/enums";
import {cn, formatDate} from "@/lib/utils";
import {getLatestApprovedVersion} from "@/lib/datasetUtils.ts";

// Type mappings for database enum values
const typeLabels = DatasetTypes;

interface DatasetGridProps {
  datasets: any[];
  onDatasetClick: (dataset: any) => void;
}

export const DatasetGrid = ({ datasets, onDatasetClick }: DatasetGridProps) => {
  return (
      <>
        {datasets.map((dataset: any) => {
          const latestApprovedVersion = getLatestApprovedVersion(dataset.versions);
          const recordCount = latestApprovedVersion?.recordCount;
          const variableCount = latestApprovedVersion?.variableCount;

          return (
              <Card
                  key={dataset.id}
                  className={cn(
                      "group relative overflow-hidden rounded-xl",
                      // 默认状态：显示浅色边框
                      "border-2",
                      "bg-gradient-to-br from-white via-white to-blue-50/20",
                      "transition-all duration-300 ease-in-out",
                      "shadow-sm hover:shadow-lg hover:shadow-blue-100/40",
                      // 悬停时统一变为蓝色边框
                      "hover:border-blue-300/80",
                      "hover:-translate-y-0.5",
                      "h-full w-full max-w-lg"
                  )}
              >
                <CardHeader>
                  {/* 标题和类型标签 */}
                  <div className="flex items-start justify-between gap-2 h-11">
                      <CardTitle
                          className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-lg leading-tight line-clamp-2 flex-1"
                          title={dataset.titleCn}
                          onClick={() => onDatasetClick(dataset)}
                      >
                          {dataset.titleCn}
                      </CardTitle>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">
                        {typeLabels[dataset.type as keyof typeof typeLabels] || dataset.type}
                      </Badge>
                      {dataset.parentDatasetId && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            随访数据
                          </Badge>
                      )}
                    </div>
                  </div>

                  {/* 研究领域 */}
                  {dataset.subjectArea?.name && (
                      <div className="mt-5 flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">{dataset.subjectArea.name}</span>
                      </div>
                  )}

                  {/* 关键词标签 */}
                  <div className="flex flex-wrap gap-2">
                    {(dataset.keywords?.slice(0, 3) || []).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                          {keyword.length > 12 ? `${keyword.substring(0, 12)}...` : keyword}
                        </Badge>
                    ))}
                    {dataset.keywords && dataset.keywords.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                          +{dataset.keywords.length - 3}
                        </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* 描述 */}
                  <div className="space-y-2 h-[65px]">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed whitespace-pre-line">
                      {dataset.description || "暂无描述信息"}
                    </p>
                  </div>

                  {/* 核心数据指标 */}
                  <div className={`grid ${dataset.followUpDatasets && dataset.followUpDatasets.length > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-3 bg-gray-50 rounded-lg`}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Hash className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">{recordCount?.toLocaleString() || '-'}</span>
                      </div>
                      <span className="text-xs text-gray-600">样本记录</span>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Database className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-gray-800">{variableCount || '-'}</span>
                      </div>
                      <span className="text-xs text-gray-600">研究变量</span>
                    </div>
                    {dataset.followUpDatasets && dataset.followUpDatasets.length > 0 && (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-gray-800">{dataset.followUpDatasets.length}</span>
                        </div>
                        <span className="text-xs text-gray-600">随访数据集</span>
                      </div>
                    )}
                  </div>

                  {/* 详细信息 */}
                  <div className="space-y-2 text-sm">
                    {/* 采集时间 */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      <span>采集时间: {formatDate(dataset.startDate)} 至 {formatDate(dataset.endDate)}</span>
                    </div>

                    {/* 采集单位 */}
                    {dataset.dataCollectionUnit && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-3.5 w-3.5 text-purple-500" />
                          <span>采集单位: {dataset.dataCollectionUnit}</span>
                        </div>
                    )}

                    {/* 数据集负责人信息 */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5 text-green-500" />
                      <span>数据集负责人: {dataset.datasetLeader || '未指定'}</span>
                    </div>
                  </div>

                  {/* 底部信息栏 */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>提供者: {dataset.provider?.realName || '未知'}</span>
                        <span>•</span>
                        <span>访问热度 {dataset.weeklyPopularity || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>发布于: {formatDate(dataset.firstPublishedDate || dataset.createdAt)}</span>
                      </div>
                    </div>

                    <Button size="sm" variant="outline" className="gap-2 ml-1"
                            onClick={() => onDatasetClick(dataset)}>
                      <BarChart3 className="h-4 w-4" />
                      查看详情
                    </Button>
                  </div>
                </CardContent>
              </Card>
          );
        })}
      </>
  );
};