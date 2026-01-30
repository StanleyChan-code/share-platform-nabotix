import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Dataset, datasetApi } from "@/integrations/api/datasetApi.ts";
import { DatasetCommand } from "@/components/dataset/DatasetCommand.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import {Asterisk, Check, ChevronsUpDown, Loader2} from "lucide-react";
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
  };

  return (
    <div className="space-y-2">

      <div className="flex items-center gap-1">
        <Label htmlFor="dataset">
          {label}
        </Label>
        {required && <Asterisk className="h-3 w-3 text-red-500" />}
      </div>
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
              {selectedDataset ? (selectedDataset.titleCn?.length > 30 ? `${selectedDataset.titleCn.substring(0, 30)}...` : selectedDataset.titleCn) : "未选择数据集"}
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
            placeholder="搜索数据集标题或关键词..."
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}