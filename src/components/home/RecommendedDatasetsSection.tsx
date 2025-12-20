import { DatasetCard } from "./DatasetCard";
import { Dataset } from "@/integrations/api/datasetApi";

interface RecommendedDatasetsSectionProps {
  datasets: Dataset[];
  loading: boolean;
  recommendationReason: string;
}

export const RecommendedDatasetsSection = ({ 
  datasets, 
  loading, 
  recommendationReason 
}: RecommendedDatasetsSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">推荐数据集</h2>
        <span className="text-sm text-muted-foreground">
          {recommendationReason}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-3 text-center py-8 text-muted-foreground">
            加载推荐数据集中...
          </div>
        ) : (
          datasets.map(dataset => <DatasetCard key={dataset.id} dataset={dataset} showRecommendationBadge={true} />)
        )}
      </div>
    </div>
  );
};