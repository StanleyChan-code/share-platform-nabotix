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
import {outputApi, ResearchOutput} from "@/integrations/api/outputApi";
import OutputItem from "@/components/profile/OutputItem.tsx";
import { QADialog, QAItem, QATip } from '@/components/ui/QADialog';

const OutputsTab = () => {
    const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedOutput, setSelectedOutput] = useState<ResearchOutput | null>(null);
    const {toast} = useToast();
    const paginatedListRef = useRef<any>(null);
    const [isQADialogOpen, setIsQADialogOpen] = useState(false);


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
                    <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5"/>
                            我的研究成果
                        </CardTitle>
                        <QADialog
                            isOpen={isQADialogOpen}
                            onOpenChange={setIsQADialogOpen}
                            title="研究成果流程说明"
                            content={
                                <div className="space-y-6">
                                    {/* 步骤1：提交研究成果 */}
                                    <QAItem
                                        number={1}
                                        title="提交研究成果"
                                        description='点击"提交新成果"按钮，填写研究成果基本信息，选择相关数据集，并上传研究成果文件（如论文PDF、专利证书扫描件等）。'
                                    />

                                    {/* 步骤2：等待审核 */}
                                    <QAItem
                                        number={2}
                                        title="等待审核"
                                        description="提交后，您的研究成果将进入审核流程。审核人员将对研究成果的真实性、学术价值和与数据集的关联性进行评估。"
                                    />
                                    
                                    <QATip
                                        type="info"
                                        title="提示"
                                        content="审核人员是指平台管理员，您可以点击研究成果记录旁的用户按钮来查看相关人员信息。"
                                    />

                                    {/* 步骤3：审核结果 */}
                                    <QAItem
                                        number={3}
                                        title="审核结果"
                                        description="审核完成后，您将收到通知。审核通过的研究成果将在平台上公开展示；审核不通过的研究成果将显示拒绝原因，您可以根据反馈进行修改后重新提交。"
                                    />
                                    
                                    <QATip
                                        type="warning"
                                        title="注意"
                                        content="研究成果只能在待审核阶段修改，审核后无论通过还是拒绝都不能修改。"
                                    />

                                    {/* 步骤4：研究成果管理 */}
                                    <QAItem
                                        number={4}
                                        title="研究成果管理"
                                        description='您可以在"我的研究成果"页面查看所有提交的研究成果状态，点击研究成果标题查看详细信息。对于已审核通过的研究成果，您可以查看其在平台上的展示情况。'
                                    />
                                </div>
                            }
                        />
                    </div>
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
                    managementMode={true}
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