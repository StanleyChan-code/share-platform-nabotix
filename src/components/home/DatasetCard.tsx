import { Calendar, Users, Building, Tag, Eye, Database, Star } from "lucide-react";
import { Dataset } from "@/integrations/api/datasetApi";
import { DatasetTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

interface DatasetCardProps {
  dataset: Dataset;
  showRecommendationBadge?: boolean;
}

export const DatasetCard = ({ dataset, showRecommendationBadge = false }: DatasetCardProps) => {
  // 格式化关键词显示
  const displayKeywords = dataset.keywords?.slice(0, 3) || [];
  const hasMoreKeywords = dataset.keywords && dataset.keywords.length > 3;

  return (
      <div className="group flex flex-col p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 bg-white hover:border-blue-200 h-full">
        {/* 标题和标签行 */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
              className="font-semibold text-lg leading-tight line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors"
              title={dataset.titleCn}
          >
            {dataset.titleCn}
          </h3>
          <div className="flex flex-col items-end gap-2 ml-2 flex-shrink-0">
            {showRecommendationBadge && (
                <span className="bg-gradient-to-r px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-sm flex items-center gap-1">
              推荐
            </span>
            )}
            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap border border-blue-200">
            {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
          </span>
          </div>
        </div>

        {/* 研究领域 */}
        {dataset.subjectArea?.name && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Database className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium">研究领域:</span>
              <span>{dataset.subjectArea.name}</span>
            </div>
        )}

        {/* 描述 */}
        {dataset.description && (
            <p
                className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1 leading-relaxed  whitespace-pre-line"
                title={dataset.description}
            >
              {dataset.description}
            </p>
        )}

        {/* 关键词标签 */}
        {displayKeywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {displayKeywords.map((keyword, index) => (
                  <span
                      key={index}
                      className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs border"
                      title={keyword}
                  >
              <Tag className="h-3 w-3" />
                    {keyword.length > 10 ? `${keyword.substring(0, 10)}...` : keyword}
            </span>
              ))}
              {hasMoreKeywords && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
              +{dataset.keywords!.length - 3}个
            </span>
              )}
            </div>
        )}

        {/* 元信息 */}
        <div className="space-y-3 mt-auto pt-3 border-t border-gray-100">
          {/* 采集时间和样本量 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-medium">采集时间:</span>
              <span>{formatDate(dataset.startDate)} - {formatDate(dataset.endDate)}</span>
            </div>
            {dataset.searchCount !== undefined && (
                <div className="flex items-center gap-1 text-gray-500">
                  <Eye className="h-3.5 w-3.5 text-purple-500" />
                  <span>近期访问: {dataset.searchCount}</span>
                </div>
            )}
          </div>

          {/* 负责人和采集单位 */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-500 truncate">
              <Users className="h-3.5 w-3.5 text-green-500" />
              <span className="font-medium">首席研究员（PI）:</span>
              <span
                  className="truncate max-w-[100px]"
                  title={dataset.principalInvestigator}
              >
              {dataset.principalInvestigator || '未指定'}
            </span>
            </div>
          </div>

          {dataset.dataCollectionUnit && (
              <div className="flex items-center gap-2 text-sm text-gray-500 truncate">
                <Building className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-medium">采集单位:</span>
                <span
                    className="truncate flex-1"
                    title={dataset.dataCollectionUnit}
                >
              {dataset.dataCollectionUnit}
            </span>
              </div>
          )}

          {/* 提供者和更新时间 */}
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2 truncate">
              <Users className="h-3 w-3" />
              <span className="truncate max-w-[200px]" title={dataset.provider?.realName}>
              提供者: {dataset.provider?.realName || '未知'}
            </span>
            </div>
            <span>{formatDate(dataset.currentVersionDate || dataset.updatedAt)}</span>
          </div>
        </div>
      </div>
  );
};