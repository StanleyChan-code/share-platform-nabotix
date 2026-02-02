import React from "react";
import { Dataset } from "@/integrations/api/datasetApi";
import { DatasetTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils";

interface DatasetInfoDisplayProps {
    dataset: Dataset;
    title?: string;
}

const DatasetInfoDisplay: React.FC<DatasetInfoDisplayProps> = ({
    dataset,
    title = "数据集信息"
}) => {
    return (
        <div className="border rounded-lg p-4 bg-muted/50 my-2">
            <h3 className="font-semibold text-lg mb-3">{title}</h3>

            <div className={"mb-3"}>
                <span className="text-xs font-medium text-muted-foreground block mb-1">标题</span>
                <div className="text-sm font-medium truncate whitespace-pre-wrap break-all" title={dataset.titleCn}>
                    {dataset.titleCn}
                </div>
            </div>
            {/* 基本信息网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">类型</span>
                        <div className="text-sm truncate">
                            {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">研究学科</span>
                        <div className="text-sm truncate" title={dataset.subjectArea?.name || '无'}>
                            {dataset.subjectArea?.name || '无'}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">数据类型</span>
                        <div className="text-sm truncate">
                            {dataset.parentDatasetId ? '随访数据集' : '基线数据集'}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">发布时间</span>
                        <div className="text-sm">{formatDate(dataset.firstPublishedDate)}</div>
                    </div>

                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">关键词</span>
                        {/* 关键词标签 */}
                        {dataset.keywords && dataset.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 ml-1">
                                {dataset.keywords.map((keyword, index) => (
                                    <span key={index} className="px-1.5 py-1.25 bg-gray-200 text-gray-700 rounded-full text-xs"
                                    >{keyword}</span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">数据集负责人</span>
                        <div className="text-sm truncate" title={dataset.datasetLeader}>
                            {dataset.datasetLeader}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">首席研究员（PI）</span>
                        <div className="text-sm truncate" title={dataset.principalInvestigator}>
                            {dataset.principalInvestigator || '无'}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">数据集提供者</span>
                        <div className="text-sm truncate" title={dataset.provider?.realName}>
                            {dataset.provider?.realName || '无'}
                        </div>
                    </div>
                    
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">采集单位</span>
                        <div className="text-sm truncate" title={dataset.dataCollectionUnit}>
                            {dataset.dataCollectionUnit}
                        </div>
                    </div>

                    {/* 数据采集时间范围 */}
                    <div>
                        <span className="text-xs font-medium text-muted-foreground block mb-1">数据采集时间</span>
                        <div className="text-sm">
                            {formatDate(dataset.startDate)} 至 {formatDate(dataset.endDate)}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DatasetInfoDisplay;