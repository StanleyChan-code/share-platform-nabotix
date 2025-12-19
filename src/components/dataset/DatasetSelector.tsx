import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dataset } from "@/integrations/api/datasetApi.ts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { api } from "@/integrations/api/client.ts";
import { DatasetTypes } from "@/lib/enums.ts";

interface DatasetSelectorProps {
  selectedDataset: Dataset | null;
  onDatasetSelect: (dataset: Dataset) => void;
  label?: string;
  required?: boolean;
  datasetId?: string;
  disabled?: boolean;
  subjectAreaId?: string;
  providerId?: string;
  isTopLevel?: boolean;
  currentVersionDateFrom?: string;
  currentVersionDateTo?: string;
  size?: number;
}

export function DatasetSelector({ 
  selectedDataset, 
  onDatasetSelect, 
  label = "关联数据集", 
  required = true,
  datasetId,
  disabled = false,
  subjectAreaId,
  providerId,
  isTopLevel = false,
  currentVersionDateFrom,
  currentVersionDateTo,
  size = 5
}: DatasetSelectorProps) {
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState("");
  const [datasetSearchLoading, setDatasetSearchLoading] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);
  const [initialDatasetLoaded, setInitialDatasetLoaded] = useState(false);

  // 加载初始数据集
  useEffect(() => {
    const loadInitialDataset = async () => {
      if (datasetId && !initialDatasetLoaded && !selectedDataset) {
        try {
          const response = await api.get(`/datasets/${datasetId}`);
          if (response.data.success) {
            onDatasetSelect(response.data.data);
            setInitialDatasetLoaded(true);
          }
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
      if (datasetSearchTerm.trim() === "" || disabled) {
        setFilteredDatasets([]);
        return;
      }

      setDatasetSearchLoading(true);
      try {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append('titleCnOrKey', encodeURIComponent(datasetSearchTerm));
        queryParams.append('isTopLevel', String(isTopLevel));
        queryParams.append('size', String(size));
              
        if (subjectAreaId) queryParams.append('subjectAreaId', subjectAreaId);
        if (providerId) queryParams.append('providerId', providerId);
        if (currentVersionDateFrom) queryParams.append('currentVersionDateFrom', currentVersionDateFrom);
        if (currentVersionDateTo) queryParams.append('currentVersionDateTo', currentVersionDateTo);
              
        // 使用 /datasets/query API 端点进行搜索
        const response = await api.get(`/datasets/query?${queryParams.toString()}`);
        if (response.data.success) {
          // 限制最多显示5个结果
          setFilteredDatasets(response.data.data.content.slice(0, 5));
        }
      } catch (error) {
        console.error("搜索数据集时出错:", error);
        setFilteredDatasets([]);
      } finally {
        setDatasetSearchLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      searchDatasets();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [datasetSearchTerm, disabled]);

  const handleDatasetSelect = (dataset: Dataset) => {
    if (disabled) return;
    onDatasetSelect(dataset);
    setDatasetPopoverOpen(false);
    setDatasetSearchTerm("");
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="dataset">
        {label} {required && <span className="text-destructive">*</span>}
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
              placeholder="搜索数据集..." 
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                        <span className="truncate">发布时间: {new Date(dataset.firstPublishedDate).toLocaleDateString()}</span>
                        <span className="truncate">提供者: {dataset.datasetLeader}</span>
                        <span className="truncate">采集单位: {dataset.dataCollectionUnit}</span>
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