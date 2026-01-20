import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dataset, datasetApi } from "@/integrations/api/datasetApi.ts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { ChevronsUpDown } from "lucide-react";
import { DatasetCommand } from "@/components/dataset/DatasetCommand.tsx";
import { useDebounce } from "@/hooks/useDebounce.ts";

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
  
  // 添加防抖处理，延迟550ms
  const debouncedDatasetSearchTerm = useDebounce(datasetSearchTerm, 550);

  // 获取用户已审核通过的数据集
  useEffect(() => {
    const searchDatasets = async () => {
      if (debouncedDatasetSearchTerm.trim() === "" || disabled) {
        // 如果没有搜索词，获取最新的已审核通过的数据集
        try {
          setDatasetSearchLoading(true);
          const response = await datasetApi.getMyApprovedDatasets({ size: size });
          
          // 如果没有搜索词，直接显示最新数据
          if (debouncedDatasetSearchTerm.trim() === "") {
            setFilteredDatasets(response.data.content);
          } else {
            // 过滤搜索结果
            const filtered = response.data.content.filter(dataset =>
              dataset.titleCn.toLowerCase().includes(debouncedDatasetSearchTerm.toLowerCase()) ||
              (dataset.keywords && dataset.keywords.some(keyword => 
                keyword.toLowerCase().includes(debouncedDatasetSearchTerm.toLowerCase())))
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
          dataset.titleCn.toLowerCase().includes(debouncedDatasetSearchTerm.toLowerCase()) ||
          (dataset.keywords && dataset.keywords.some(keyword => 
            keyword.toLowerCase().includes(debouncedDatasetSearchTerm.toLowerCase())))
        );
        setFilteredDatasets(filtered.slice(0, size));
      } catch (error) {
        console.error("搜索已审核通过数据集时出错:", error);
        setFilteredDatasets([]);
      } finally {
        setDatasetSearchLoading(false);
      }
    };

    searchDatasets();
  }, [debouncedDatasetSearchTerm, disabled]);

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
          <DatasetCommand
            selectedDataset={selectedDataset}
            filteredDatasets={filteredDatasets}
            datasetSearchTerm={datasetSearchTerm}
            onDatasetSearchTermChange={setDatasetSearchTerm}
            datasetSearchLoading={datasetSearchLoading}
            onDatasetSelect={handleDatasetSelect}
            disabled={disabled}
            placeholder="搜索已申请通过的数据集..."
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}