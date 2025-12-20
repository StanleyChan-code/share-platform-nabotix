import React, { forwardRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ResearchOutput } from "@/integrations/api/outputApi";
import {getOutputTypeDisplayName} from "@/lib/outputUtils.ts";
import { datasetApi } from "@/integrations/api/datasetApi";
import PaginatedList from "@/components/ui/PaginatedList";
import {OutputCard} from "@/components/home/OutputCard.tsx";

interface ResearchOutputsTabProps {
    datasetId: string;
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// 单个研究成果卡片组件
const ResearchOutputCard = ({ output }: { output: ResearchOutput }) => (
    <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <CardTitle className="text-lg line-clamp-2">
                    {output.title}
                </CardTitle>
                <Badge variant="secondary" className="ml-2 whitespace-nowrap">
                    {getOutputTypeDisplayName(output.type)}
                </Badge>
            </div>
            {output.outputNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                    编号: {output.outputNumber}
                </p>
            )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
            <div className="flex-1">
                {output.abstractText && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {output.abstractText}
                    </p>
                )}

                <div className="flex items-center text-xs text-muted-foreground mb-3">
                    <span>{output.submitter.realName}</span>
                    {output.approvedAt && (
                        <span className="mx-2">•</span>
                    )}
                    {output.approvedAt && (
                        <span>{formatDate(output.approvedAt)}</span>
                    )}
                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                    {output.publicationUrl && (
                        <Button variant="outline" size="sm" asChild>
                            <a href={output.publicationUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>
        </CardContent>
    </Card>
);

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