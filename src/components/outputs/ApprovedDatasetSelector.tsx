import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dataset, datasetApi } from "@/integrations/api/datasetApi";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatasetTypes } from "@/lib/enums";

interface ApprovedDatasetSelectorProps {
  selectedDataset: Dataset | null;
  onDatasetSelect: (dataset: Dataset) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  size?: number;
}

export function ApprovedDatasetSelector({ 
  selectedDataset, 
  onDatasetSelect, 
  label = "关联数据集", 
  required = true,
  disabled = false,
  size = 5
}: ApprovedDatasetSelectorProps) {
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState("");
  const [datasetSearchLoading, setDatasetSearchLoading] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  // 获取用户已审核通过的数据集
  useEffect(() => {
    const searchDatasets = async () => {
      if (datasetSearchTerm.trim() === "" || disabled) {
        // 如果没有搜索词，获取最新的已审核通过的数据集
        try {
          setDatasetSearchLoading(true);
          const response = await datasetApi.getMyApprovedDatasets({ size: size });
          
          // 如果没有搜索词，直接显示最新数据
          if (datasetSearchTerm.trim() === "") {
            setFilteredDatasets(response.data.content);
          } else {
            // 过滤搜索结果
            const filtered = response.data.content.filter(dataset =>
              dataset.titleCn.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
              (dataset.keywords && dataset.keywords.some(keyword => 
                keyword.toLowerCase().includes(datasetSearchTerm.toLowerCase())))
            );
            setFilteredDatasets(filtered.slice(0, size));
          }
        } catch (error) {
          console.error("获取已审核通过数据集时出错:", error);
          setFilteredDatasets([]);
        } finally {
          setDatasetSearchLoading(false);
        }
        return;
      }

      setDatasetSearchLoading(true);
      try {
        const response = await datasetApi.getMyApprovedDatasets({ size: size });
        
        // 过滤搜索结果
        const filtered = response.data.content.filter(dataset =>
          dataset.titleCn.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
          (dataset.keywords && dataset.keywords.some(keyword => 
            keyword.toLowerCase().includes(datasetSearchTerm.toLowerCase())))
        );
        setFilteredDatasets(filtered.slice(0, size));
      } catch (error) {
        console.error("搜索已审核通过数据集时出错:", error);
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
              placeholder="搜索已审核通过的数据集..." 
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