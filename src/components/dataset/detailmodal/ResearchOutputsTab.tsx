import React, { forwardRef } from 'react';
import { ResearchOutput } from "@/integrations/api/outputApi";
import { datasetApi } from "@/integrations/api/datasetApi";
import PaginatedList from "@/components/ui/PaginatedList";
import {OutputCard} from "@/components/home/OutputCard.tsx";

interface ResearchOutputsTabProps {
    datasetId: string;
}

// 空状态组件
const EmptyState = () => (
    <div className="flex justify-center items-center h-64">
        <p className="text-muted-foreground">暂无关联的研究成果</p>
    </div>
);

// 使用forwardRef创建组件以便PaginatedList可以访问其ref
const ResearchOutputsTab = forwardRef<{ refresh: () => void }, ResearchOutputsTabProps>(({ datasetId }, ref) => {
    // 获取研究成果数据的方法
    const fetchResearchOutputs = async (page: number, size: number) => {
        try {
            const apiResponse = await datasetApi.getApprovedResearchOutputs(datasetId, page, size);
            return apiResponse.data;
        } catch (err) {
            console.error('Error fetching research outputs:', err);
            throw new Error('获取研究成果时发生错误');
        }
    };

    if (!datasetId) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">研究成果</h3>
                <EmptyState />
            </div>
        );
    }

    return (
        <div className="space-y-4 p-2">
            <PaginatedList
                ref={ref}
                fetchData={fetchResearchOutputs}
                renderItem={(output:ResearchOutput) => <OutputCard output={output} />}
                renderEmptyState={() => <EmptyState />}
                pageSize={6}
                gridLayout={true}
                gap={16}
            />
        </div>
    );
});

ResearchOutputsTab.displayName = 'ResearchOutputsTab';

export { ResearchOutputsTab };