import {DatasetCard} from "./DatasetCard";
import {Dataset} from "@/integrations/api/datasetApi";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {ChevronRight} from "lucide-react";

interface RecentDatasetsSectionProps {
    datasets: Dataset[];
    loading: boolean;
}

export const RecentDatasetsSection = ({datasets, loading}: RecentDatasetsSectionProps) => {
    const navigate = useNavigate();
    
    const handleViewMore = () => {
        navigate('/datasets');
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-semibold">最新数据集</h2>
                <Button
                    variant="link"
                    size="sm"
                    className="text-primary hover:text-primary/50 hover:no-underline"
                    onClick={handleViewMore}
                >
                    查看更多 <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
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