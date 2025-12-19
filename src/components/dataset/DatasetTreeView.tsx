import {ChevronRight, ChevronDown, Database, Calendar, Hash, Tag, FileText, User} from "lucide-react";
import {useState} from "react";
import {cn, formatDate} from "@/lib/utils";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {DatasetTypes} from "@/lib/enums";
import {Dataset} from "@/integrations/api/datasetApi.ts";

interface DatasetTreeViewProps {
    datasets: Dataset[];
    onDatasetClick: (dataset: Dataset) => void;
}

const typeLabels = DatasetTypes;

export function DatasetTreeView({datasets, onDatasetClick}: DatasetTreeViewProps) {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // 构建树形结构
    const buildTree = (datasets: Dataset[]): [Dataset[], Record<string, Dataset[]>] => {
        const baselineMap: Record<string, Dataset> = {};
        const followupMap: Record<string, Dataset[]> = {};

        // 初始化所有数据集到映射中
        datasets.forEach(dataset => {
            baselineMap[dataset.id] = dataset;
        });

        // 分离基线数据集和随访数据集
        const baselineDatasets: Dataset[] = [];

        datasets.forEach(dataset => {
            if (!dataset.parentDatasetId) {
                // 基线数据集
                baselineDatasets.push(dataset);
            } else {
                // 随访数据集
                const parentId = dataset.parentDatasetId;
                if (!followupMap[parentId]) {
                    followupMap[parentId] = [];
                }
                followupMap[parentId].push(dataset);
            }
        });

        // 如果某个数据集既有 parentDatasetId 又有 followUpDatasets，则将其随访数据集也加入到映射中
        datasets.forEach(dataset => {
            if (dataset.followUpDatasets && dataset.followUpDatasets.length > 0) {
                if (!followupMap[dataset.id]) {
                    followupMap[dataset.id] = [];
                }
                // 将 followUpDatasets 中的数据集添加到 followupMap
                dataset.followUpDatasets.forEach(followup => {
                    // 避免重复添加
                    if (!followupMap[dataset.id].some(item => item.id === followup.id)) {
                        followupMap[dataset.id].push(followup);
                    }
                });
            }
        });

        return [baselineDatasets, followupMap];
    };

    const [baselineDatasets, followupMap] = buildTree(datasets);

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const truncateText = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const renderDataset = (dataset: Dataset, level: number = 0) => {
        const hasChildren = (followupMap[dataset.id] && followupMap[dataset.id].length > 0) ||
            (dataset.followUpDatasets && dataset.followUpDatasets.length > 0);
        const isExpanded = expandedIds.has(dataset.id);
        const children = followupMap[dataset.id] || [];

        // 对子节点按首次发布日期排序
        const sortedChildren = [...children].sort((a, b) => {
            if (!a.firstPublishedDate) return 1;
            if (!b.firstPublishedDate) return -1;
            return new Date(a.firstPublishedDate).getTime() - new Date(b.firstPublishedDate).getTime();
        });

        return (
            <div key={dataset.id}>
                <div
                    className={cn(
                        "flex items-start gap-2 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors",
                        level > 0 && "ml-6 border-l-2 border-muted"
                    )}
                    style={{paddingLeft: `${level * 1.5 + 0.75}rem`}}
                >
                    {hasChildren && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(dataset.id);
                            }}
                            className="shrink-0 mt-1"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground"/>
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground"/>
                            )}
                        </button>
                    )}
                    {!hasChildren && <div className="w-4"/>}

                    <div
                        className="flex-1 flex flex-col"
                        onClick={() => onDatasetClick(dataset)}
                    >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                            <Database className="h-4 w-4 shrink-0 text-muted-foreground mt-1"/>
                            <div className="min-w-0 flex-1 space-y-2">
                                <p className="font-medium truncate">{truncateText(dataset.titleCn, 30)}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {level > 0 && (
                                        <Badge variant="outline" className="text-xs">
                                            随访数据
                                        </Badge>
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                        {typeLabels[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                                    </Badge>
                                </div>
                                <div className="mt-2 space-y-2">
                                    {dataset.description && (
                                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                                            <FileText className="h-4 w-4 shrink-0 mt-0.5"/>
                                            <p className="line-clamp-3">{dataset.description}</p>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                                            <Calendar className="h-3 w-3"/>
                                            <span>{formatDate(dataset.firstPublishedDate)}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                                            <User className="h-3 w-3"/>
                                            <span>{dataset.dataCollectionUnit}</span>
                                        </div>
                                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                                            <User className="h-3 w-3"/>
                                            <span>PI: {dataset.principalInvestigator}</span>
                                        </div>
                                    </div>
                                    {dataset.keywords && dataset.keywords.length > 0 && (
                                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                                            <Tag className="h-3 w-3 shrink-0 mt-0.5"/>
                                            <div className="flex flex-wrap gap-1">
                                                {dataset.keywords.slice(0, 3).map((keyword, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                                        {keyword}
                                                    </Badge>
                                                ))}
                                                {dataset.keywords.length > 3 && (
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                        +{dataset.keywords.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {isExpanded && sortedChildren.map(child => renderDataset(child, level + 1))}
            </div>
        );
    };

    return (
        <div className="m-4 border rounded-lg shadow-sm bg-card">
            <div className="space-y-1 p-2">
                {baselineDatasets.map(dataset => renderDataset(dataset, 0))}
            </div>
        </div>
    );
}