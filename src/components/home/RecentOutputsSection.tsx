import { OutputCard } from "./OutputCard";

interface RecentOutputsSectionProps {
  outputs: any[];
  loading: boolean;
}

export const RecentOutputsSection = ({ outputs, loading }: RecentOutputsSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">最新研究成果</h2>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            加载中...
          </div>
        ) : outputs.length > 0 ? (
          outputs.map((output: any) => <OutputCard key={output.id} output={output} />)
        ) : (
          <div className="col-span-2 text-center py-8 text-muted-foreground">
            暂无研究成果
          </div>
        )}
      </div>
    </div>
  );
};