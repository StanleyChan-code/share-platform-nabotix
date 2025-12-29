import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label.tsx";
import { Loader2 } from 'lucide-react';
import { DatasetSelector } from '@/components/dataset/DatasetSelector.tsx';
import { Dataset, datasetApi } from '@/integrations/api/datasetApi.ts';
import { getCurrentUserFromSession } from '@/lib/authUtils.ts';

interface BaselineDatasetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BaselineDatasetSelector({ value, onChange }: BaselineDatasetSelectorProps) {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  return (
    <div className="space-y-2">
      <DatasetSelector
        selectedDataset={selectedDataset}
        onDatasetSelect={(dataset) => {
          setSelectedDataset(dataset);
          onChange(dataset.id);
        }}
        label="选择对应的基线数据集"
        required={true}
        datasetId={value}
        isTopLevel={true}
        providerId={getCurrentUserFromSession()?.id}
        size={10}
      />
      <p className="text-xs text-muted-foreground">
        请选择您上传的已审核基线数据集
      </p>
    </div>
  );
}