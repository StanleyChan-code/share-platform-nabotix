import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dataset, datasetApi } from "@/integrations/api/datasetApi.ts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import {Asterisk, Check, ChevronsUpDown, Loader2} from "lucide-react";
import {cn, formatDate} from "@/lib/utils.ts";
import { DatasetTypes } from "@/lib/enums.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";

interface DatasetSelectorProps {
  selectedDataset: Dataset | null;
  onDatasetSelect: (dataset: Dataset) => void;
  label?: string;
  required?: boolean;
  datasetId?: string;
  providerId?: string;
  disabled?: boolean;
  subjectAreaId?: string;
  isTopLevel?: boolean;
  startDate?: string;
  endDate?: string;
  size?: number;
}

export function DatasetSelector({ 
  selectedDataset, 
  onDatasetSelect, 
  label = "关联数据集",
  required = true,
  datasetId,
    providerId,
  disabled = false,
  subjectAreaId,
  isTopLevel = false,
  startDate,
  endDate,
  size = 5
}: DatasetSelectorProps) {
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState("");
  const [datasetSearchLoading, setDatasetSearchLoading] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);
  const [initialDatasetLoaded, setInitialDatasetLoaded] = useState(false);

  // 使用防抖Hook，延迟550ms
  const debouncedSearchTerm = useDebounce(datasetSearchTerm, 550);

  // 加载初始数据集
  useEffect(() => {
    const loadInitialDataset = async () => {
      if (datasetId && !initialDatasetLoaded && !selectedDataset) {
        try {
          const datasetResponse = await datasetApi.getDatasetById(datasetId);
          onDatasetSelect(datasetResponse.data);
          setInitialDatasetLoaded(true);
        } catch (error) {
          console.error("加载初始数据集时出错:", error);
        }
      }
    };

    loadInitialDataset();
  }, [datasetId, selectedDataset, onDatasetSelect, initialDatasetLoaded]);

  // 搜索数据集
  useEffect(() => {
    const searchDatasets = async () => {
      if (debouncedSearchTerm.trim() === "" || disabled) {
        setFilteredDatasets([]);
        return;
      }

      setDatasetSearchLoading(true);
      try {
        // 使用 datasetApi 进行数据集查询
        const result = await datasetApi.queryDatasets({
          searchTerm: debouncedSearchTerm,
          isTopLevel,
          size,
          providerId,
          subjectAreaId,
          dateFrom: startDate,
          dateTo: endDate
        });
        
        // 限制最多显示5个结果
        setFilteredDatasets(result.data.content);
      } catch (error) {
        console.error("搜索数据集时出错:", error);
        setFilteredDatasets([]);
      } finally {
        setDatasetSearchLoading(false);
      }
    };

    searchDatasets();
  }, [debouncedSearchTerm, disabled]);

  const handleDatasetSelect = (dataset: Dataset) => {
    if (disabled) return;
    onDatasetSelect(dataset);
    setDatasetPopoverOpen(false);
    setDatasetSearchTerm("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="dataset">
        {label} {required && <Asterisk className="h-3 w-3 text-red-500" />}
      </Label>
      <Popover open={datasetPopoverOpen} onOpenChange={setDatasetPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={datasetPopoverOpen}
            className="w-full justify-between mx-1 truncate"
            disabled={disabled}
          >
            <span className="truncate">
              {selectedDataset ? (selectedDataset.titleCn?.length > 30 ? `${selectedDataset.titleCn.substring(0, 30)}...` : selectedDataset.titleCn) : "选择使用的数据集"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="搜索数据集标题或关键词..."
              value={datasetSearchTerm}
              onValueChange={setDatasetSearchTerm}
              disabled={disabled}
            />
            <CommandEmpty>
              {datasetSearchLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                "未找到相关数据集"
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredDatasets.map((dataset) => (
                <CommandItem
                  key={dataset.id}
                  onSelect={() => handleDatasetSelect(dataset)}
                  className="cursor-pointer"
                  disabled={disabled}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedDataset?.id === dataset.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col w-full">
                    <span className="truncate font-medium" title={dataset.titleCn}>{dataset.titleCn?.length > 30 ? `${dataset.titleCn.substring(0, 30)}...` : dataset.titleCn}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="bg-secondary px-2 py-1 rounded">
                          {DatasetTypes[dataset.type as keyof typeof DatasetTypes] || dataset.type}
                        </span>
                        {dataset.subjectArea && (
                          <span className="bg-secondary px-2 py-1 rounded">
                            {dataset.subjectArea.name}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-1 mt-1">
                        <span className="truncate">数据集负责人: {dataset.datasetLeader}</span>
                        <span className="truncate">采集单位: {dataset.dataCollectionUnit}</span>
                        <span className="truncate">发布时间: {formatDate(dataset.firstPublishedDate)}</span>
                        <span className="truncate">数据提供者: {dataset.provider.realName}</span>
                      </div>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}