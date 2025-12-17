import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dataset } from "@/integrations/api/datasetApi";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/integrations/api/client";
import { DatasetTypes } from "@/lib/enums";

interface DatasetSelectorProps {
  selectedDataset: Dataset | null;
  onDatasetSelect: (dataset: Dataset) => void;
  label?: string;
  required?: boolean;
}

export function DatasetSelector({ 
  selectedDataset, 
  onDatasetSelect, 
  label = "关联数据集", 
  required = true 
}: DatasetSelectorProps) {
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState("");
  const [datasetSearchLoading, setDatasetSearchLoading] = useState(false);
  const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

  // 搜索数据集
  useEffect(() => {
    const searchDatasets = async () => {
      if (datasetSearchTerm.trim() === "") {
        setFilteredDatasets([]);
        return;
      }

      setDatasetSearchLoading(true);
      try {
        // 使用 /datasets/query API 端点进行搜索
        const response = await api.get(`/datasets/query?titleCnOrKey=${encodeURIComponent(datasetSearchTerm)}&isTopLevel=false&size=5`);
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
  }, [datasetSearchTerm]);

  const handleDatasetSelect = (dataset: Dataset) => {
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