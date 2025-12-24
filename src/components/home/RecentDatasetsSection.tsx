import {DatasetCard} from "./DatasetCard";
import {Dataset} from "@/integrations/api/datasetApi";

interface RecentDatasetsSectionProps {
    datasets: Dataset[];
    loading: boolean;
}

export const RecentDatasetsSection = ({datasets, loading}: RecentDatasetsSectionProps) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">最新数据集</h2>
            <div className="grid gap-3 md:gap-4">
                {loading ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                        加载中...
                    </div>
                ) : datasets.length > 0 ? (
                    datasets.map(dataset => <DatasetCard key={dataset.id} dataset={dataset}/>)
                ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                        暂无数据集
                    </div>
                )}
            </div>
        </div>
    );
};