import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { File, Loader2, Asterisk, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { datasetApi, AddDatasetVersionRequest } from '@/integrations/api/datasetApi';
import { FileInfo } from '@/integrations/api/fileApi';
import FileUploader, { FileUploaderHandles } from '../fileuploader/FileUploader.tsx';
import { FormValidator, InputWrapper } from '@/components/ui/FormValidator';
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
} from "@/components/ui/alert-dialog";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查必要字段是否已填写
    if (!formData.versionNumber.trim()) {
      toast.error('请填写版本号');
      return;
    }

    if (!formData.versionDescription.trim()) {
      toast.error('请填写版本描述');
      return;
    }

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
    dataFileRef.current?.handleReset(false);
    dictFileRef.current?.handleReset(false);
    termsFileRef.current?.handleReset(false);
    sharingFileRef.current?.handleReset(false);

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
          <FormValidator onSubmit={handleSubmit} className="space-y-6" showAllErrorsOnSubmit={true}>
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
                <InputWrapper required validationType="custom">
                  <Input
                      id="versionNumber"
                      name="versionNumber"
                      value={formData.versionNumber}
                      onChange={handleInputChange}
                      placeholder="如：2.0"
                      maxLength={50}
                  />
                </InputWrapper>
                <p className="text-xs text-muted-foreground">数据集的版本标识，如2.0、2.1等</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="versionDescription" className="flex items-center gap-1">
                  版本描述 <Asterisk className="h-3 w-3 text-red-500" />
                </Label>
                <InputWrapper required>
                  <Textarea
                      id="versionDescription"
                      name="versionDescription"
                      rows={3}
                      value={formData.versionDescription}
                      onChange={handleInputChange}
                      placeholder="描述此版本的主要变更内容"
                      maxLength={500}
                  />
                </InputWrapper>
                <p className="text-xs text-muted-foreground">简要描述此版本的主要更新内容</p>
              </div>
            </div>

            {/* 文件上传 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <File className="h-5 w-5" />
                文件上传
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      完整数据集文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <FileUploader
                        ref={dataFileRef}
                        onUploadComplete={handleDataFileUpload}
                        onResetComplete={handleDataFileReset}
                        maxSize={10 * 1024 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                    />
                    {dataFileInfo ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {dataFileInfo.fileName} ({formatFileSize(dataFileInfo.fileSize)})
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                          支持 CSV、Excel 格式，最大 10GB。包含完整的数据集内容。
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      数据分享文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <FileUploader
                        ref={sharingFileRef}
                        onUploadComplete={handleSharingFileUpload}
                        onResetComplete={handleSharingFileReset}
                        maxSize={500 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                    />
                    {sharingFileInfo ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {sharingFileInfo.fileName} ({formatFileSize(sharingFileInfo.fileSize)})
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                          支持 CSV、Excel 格式，最大 500MB。用户申请后可下载的文件。
                        </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      数据字典文件 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <FileUploader
                        ref={dictFileRef}
                        onUploadComplete={handleDictFileUpload}
                        onResetComplete={handleDictFileReset}
                        maxSize={100 * 1024 * 1024}
                        acceptedFileTypes={['.csv', '.xlsx', '.xls']}
                    />
                    {dictFileInfo ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {dictFileInfo.fileName} ({formatFileSize(dictFileInfo.fileSize)})
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                          支持 CSV、Excel 格式，最大 100MB。描述数据字段含义和结构的文件。
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      数据使用协议 <Asterisk className="h-3 w-3 text-red-500" />
                    </Label>
                    <FileUploader
                        ref={termsFileRef}
                        onUploadComplete={handleTermsFileUpload}
                        onResetComplete={handleTermsFileReset}
                        maxSize={20 * 1024 * 1024}
                        acceptedFileTypes={['.pdf', '.doc', '.docx']}
                    />
                    {termsFileInfo ? (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          {termsFileInfo.fileName} ({formatFileSize(termsFileInfo.fileSize)})
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                          支持 PDF、Word 格式，最大 20MB。数据使用的条款和协议文档。
                        </p>
                    )}
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
              <AlertDialogTitle>确认重置表单</AlertDialogTitle>
              <AlertDialogDescription>
                此操作将清除所有已填写的内容和已上传的文件，且无法恢复。您确定要重置表单吗？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={resetForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                确认重置
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
  );
}