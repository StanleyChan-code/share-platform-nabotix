import React, {useState, useEffect, useRef} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {AlertCircle, Upload, AlertTriangle} from "lucide-react";
import {toast} from "sonner";
import {createApplication, CreateApplicationRequest} from "@/integrations/api/applicationApi";
import {Dataset} from "@/integrations/api/datasetApi";
import {DatasetSelector} from "@/components/dataset/DatasetSelector.tsx";
import {DatasetTypes} from "@/lib/enums";
import {formatDate} from "@/lib/utils";
import FileUploader from "@/components/upload/FileUploader";
import {FileInfo} from "@/integrations/api/fileApi";
import {ScrollArea} from "@radix-ui/react-scroll-area";
import {supabase} from "@/integrations/supabase/client";

interface ApplyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    datasetId?: string;
}

const ApplyDialog = ({open, onOpenChange, datasetId}: ApplyDialogProps) => {
    const [formData, setFormData] = useState({
        datasetId: datasetId || "",
        projectTitle: "",
        projectDescription: "",
        fundingSource: "",
        purpose: "",
        projectLeader: "",
        applicantRole: "",
        applicantType: "",
        agreeToTerms: false,
    });

    const [submitting, setSubmitting] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
    const [uploadedFile, setUploadedFile] = useState<FileInfo | null>(null);
    const [userInstitutionId, setUserInstitutionId] = useState<string | null>(null);
    const [institutionCheckDone, setInstitutionCheckDone] = useState(false);
    const fileUploaderRef = useRef<any>(null);

    // 获取当前用户所属机构
    useEffect(() => {
        const fetchUserInstitution = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data, error } = await supabase
                        .from('users')
                        .select('institution_id')
                        .eq('id', user.id)
                        .single();
                    
                    if (error) {
                        console.error('获取用户机构信息失败:', error);
                    } else {
                        setUserInstitutionId(data?.institution_id || null);
                    }
                }
            } catch (error) {
                console.error('获取用户信息失败:', error);
            } finally {
                setInstitutionCheckDone(true);
            }
        };

        fetchUserInstitution();
    }, []);

    const handleDatasetSelect = (dataset: Dataset) => {
        setSelectedDataset(dataset);
        setFormData(prev => ({...prev, datasetId: dataset.id}));
    };

    const isDatasetAvailableToUser = () => {
        if (!selectedDataset || !institutionCheckDone) return false;
        
        // 如果数据集没有设置申请机构限制，则所有人都可以申请
        if (!selectedDataset.applicationInstitutionIds) return true;
        
        // 如果用户不属于任何机构，则无法申请有限制的数据集
        if (!userInstitutionId) return false;
        
        // 检查用户所属机构是否在数据集允许申请的机构列表中
        return selectedDataset.applicationInstitutionIds.includes(userInstitutionId);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.agreeToTerms) {
            toast.error("请同意数据使用协议");
            return;
        }

        if (!uploadedFile) {
            toast.error("请上传审批表签字扫描文档");
            return;
        }

        if (!formData.datasetId) {
            toast.error("请选择要申请的数据集");
            return;
        }

        if (institutionCheckDone && !isDatasetAvailableToUser()) {
            toast.error("该数据集暂未对用户所属机构开放申请");
            return;
        }

        setSubmitting(true);

        try {
            // 准备申请数据
            const requestData: CreateApplicationRequest = {
                datasetId: formData.datasetId,
                applicantRole: formData.applicantRole,
                applicantType: formData.applicantType,
                projectTitle: formData.projectTitle,
                projectDescription: formData.projectDescription,
                fundingSource: formData.fundingSource,
                purpose: formData.purpose,
                projectLeader: formData.projectLeader,
                approvalDocumentId: uploadedFile.id
            };

            // 提交申请
            await createApplication(requestData);

            toast.success("申请提交成功");

            // 重置表单
            setFormData({
                datasetId: datasetId || "",
                projectTitle: "",
                projectDescription: "",
                fundingSource: "",
                purpose: "",
                projectLeader: "",
                applicantRole: "",
                applicantType: "",
                agreeToTerms: false
            });
            setUploadedFile(null);
            setSelectedDataset(null);

            // 重置文件上传组件
            if (fileUploaderRef.current && fileUploaderRef.current.handleReset) {
                fileUploaderRef.current.handleReset(true);
            }

            // 关闭对话框
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error submitting application:", error);
            toast.error("提交失败: " + (error.response?.data?.message || error.message || "未知错误"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (!isOpen) {
                // Reset form when closing
                setFormData({
                    datasetId: datasetId || "",
                    projectTitle: "",
                    projectDescription: "",
                    fundingSource: "",
                    purpose: "",
                    projectLeader: "",
                    applicantRole: "",
                    applicantType: "",
                    agreeToTerms: false
                });
                setUploadedFile(null);
                setSelectedDataset(null);

                // 重置文件上传组件
                if (fileUploaderRef.current && fileUploaderRef.current.handleReset) {
                    fileUploaderRef.current.handleReset(true);
                }
            }
        }}>
            <DialogContent
                className="sm:max-w-[425px] md:max-w-[500px] lg:max-w-[700px] max-h-[85vh] min-h-[20vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>数据集申请</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                    请填写以下信息，并提交您的申请。
                </DialogDescription>

                <div className="flex-1 overflow-hidden overflow-y-auto">
                    <ScrollArea className="h-full w-full pr-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Dataset Selection */}
                            <DatasetSelector
                                selectedDataset={selectedDataset}
                                onDatasetSelect={handleDatasetSelect}
                                datasetId={datasetId}
                                disabled={datasetId != null && datasetId !== ""}
                                label="选择数据集"
                                required
                            />

                            {/* 只有选择了数据集才显示后续内容 */}
                            {formData.datasetId && selectedDataset && (
                                <>
                                    {/* 显示选中的数据集信息 */}
                                    <div className="border rounded-lg p-4 bg-muted/50">
                                        <h3 className="font-semibold mb-2">数据集信息</h3>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">标题:</span>
                                                <span className="truncate whitespace-normal break-words"
                                                      title={selectedDataset.titleCn}>{selectedDataset.titleCn}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">类型:</span>
                                                <span className="truncate"
                                                      title={DatasetTypes[selectedDataset.type as keyof typeof DatasetTypes] || selectedDataset.type}>
                                                  {DatasetTypes[selectedDataset.type as keyof typeof DatasetTypes] || selectedDataset.type}
                                                </span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">研究学科:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.subjectArea?.name || '无'}>{selectedDataset.subjectArea?.name || '无'}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">发布时间:</span>
                                                <span
                                                    className="truncate">{formatDate(selectedDataset.firstPublishedDate)}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">提供者:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.datasetLeader}>{selectedDataset.datasetLeader}</span>
                                            </div>
                                            <div className="flex">
                                                <span className="font-medium w-24 flex-shrink-0">采集单位:</span>
                                                <span className="truncate"
                                                      title={selectedDataset.dataCollectionUnit}>{selectedDataset.dataCollectionUnit}</span>
                                            </div>
                                        </div>
                                        
                                        {/* 机构限制提示 */}
                                        {institutionCheckDone && !isDatasetAvailableToUser() && (
                                            <Alert variant="destructive" className="mt-3">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>
                                                    该数据集暂未对用户所属机构开放申请
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>

                                    {isDatasetAvailableToUser() && institutionCheckDone && (
                                        <>
                                            {/* Applicant Role Selection */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="applicantRole">申请者角色类型 *</Label>
                                                    <Select
                                                        value={formData.applicantRole}
                                                        onValueChange={(value) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                applicantRole: value,
                                                                applicantType: ""
                                                            }));
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="请选择申请者角色"/>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="TEAM_RESEARCHER">团队研究者</SelectItem>
                                                            <SelectItem
                                                                value="COLLABORATIVE_RESEARCHER">合作团队研究者</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {formData.applicantRole === "TEAM_RESEARCHER" && (
                                                    <div className="space-y-2">
                                                        <Label htmlFor="applicantType">研究者类型 *</Label>
                                                        <Select
                                                            value={formData.applicantType}
                                                            onValueChange={(value) => setFormData(prev => ({
                                                                ...prev,
                                                                applicantType: value
                                                            }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="请选择类型"/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="employee">在职工作人员</SelectItem>
                                                                <SelectItem value="student">学生</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Project Information */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="projectTitle">项目标题 *</Label>
                                                    <Input
                                                        id="projectTitle"
                                                        value={formData.projectTitle}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            projectTitle: e.target.value
                                                        }))}
                                                        placeholder="请输入研究项目标题"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="projectDescription">项目描述 *</Label>
                                                    <Textarea
                                                        id="projectDescription"
                                                        rows={4}
                                                        value={formData.projectDescription}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            projectDescription: e.target.value
                                                        }))}
                                                        placeholder="详细描述研究背景、目标、方法和预期成果"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="purpose">数据使用目的 *</Label>
                                                    <Textarea
                                                        id="purpose"
                                                        rows={3}
                                                        value={formData.purpose}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            purpose: e.target.value
                                                        }))}
                                                        placeholder="说明申请数据的具体用途和分析计划"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="fundingSource">资助来源</Label>
                                                    <Input
                                                        id="fundingSource"
                                                        value={formData.fundingSource}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            fundingSource: e.target.value
                                                        }))}
                                                        placeholder="国家自然科学基金、省部级基金等（可选）"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="projectLeader">项目负责人 *</Label>
                                                    <Input
                                                        id="projectLeader"
                                                        value={formData.projectLeader}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            projectLeader: e.target.value
                                                        }))}
                                                        placeholder="请输入项目负责人的姓名"
                                                    />
                                                </div>
                                            </div>

                                            {/* Approval Document Upload */}
                                            <div className="space-y-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                                    <Upload className="h-5 w-5"/>
                                                    审批表上传
                                                </h3>

                                                <div className="space-y-2">
                                                    <Label htmlFor="approvalDocument">审批表签字扫描文档 *</Label>
                                                    <FileUploader
                                                        ref={fileUploaderRef}
                                                        onResetComplete={() => {
                                                            setUploadedFile(null);
                                                        }}
                                                        onUploadComplete={(fileInfo) => {
                                                            setUploadedFile(fileInfo);
                                                        }}
                                                        maxSize={10 * 1024 * 1024} // 10MB限制
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        请上传盖章签字的审批表扫描件（支持PDF、JPG、PNG格式，最大10MB）
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Agreement */}
                                            <Alert variant="destructive" className="border-amber-200 bg-amber-50">
                                                <AlertCircle className="h-4 w-4 text-amber-800"/>
                                                <AlertDescription className="text-amber-800 space-y-2">
                                                    <h4 className="font-semibold">数据使用协议</h4>
                                                    <p>申请数据前，请仔细阅读以下条款：</p>
                                                    <ul className="list-disc list-inside space-y-1 ml-4">
                                                        <li>数据仅用于学术研究，不得用于商业用途</li>
                                                        <li>严格保护数据隐私，不得尝试重新识别患者身份</li>
                                                        <li>研究成果发表时需注明数据来源</li>
                                                        <li>不得将数据转让给第三方</li>
                                                        <li>使用结束后需删除本地数据副本</li>
                                                    </ul>

                                                    <div className="flex items-center space-x-2 mt-4">
                                                        <Checkbox
                                                            id="agree"
                                                            checked={formData.agreeToTerms}
                                                            onCheckedChange={(checked) => setFormData(prev => ({
                                                                ...prev,
                                                                agreeToTerms: checked as boolean
                                                            }))}
                                                        />
                                                        <Label htmlFor="agree" className="text-sm text-amber-800">
                                                            我已阅读并同意遵守数据使用协议 *
                                                        </Label>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>

                                        </>
                                    )}
                                </>
                            )}

                            <div className="flex justify-end space-x-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                    取消
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!formData.agreeToTerms || !uploadedFile || submitting || !formData.datasetId || !isDatasetAvailableToUser() || !institutionCheckDone}
                                >
                                    {submitting ? "提交中..." : "提交申请"}
                                </Button>
                            </div>
                        </form>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplyDialog;