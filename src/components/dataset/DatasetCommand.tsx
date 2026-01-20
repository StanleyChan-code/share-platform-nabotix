import {Dataset} from "@/integrations/api/datasetApi.ts";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command.tsx";
import {Loader2, Database, Users, Building, Calendar, User} from "lucide-react";
import {cn, formatDate} from "@/lib/utils.ts";
import {DatasetTypes} from "@/lib/enums.ts";

interface DatasetCommandProps {
    selectedDataset: Dataset | null;
    filteredDatasets: Dataset[];
    datasetSearchTerm: string;
    onDatasetSearchTermChange: (term: string) => void;
    datasetSearchLoading: boolean;
    onDatasetSelect: (dataset: Dataset) => void;
    disabled: boolean;
    placeholder?: string;
}

export function DatasetCommand({
                                   selectedDataset,
                                   filteredDatasets,
                                   datasetSearchTerm,
                                   onDatasetSearchTermChange,
                                   datasetSearchLoading,
                                   onDatasetSelect,
                                   disabled,
                                   placeholder = "搜索数据集标题或关键词..."
                               }: DatasetCommandProps) {
    return (
        <Command shouldFilter={false} className="max-h-[40vh]">
            <CommandInput
                placeholder={placeholder}
                value={datasetSearchTerm}
                onValueChange={onDatasetSearchTermChange}
                disabled={disabled}
                className="border-border"
            />
            {datasetSearchLoading ? (
                <div className="flex items-center justify-center p-6 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2"/>
                    <span>搜索中...</span>
                </div>
            ) : filteredDatasets.length === 0 ? (
                <CommandEmpty>
                    <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
                        <Database className="h-8 w-8 mb-3 opacity-50"/>
                            {datasetSearchTerm.length > 0 ? (
                                <span className="block mb-2">
                                    未找到相关数据集
                                </span>
                            ) : (
                                <span className="block mb-2">
                                    请输入数据集标题或关键词进行搜索
                                </span>
                            )}
                    </div>
                </CommandEmpty>
            ) : (
                <CommandList className="max-h-[40vh]">
                    <CommandGroup>
                        {filteredDatasets.map((dataset) => (
                            <CommandItem
                                key={dataset.id}
                                onSelect={() => onDatasetSelect(dataset)}
                                className={cn(
                                    "cursor-pointer group py-3 px-4 border-b border-border/50 last:border-b-0 transition-colors hover:bg-accent/50 focus:bg-accent/50 focus:outline-none",
                                    selectedDataset?.id === dataset.id && "bg-yellow-50 text-primary",
                                    disabled && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={disabled}
                            >
                                    <div className="flex flex-col w-full min-w-0">
                                        {/* 数据集标题 */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <Database className="h-4 w-4 text-primary flex-shrink-0"/>
                                            <span
                                                className="font-medium truncate max-w-sm"
                                                title={dataset.titleCn}
                                            >
                                              {dataset.titleCn}
                                            </span>

                                        {/* 关键词标签 */}
                                        {dataset.keywords && dataset.keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1 ml-1">
                                                {dataset.keywords.map((keyword, index) => (
                                                    <span key={index}
                                                          className="px-1.5 py-1.25 bg-gray-200 text-gray-700 rounded-full text-xs">
                                                          {keyword}
                                                        </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 类型、学科和基线/随访标签 */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                              {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                                            </span>
                                        {dataset.subjectArea && (
                                            <span
                                                className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                {dataset.subjectArea.name}
                                              </span>
                                        )}
                                        {dataset.parentDatasetId ? (
                                            <span
                                                className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                                随访数据集
                                              </span>
                                        ) : (
                                            <span
                                                className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                                基线数据集
                                              </span>
                                        )}
                                    </div>

                                    {/* 详细信息 */}
                                    <div
                                        className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-3 w-3 flex-shrink-0"/>
                                            <span
                                                className="truncate">负责人: {dataset.datasetLeader || '未指定'}</span>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3 flex-shrink-0"/>
                                            <span
                                                className="truncate">提供者: {dataset.provider?.realName || '未知'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Building className="h-3 w-3 flex-shrink-0"/>
                                            <span
                                                className="truncate">采集单位: {dataset.dataCollectionUnit || '未指定'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 flex-shrink-0"/>
                                            <span>{formatDate(dataset.firstPublishedDate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            )}
        </Command>
    );
}