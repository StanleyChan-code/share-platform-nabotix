import { OutputCard } from "./OutputCard";

interface RecentOutputsSectionProps {
    outputs: any[];
    loading: boolean;
}

export const RecentOutputsSection = ({ outputs, loading }: RecentOutputsSectionProps) => {
    return (
        <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-semibold">最新研究成果</h2>
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