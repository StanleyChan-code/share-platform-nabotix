import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {FileText, Plus} from "lucide-react";
import {useState, useCallback, useRef} from "react";
import {useToast} from "@/hooks/use-toast";
import {Button} from "@/components/ui/button";
import SubmitOutputDialog from "@/components/outputs/SubmitOutputDialog";
import OutputDetailDialog from "@/components/outputs/OutputDetailDialog";
import EditOutputDialog from "@/components/outputs/EditOutputDialog";
import ReactPaginatedList from "@/components/ui/ReactPaginatedList";
import {TooltipProvider} from "@/components/ui/tooltip";
import {getOutputTypeIconComponent} from "@/lib/outputUtils";
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import OutputItem from "@/components/profile/OutputItem.tsx";

const OutputsTab = () => {
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
    const {toast} = useToast();
    const paginatedListRef = useRef<any>(null);


    const fetchUserOutputs = useCallback(async (page: number, size: number) => {
        return await outputApi.getMySubmissions({
            page,
            size
        });
    }, []);

    const handleEditClick = (output: ResearchOutput, e: React.MouseEvent) => {
        e.stopPropagation();
        // 只有待审核状态的成果才能编辑
        if (output.approved === null) {
            setSelectedOutput(output);
            setEditDialogOpen(true);
        } else {
            toast({
                title: "无法编辑",
                description: "只有待审核状态的成果才能编辑",
                variant: "destructive"
            });
        }
    };

    const handleOutputClick = (output: ResearchOutput) => {
        setSelectedOutput(output);
        setDetailDialogOpen(true);
    };

    const handleAddOutput = () => {
        setSubmitDialogOpen(true);
    };

    const handleOutputSubmitted = () => {
        // 成果提交后刷新列表
        toast({
            title: "提交成功",
            description: "研究成果已成功提交，等待审核",
        });

        // 刷新列表
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    const handleOutputEdited = () => {
        // 成果编辑后刷新列表
        toast({
            title: "更新成功",
            description: "研究成果已成功更新",
        });

        // 刷新列表
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    // 删除处理函数现在用于刷新列表
    const handleDeleteOutput = (_output: ResearchOutput, _e: React.MouseEvent) => {
        // 删除完成后刷新列表
        if (paginatedListRef.current) {
            paginatedListRef.current.refresh();
        }
    };

    const renderEmptyState = () => (
        <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">暂无研究成果</p>
            <p className="text-sm mb-6">您还没有提交任何研究成果</p>
            <Button onClick={handleAddOutput}>
                <Plus className="mr-2 h-4 w-4"/>
                提交新成果
            </Button>
        </div>
    );

    return (
        <TooltipProvider>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5"/>
                        我的研究成果
                    </CardTitle>
                    <Button onClick={handleAddOutput}>
                        <Plus className="mr-2 h-4 w-4"/>
                        提交新成果
                    </Button>
                </CardHeader>
                <CardContent>
                    <ReactPaginatedList
                        ref={paginatedListRef}
                        fetchData={fetchUserOutputs}
                        renderItem={(output) => (
                            <OutputItem
                                key={output.id}
                                output={output}
                                onEdit={handleEditClick}
                                onDelete={handleDeleteOutput}
                                onDetail={handleOutputClick}
                            />
                        )}
                        renderEmptyState={renderEmptyState}
                        pageSize={10}
                    />
                </CardContent>

                <SubmitOutputDialog
                    open={submitDialogOpen}
                    onOpenChange={setSubmitDialogOpen}
                    onSubmit={handleOutputSubmitted}
                />

                <OutputDetailDialog
                    open={detailDialogOpen}
                    onOpenChange={setDetailDialogOpen}
                    output={selectedOutput}
                    managementMode={false}
                />

                <EditOutputDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    output={selectedOutput}
                    onEdit={handleOutputEdited}
                />
            </Card>
        </TooltipProvider>
    );
};

export default OutputsTab;
