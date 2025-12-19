import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {FileText, Download, Shield, AlertTriangle, CheckCircle, ClockIcon, XCircle} from "lucide-react";
import {api} from "@/integrations/api/client.ts";
import {useToast} from "@/hooks/use-toast.ts";
import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import ApplyDialog from "@/components/application/ApplyDialog.tsx";

interface TermsAndFilesTabProps {
    dataset: any;
    useAdvancedQuery?: boolean; // 新增属性，控制是否使用高级查询
}

interface Application {
    id: string;
    datasetId: string;
    datasetTitle: string;
    applicantId: string;
    applicantName: string;
    supervisorId: string | null;
    supervisorName: string | null;
    applicantRole: string;
    applicantType: string;
    projectTitle: string;
    projectDescription: string;
    fundingSource: string;
    purpose: string;
    projectLeader: string;
    approvalDocumentId: string;
    status: string;
    adminNotes: string | null;
    providerNotes: string | null;
    submittedAt: string;
    providerReviewedAt: string | null;
    institutionReviewedAt: string | null;
    approvedAt: string | null;
}

export function TermsAndFilesTab({dataset, useAdvancedQuery = false}: TermsAndFilesTabProps) {
    const {toast} = useToast();
    const navigate = useNavigate();
    const [applicationStatus, setApplicationStatus] = useState<Application | null>(null);
    const [loadingApplication, setLoadingApplication] = useState(true);
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<any>(null); // 新增状态用于跟踪选中的版本

    // 获取最新审核通过的版本
    const getLatestApprovedVersion = (versions: any[]) => {
        if (!versions || versions.length === 0) return null;

        const approvedVersions = versions
            .filter(version => version.approved === true)
            .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());

        return approvedVersions.length > 0 ? approvedVersions[0] : null;
    };

    // 初始化选中的版本
    useEffect(() => {
        if (dataset?.versions && dataset.versions.length > 0) {
            // 默认选择最新审核通过的版本
            const latestApproved = getLatestApprovedVersion(dataset.versions);
            setSelectedVersion(latestApproved || dataset.versions[0]);
        }
    }, [dataset]);

    // 获取当前显示的数据集版本
    const currentVersion = selectedVersion || getLatestApprovedVersion(dataset.versions);

    // 检查用户是否已认证
    const isAuthenticated = api.isAuthenticated();

    // 检查用户对该数据集的申请状态
    useEffect(() => {
        const checkApplicationStatus = async () => {
            if (!isAuthenticated || !dataset.id) {
                setLoadingApplication(false);
                return;
            }

            try {
                const response = await api.get<Application[]>(`/applications/by-dataset/${dataset.id}`);
                if (response.data.success && response.data.data.length > 0) {
                    // 获取最新的审核状态为APPROVED的申请记录
                    const applications = response.data.data;
                    const latestApplication = applications.find(app => app.status === "APPROVED");
                    if (!latestApplication) {
                        setApplicationStatus(null);
                        return;
                    }
                    setApplicationStatus(latestApplication);
                }
            } catch (error) {
                console.error("检查申请状态时出错:", error);
                toast({
                    title: "检查申请状态失败",
                    description: "无法获取您的申请状态，请稍后重试",
                    variant: "destructive",
                });
            } finally {
                setLoadingApplication(false);
            }
        };

        checkApplicationStatus();
    }, [dataset.id, isAuthenticated, toast]);

    // 处理文件下载
    const handleDownload = async (fileType: string) => {
        if (!isAuthenticated) {
            toast({
                title: "需要登录",
                description: "请先登录以下载文件",
                variant: "destructive",
            });
            return;
        }

        // 只有数据分享文件需要检查申请状态
        if (fileType === 'data') {
            const isApproved = applicationStatus?.status === "APPROVED" || useAdvancedQuery;
            if (!isApproved) {
                toast({
                    title: "无下载权限",
                    description: "您需要先申请并获得批准才能下载数据文件",
                    variant: "destructive",
                });
                return;
            }
        }

        try {
            let endpoint = '';
            let filename = '';
            let fileId = '';

            switch (fileType) {
                case 'data':
                    endpoint = `/datasets/${dataset.id}/versions/${currentVersion.id}/data-sharing`;
                    filename = `${dataset.titleCn}_v${currentVersion.versionNumber}_数据文件`;
                    fileId = currentVersion?.dataSharingRecordId;
                    break;
                case 'dictionary':
                    endpoint = `/datasets/${dataset.id}/versions/${currentVersion.id}/data-dictionary`;
                    filename = `${dataset.titleCn}_v${currentVersion.versionNumber}_数据字典`;
                    fileId = currentVersion?.dataDictRecordId;
                    break;
                case 'terms':
                    endpoint = `/datasets/${dataset.id}/versions/${currentVersion.id}/terms-agreement`;
                    filename = `${dataset.titleCn}_v${currentVersion.versionNumber}_使用协议`;
                    fileId = currentVersion?.termsAgreementRecordId;
                    break;
                default:
                    throw new Error('未知文件类型');
            }

            // 先查询文件信息
            if (!fileId) {
                toast({
                    title: "文件不可用",
                    description: "该文件已被删除",
                    variant: "destructive",
                });
                return;
            }
            let fileInfoResponse = null;
            try {
                fileInfoResponse = await api.get(`/files/${fileId}/info`);
                if (!fileInfoResponse.data.success) {
                    throw new Error('获取文件信息失败');
                }

                // 检查文件是否已被删除
                if (fileInfoResponse.data.data.deleted) {
                    toast({
                        title: "文件不可用",
                        description: "该文件已被删除",
                        variant: "destructive",
                    });
                    return;
                }
            } catch (error) {
                console.error('查询文件信息失败:', error);
                toast({
                    title: "文件信息查询失败",
                    description: "无法验证文件状态，请稍后重试",
                    variant: "destructive",
                });
                return;
            }

            const originalFilename = fileInfoResponse.data.data?.fileName;
            // 提取后缀
            const extension = originalFilename.split('.').pop();
            filename = `${filename}.${extension}`;

            // 发起下载请求
            const response = await api.downloadFile(endpoint);

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: "开始下载",
                description: `文件 "${filename}" 已开始下载`
            });

        } catch (error) {
            console.error('下载失败:', error);
            toast({
                title: "下载失败",
                description: "文件下载过程中发生错误，请稍后重试",
                variant: "destructive",
            });
        }
    };

    // 处理版本变更
    const handleVersionChange = (versionId: string) => {
        const version = dataset.versions.find((v: any) => v.id === versionId);
        if (version) {
            setSelectedVersion(version);
        }
    };

    // 用户是否有下载数据文件的权限（申请已批准）
    const hasDataFilePermission = applicationStatus?.status === "APPROVED";

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5"/>
                    数据使用协议与文件下载
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="prose prose-sm max-w-none space-y-2">
                    {/* 版本选择器 - 仅在使用高级查询且存在多个版本时显示 */}
                    {useAdvancedQuery && dataset.versions && dataset.versions.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-900">文件版本选择</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        选择要下载文件的版本
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={currentVersion?.id || ""}
                                        onChange={(e) => handleVersionChange(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {dataset.versions
                                            .slice()
                                            .sort((a: any, b: any) => 
                                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                            )
                                            .map((version: any) => (
                                                <option key={version.id} value={version.id}>
                                                    版本 {version.versionNumber} ({new Date(version.createdAt).toLocaleDateString()})
                                                </option>
                                            ))}
                                    </select>
                                    
                                    {/* 版本状态指示器 */}
                                    {currentVersion && (
                                        <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-md border border-gray-200">
                                            {currentVersion.approved === true ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <span className="text-sm font-medium text-green-700">已审核</span>
                                                </>
                                            ) : currentVersion.approved === false ? (
                                                <>
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                    <span className="text-sm font-medium text-red-700">已拒绝</span>
                                                </>
                                            ) : (
                                                <>
                                                    <ClockIcon className="h-4 w-4 text-yellow-500" />
                                                    <span className="text-sm font-medium text-yellow-700">待审核</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentVersion && (
                        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm font-medium text-blue-800">
                                当前版本: {currentVersion.versionNumber}
                            </p>
                        </div>
                    )}
                    <h4 className="font-semibold mb-2">数据使用条款</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                        <li>数据仅用于学术研究，不得用于商业用途</li>
                        <li>严格保护数据隐私，不得尝试重新识别受试者身份</li>
                        <li>研究成果发表时需注明数据来源</li>
                        <li>不得将数据转让给第三方</li>
                        <li>使用结束后需删除本地数据副本</li>
                        <li>发现数据质量问题应及时反馈给数据提供方</li>
                        <li>遵守相关法律法规和伦理准则</li>
                    </ul>
                </div>

                {!isAuthenticated ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0"/>
                            <div>
                                <h4 className="font-medium text-yellow-800">需要登录才能下载文件</h4>
                                <p className="text-sm text-yellow-700 mt-1">
                                    请先登录您的账户以访问和下载数据文件、数据字典和使用协议。
                                </p>
                                <Button
                                    onClick={() => navigate('/auth')}
                                    className="mt-3"
                                >
                                    前往登录
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : loadingApplication ? (
                    <div className="p-4 text-center text-muted-foreground">
                        正在检查您的申请状态...
                    </div>
                ) : (
                    <div className="space-y-4">
                        <h4 className="font-semibold">可下载文件</h4>

                        {/* 数据文件 - 需要申请权限 */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-primary"/>
                                <div>
                                    <p className="font-semibold">数据文件</p>
                                    <p className="text-sm text-muted-foreground">Dataset file</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => {
                                    if (hasDataFilePermission || useAdvancedQuery) {
                                        handleDownload('data');
                                    } else {
                                        setApplyDialogOpen(true);
                                    }
                                }}
                                disabled={!currentVersion?.id}
                            >
                                <>
                                    {(hasDataFilePermission || useAdvancedQuery) ? (
                                        <Download className="h-4 w-4"/>
                                    ) : (
                                        <FileText className="h-4 w-4"/>
                                    )}
                                    {(hasDataFilePermission || useAdvancedQuery) ? "下载" : "申请数据集"}
                                </>
                            </Button>
                        </div>

                        {/* 数据字典 - 只需登录 */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <FileText className="h-8 w-8 text-blue-500"/>
                                <div>
                                    <p className="font-semibold">数据字典</p>
                                    <p className="text-sm text-muted-foreground">Data Dictionary</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleDownload('dictionary')}
                                disabled={!currentVersion?.id || !currentVersion?.dataDictRecordId}
                            >
                                <Download className="h-4 w-4"/>
                                下载
                            </Button>
                        </div>

                        {/* 使用协议 - 只需登录 */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <Shield className="h-8 w-8 text-green-500"/>
                                <div>
                                    <p className="font-semibold">数据使用协议</p>
                                    <p className="text-sm text-muted-foreground">Data Use Agreement</p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                onClick={() => handleDownload('terms')}
                                disabled={!currentVersion?.id || !currentVersion?.termsAgreementRecordId}
                            >
                                <Download className="h-4 w-4"/>
                                下载
                            </Button>
                        </div>

                        {!currentVersion?.id && (
                            <p className="text-center text-muted-foreground py-4">
                                暂无已审核通过的版本可供下载
                            </p>
                        )}
                    </div>
                )}
                
                <ApplyDialog 
                    open={applyDialogOpen} 
                    onOpenChange={setApplyDialogOpen} 
                    datasetId={dataset.id}
                />
            </CardContent>
        </Card>
    );
}