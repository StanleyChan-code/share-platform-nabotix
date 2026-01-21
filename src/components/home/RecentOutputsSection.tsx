import { OutputCard } from "./OutputCard";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {ChevronRight} from "lucide-react";

interface RecentOutputsSectionProps {
    outputs: any[];
    loading: boolean;
}

export const RecentOutputsSection = ({ outputs, loading }: RecentOutputsSectionProps) => {
    const navigate = useNavigate();
    
    const handleViewMore = () => {
        navigate('/outputs');
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-semibold">最新研究成果</h2>
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
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                        加载中...
                    </div>
                ) : outputs.length > 0 ? (
                    outputs.map((output: any) => <OutputCard key={output.id} output={output} />)
                ) : (
                    <div className="text-center py-6 md:py-8 text-muted-foreground">
                        暂无研究成果
                    </div>
                )}
            </div>
        </div>
    );
};