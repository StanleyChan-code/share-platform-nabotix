import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { File, Loader2, Asterisk, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { toast } from 'sonner';
import { datasetApi, AddDatasetVersionRequest } from '@/integrations/api/datasetApi.ts';
import { FileInfo } from '@/integrations/api/fileApi.ts';
import FileUploader from '../../fileuploader/FileUploader.tsx';
import { FileUploaderHandles } from "@/components/fileuploader/types.ts";
import { FormValidator, Input, Textarea } from '@/components/ui/FormValidator.tsx';
import { formatFileSize } from '@/lib/utils.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";

interface AddDatasetVersionFormProps {
  datasetId: string;
  onSuccess?: () => void;
}

export function AddDatasetVersionForm({ datasetId, onSuccess }: AddDatasetVersionFormProps) {
  const [uploading, setUploading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [formData, setFormData] = useState({
    versionNumber: '',
    versionDescription: '',
  });

  // 文件上传引用
  const dataFileRef = useRef<FileUploaderHandles>(null);
  const dictFileRef = useRef<FileUploaderHandles>(null);
  const termsFileRef = useRef<FileUploaderHandles>(null);
  const sharingFileRef = useRef<FileUploaderHandles>(null);

  // 上传的文件信息
  const [dataFileInfo, setDataFileInfo] = useState<FileInfo | null>(null);
  const [dictFileInfo, setDictFileInfo] = useState<FileInfo | null>(null);
  const [termsFileInfo, setTermsFileInfo] = useState<FileInfo | null>(null);
  const [sharingFileInfo, setSharingFileInfo] = useState<FileInfo | null>(null);

  // 检查表单是否有内容
  const hasFormData = () => {
    return (
        formData.versionNumber.trim() !== '' ||
        formData.versionDescription.trim() !== '' ||
        dataFileInfo !== null ||
        dictFileInfo !== null ||
        termsFileInfo !== null ||
        sharingFileInfo !== null
    );
  };

  // 文件上传完成回调
  const handleDataFileUpload = (fileInfo: FileInfo) => {
    setDataFileInfo(fileInfo);
  };

  const handleDictFileUpload = (fileInfo: FileInfo) => {
    setDictFileInfo(fileInfo);
  };

  const handleTermsFileUpload = (fileInfo: FileInfo) => {
    setTermsFileInfo(fileInfo);
  };

  const handleSharingFileUpload = (fileInfo: FileInfo) => {
    setSharingFileInfo(fileInfo);
  };

  // 文件重置回调
  const handleDataFileReset = () => {
    setDataFileInfo(null);
  };

  const handleDictFileReset = () => {
    setDictFileInfo(null);
  };

  const handleTermsFileReset = () => {
    setTermsFileInfo(null);
  };

  const handleSharingFileReset = () => {
    setSharingFileInfo(null);
  };

  // 验证函数
  const validateVersionNumber = (value: string) => {
    if (!value.trim()) return "版本号不能为空";
    if (value.trim().length < 1) return "版本号不能为空";
    if (value.trim().length > 50) return "版本号不能超过50个字符";
    if (!/^[0-9]+\.[0-9]+(\.[0-9]+)*$/.test(value.trim())) {
      return "版本号格式不正确，如：1.0、2.1.3";
    }
    return true;
  };

  const validateVersionDescription = (value: string) => {
    if (!value.trim()) return "版本描述不能为空";
    if (value.trim().length < 10) return "版本描述至少需要10个字符";
    if (value.trim().length > 500) return "版本描述不能超过500个字符";
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // 检查必要文件是否已上传
    if (!dataFileInfo) {
      toast.error('请上传数据文件');
      return;
    }

    if (!dictFileInfo) {
      toast.error('请上传数据字典文件');
      return;
    }

    if (!termsFileInfo) {
      toast.error('请上传数据使用协议');
      return;
    }

    if (!sharingFileInfo) {
      toast.error('请上传数据分享文件');
      return;
    }

    setUploading(true);

    try {
      // 添加数据集新版本
      const versionData: AddDatasetVersionRequest = {
        versionNumber: formData.versionNumber.trim(),
        description: formData.versionDescription.trim(),
        fileRecordId: dataFileInfo.id,
        dataDictRecordId: dictFileInfo.id,
        termsAgreementRecordId: termsFileInfo.id,
        dataSharingRecordId: sharingFileInfo.id,
        recordCount: 0,
        variableCount: 0
      };

      const response = await datasetApi.addDatasetVersion(datasetId, versionData);

      if (response.success) {
        toast.success('数据集新版本添加成功');

        // 重置表单
        resetForm();
        onSuccess?.();
      } else {
        throw new Error(response.message || '添加数据集新版本失败');
      }
    } catch (error: any) {
      console.error('添加数据集新版本失败:', error);
      toast.error('添加数据集新版本失败: ' + (error.response?.data?.message || error.message || '未知错误'));
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      versionNumber: '',
      versionDescription: '',
    });

    // 重置文件上传
    dataFileRef.current?.acceptedAndReset();
    dictFileRef.current?.acceptedAndReset();
    termsFileRef.current?.acceptedAndReset();
    sharingFileRef.current?.acceptedAndReset();

    setDataFileInfo(null);
    setDictFileInfo(null);
    setTermsFileInfo(null);
    setSharingFileInfo(null);

    // 关闭确认对话框
    setShowResetConfirm(false);
  };

  const handleResetClick = () => {
    if (hasFormData()) {
      // 如果有表单数据，显示确认对话框
      setShowResetConfirm(true);
    } else {
      // 如果没有数据，直接重置
      resetForm();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
      <>
        <div className="space-y-6">
          <FormValidator onSubmit={handleSubmit} className="space-y-6">
            {/* 版本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <File className="h-5 w-5" />
                版本信息
              </h3>

              <div className="space-y-2">
                <Label htmlFor="versionNumber" className="flex items-center gap-1">
                  版本号 <Asterisk className="h-3 w-3 text-red-500" />
                </Label>
                <p className="text-xs text-muted-foreground">数据集的版本标识，如2.0、2.1等</p>
                <Input
                    id="versionNumber"
                    name="versionNumber"
                    value={formData.versionNumber}
                    onChange={handleInputChange}
                    placeholder="如：2.0"
                    maxLength={50}
                    required
                    validationType="custom"
                    customValidation={validateVersionNumber}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="versionDescription" className="flex items-center gap-1">
                  版本描述 <Asterisk className="h-3 w-3 text-red-500" />
                </Label>
                <p className="text-xs text-muted-foreground">简要描述此版本的主要更新内容</p>
                <Textarea
                    id="versionDescription"
                    name="versionDescription"
                    rows={3}
                    value={formData.versionDescription}
                    onChange={handleInputChange}
                    placeholder="描述此版本的主要变更内容"
                    maxLength={500}
                    required
                    validationType="custom"
                    customValidation={validateVersionDescription}
                />
              </div>
            </div>

            {/* 文件上传 */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <File className="h-5 w-5" />
                文件上传
              </h3>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      完整数据集文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      支持 CSV、Excel 格式，最大 10GB。包含完整的数据集内容。
                    </p>
                    <FileUploader
                        ref={dataFileRef}
                        onUploadComplete={handleDataFileUpload}
                        onResetComplete={handleDataFileReset}
                        maxSize={10 * 1024 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                        templateFile="dataset.xlsx"
                        templateLabel="数据集模板"
                        required
                    />
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <Label className="flex items-center gap-1">
                      数据分享文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      支持 CSV、Excel 格式，最大 500MB。用户申请后可下载的文件。
                    </p>
                    <FileUploader
                        ref={sharingFileRef}
                        onUploadComplete={handleSharingFileUpload}
                        onResetComplete={handleSharingFileReset}
                        maxSize={500 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                        required
                    />
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      数据字典文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      支持 CSV、Excel 格式，最大 100MB。描述数据字段含义和结构的文件。
                    </p>
                    <FileUploader
                        ref={dictFileRef}
                        onUploadComplete={handleDictFileUpload}
                        onResetComplete={handleDictFileReset}
                        maxSize={100 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                        templateFile="data_dictionary.xlsx"
                        templateLabel="数据字典模板"
                        required
                    />
                  </div>

                  <div className="space-y-2 border-t pt-4">
                    <Label className="flex items-center gap-1">
                      数据使用协议 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      支持 PDF 格式，最大 20MB。数据使用的条款和协议文档。
                    </p>
                    <FileUploader
                        ref={termsFileRef}
                        onUploadComplete={handleTermsFileUpload}
                        onResetComplete={handleTermsFileReset}
                        maxSize={20 * 1024 * 1024}
                        acceptedFileTypes={['.pdf']}
                        templateFile="data_usage_license.docx"
                        templateLabel="数据使用协议模板"
                        required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <Button
                  type="button"
                  variant="outline"
                  onClick={handleResetClick}
                  disabled={uploading}
              >
                重置
              </Button>
              <Button
                  type="submit"
                  disabled={uploading}
                  className="min-w-32"
              >
                {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                ) : (
                    '提交新版本'
                )}
              </Button>
            </div>
          </FormValidator>
        </div>

        {/* 重置确认对话框 */}
        <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认重置内容</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将清除所有已填写的内容和已上传的文件，且无法恢复。您确定要重置吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                  onClick={resetForm}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                确认重置
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  );
}