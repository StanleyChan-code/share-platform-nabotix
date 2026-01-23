import {
    ChevronRight,
    ChevronDown,
    Database,
    Calendar,
    Tag,
    FileText,
    User,
    Building,
    Users,
    Target,
    BarChart3,
    Leaf,
    Hash,
    Eye,
    Clock,
    Layers
} from "lucide-react";
import {useState} from "react";
import {cn, formatDate} from "@/lib/utils";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {DatasetTypes} from "@/lib/enums";
import {Dataset} from "@/integrations/api/datasetApi.ts";
import {getLatestApprovedVersion} from "@/lib/datasetUtils.ts";

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

    // 统计字段数量
    const getFieldStats = (dataset: Dataset) => {
        const latestVersion = getLatestApprovedVersion(dataset.versions);
        const recordCount = latestVersion?.recordCount || 0;
        const variableCount = latestVersion?.variableCount || 0;

        // 处理 demographicFields 和 outcomeFields
        let demographicCount = 0;
        let outcomeCount = 0;

        if (Array.isArray(dataset.demographicFields)) {
            demographicCount = dataset.demographicFields.length;
        } else if (dataset.demographicFields && typeof dataset.demographicFields === 'object') {
            demographicCount = Object.keys(dataset.demographicFields).length;
        }

        if (Array.isArray(dataset.outcomeFields)) {
            outcomeCount = dataset.outcomeFields.length;
        } else if (dataset.outcomeFields && typeof dataset.outcomeFields === 'object') {
            outcomeCount = Object.keys(dataset.outcomeFields).length;
        }

        return { recordCount, variableCount, demographicCount, outcomeCount };
    };

    const getLevelStyles = (level: number) => {
        const baseStyles = "relative rounded-lg transition-all duration-200 hover:shadow-md";

        if (level === 0) {
            return cn(baseStyles, "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500");
        } else if (level === 1) {
            return cn(baseStyles, "bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 ml-6");
        } else {
            return cn(baseStyles, "bg-gradient-to-r from-purple-50 to-violet-50 border-l-4 border-purple-500 ml-12");
        }
    };

    const getDatasetIcon = (level: number) => {
        if (level === 0) {
            return <Database className="h-5 w-5 text-blue-600"/>;
        } else if (level === 1) {
            return <Leaf className="h-4 w-4 text-green-600"/>;
        } else {
            return <BarChart3 className="h-4 w-4 text-purple-600"/>;
        }
    };

    const handleExpandClick = (e: React.MouseEvent, datasetId: string) => {
        e.stopPropagation();
        toggleExpand(datasetId);
    };

    const handleDetailClick = (e: React.MouseEvent, dataset: Dataset) => {
        e.stopPropagation();
        onDatasetClick(dataset);
    };

    const renderDataset = (dataset: Dataset, level: number = 0) => {
        const hasChildren = (followupMap[dataset.id] && followupMap[dataset.id].length > 0) ||
            (dataset.followUpDatasets && dataset.followUpDatasets.length > 0);
        const isExpanded = expandedIds.has(dataset.id);
        const children = followupMap[dataset.id] || [];
        const fieldStats = getFieldStats(dataset);

        // 对子节点按首次发布日期排序
        const sortedChildren = [...children].sort((a, b) => {
            if (!a.firstPublishedDate) return 1;
            if (!b.firstPublishedDate) return -1;
            return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        });

        return (
            <div key={dataset.id} className="mb-2">
                <Card
                    className={getLevelStyles(level)}
                    onClick={(e) => {
                        if (!isExpanded) {
                            handleExpandClick(e, dataset.id)
                        }
                    }}
                >
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            {/* 展开/收起按钮 */}
                            {hasChildren && (
                                <button
                                    onClick={(e) => handleExpandClick(e, dataset.id)}
                                    className="shrink-0 mt-0.5 p-1 rounded-full hover:bg-black/5 transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronDown className="h-10 w-10 text-muted-foreground"/>
                                    ) : (
                                        <ChevronRight className="h-10 w-10 text-muted-foreground"/>
                                    )}
                                </button>
                            )}
                            {!hasChildren && <div className="w-10"/>}

                            {/* 数据集图标 */}
                            <div className="shrink-0 mt-0.5">
                                {getDatasetIcon(level)}
                            </div>

                            {/* 主要内容 */}
                            <div className="flex-1 min-w-0 space-y-3 pr-4">
                                {/* 标题和标签行 */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 
                                            className="font-semibold text-lg leading-tight text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                                            onClick={(e) => handleDetailClick(e, dataset)}
                                        >
                                            {dataset.titleCn}
                                        </h3>

                                        {/* 研究领域和采样方法 */}
                                        <div className="flex items-center gap-3 mb-2">
                                            {dataset.subjectArea?.name && (
                                                <div className="flex items-center gap-1 text-sm text-green-600">
                                                    <Target className="h-3 w-3"/>
                                                    <span className="font-medium">{dataset.subjectArea.name}</span>
                                                </div>
                                            )}
                                            {dataset.samplingMethod && (
                                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                                    采样方法: {dataset.samplingMethod}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {/* 层级标识 */}
                                        {level === 0 ? (
                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                基线数据集
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline"
                                                   className="bg-green-50 text-green-700 border-green-200 text-xs">
                                                随访数据集{level > 1 ? ` L${level}` : ''}
                                            </Badge>
                                        )}

                                        <Badge variant="secondary" className="text-xs">
                                            {typeLabels[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                                        </Badge>
                                    </div>
                                </div>

                                {/* 数据规模统计 */}
                                <div className={`grid ${dataset.followUpDatasets && dataset.followUpDatasets.length > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 p-3 bg-white rounded-lg border`}>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Hash className="h-4 w-4 text-blue-600"/>
                                            <span className="font-bold text-gray-800">{fieldStats.recordCount.toLocaleString()}</span>
                                        </div>
                                        <span className="text-xs text-gray-600">样本记录</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Layers className="h-4 w-4 text-green-600"/>
                                            <span className="font-bold text-gray-800">{fieldStats.variableCount}</span>
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

                                {/* 描述 */}
                                {dataset.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-line">
                                        {dataset.description}
                                    </p>
                                )}

                                {/* 关键词 */}
                                {dataset.keywords && dataset.keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {dataset.keywords.slice(0, 4).map((keyword, index) => (
                                            <Badge key={index} variant="outline" className="text-xs bg-white">
                                                {keyword}
                                            </Badge>
                                        ))}
                                        {dataset.keywords.length > 4 && (
                                            <Badge variant="outline" className="text-xs bg-gray-100">
                                                +{dataset.keywords.length - 4}
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* 详细元信息 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-500"/>
                                            <div>
                                                <span className="font-medium">采集周期:</span>
                                                <span className="ml-1">{formatDate(dataset.startDate)} - {formatDate(dataset.endDate)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-green-500"/>
                                            <div>
                                                <span className="font-medium">首席研究员（PI）:</span>
                                                <span className="ml-1 truncate" title={dataset.principalInvestigator}>
                                                    {dataset.principalInvestigator || '未指定'}
                                                </span>
                                            </div>
                                        </div>
                                        {dataset.datasetLeader && dataset.datasetLeader !== dataset.principalInvestigator && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <User className="h-3 w-3"/>
                                                <span className="font-medium">提供者:</span>
                                                <span className="ml-1">{dataset.provider?.realName || '未知'}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {dataset.dataCollectionUnit && (
                                            <div className="flex items-center gap-2">
                                                <Building className="h-4 w-4 text-purple-500"/>
                                                <div>
                                                    <span className="font-medium">采集单位:</span>
                                                    <span className="ml-1 truncate" title={dataset.dataCollectionUnit}>
                                                        {dataset.dataCollectionUnit}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-orange-500"/>
                                            <div>
                                                <span>数据集负责人: {dataset.datasetLeader}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 底部信息 */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3"/>
                                            <span>发布于 {formatDate(dataset.firstPublishedDate)}</span>
                                        </div>
                                        {dataset.weeklyPopularity !== undefined && (
                                            <div className="flex items-center gap-1">
                                                <Eye className="h-3 w-3"/>
                                                <span>访问热度 {dataset.weeklyPopularity}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-2 text-xs"
                                        onClick={(e) => handleDetailClick(e, dataset)}
                                    >
                                        查看详情
                                        <ChevronRight className="h-3 w-3"/>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 子数据集 */}
                {isExpanded && (
                    <div className="mt-2 space-y-2">
                        {sortedChildren.map(child => renderDataset(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {baselineDatasets.map(dataset => renderDataset(dataset, 0))}
        </div>
    );
}