import React, {useState, useEffect, useRef} from 'react';
import {RotateCw, ZoomIn, ZoomOut, ExternalLink, AlertTriangle} from 'lucide-react';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

interface PDFPreviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileUrl: string;
    fileName?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({open, onOpenChange, fileUrl, fileName}) => {
    const [isLoadingBlob, setIsLoadingBlob] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasTriedFetch, setHasTriedFetch] = useState(false);
    const [progress, setProgress] = useState(0); // 0~100，或 -1 表示未知进度
    const abortControllerRef = useRef<AbortController | null>(null);

    // 使用流式读取 + 进度追踪
    useEffect(() => {
        if (!open || !fileUrl) {
            setError(null);
            setIsLoadingBlob(false);
            setHasTriedFetch(false);
            setProgress(0);
            return;
        }

        // 检测协议：如果是 HTTP 且在 HTTPS 页面下，直接在新标签页打开
        const isHttpsPage = window.location.protocol === 'https:';

        if (!isHttpsPage) {
            // ❌ 不能 fetch HTTP 资源，直接在新标签页打开并关闭对话框
            handleOpenInNewTab();
            onOpenChange(false);
            return;
        }

        // ✅ 只有在同源或 HTTPS 情况下才尝试 fetch（理论上安全）
        setIsLoadingBlob(true);
        setError(null);
        setHasTriedFetch(true);
        setProgress(0); // 开始加载，进度归零

        // 创建 AbortController 用于取消请求
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const separator = fileUrl.includes('?') ? '&' : '?';
        const previewUrl = `${fileUrl}${separator}preview=true`;

        fetch(previewUrl, {signal: controller.signal})
            .then(async (res) => {
                if (!res.ok) throw new Error(`加载失败：${res.status}`);
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/pdf')) {
                    throw new Error('该链接返回的不是 PDF 文件');
                }

                // ✅ 获取文件总大小（用于计算进度）
                const contentLength = res.headers.get('content-length');
                const total = contentLength ? parseInt(contentLength, 10) : 0;

                if (total === 0) {
                    // 无法获取总长度，只能“模糊”加载
                    console.warn('无法获取 Content-Length，无法显示精确进度');
                }

                const reader = res.body?.getReader();
                if (!reader) throw new Error('无法读取响应流');

                const chunks: Uint8Array[] = [];
                let received = 0;

                while (true) {
                    const {done, value} = await reader.read();

                    if (done) break;

                    if (value) {
                        chunks.push(value);
                        received += value.length;

                        // ✅ 更新进度
                        if (total > 0) {
                            const percent = Math.round((received / total) * 100);
                            setProgress(percent);
                        } else {
                            // 无法知道总量时，显示一个“加载中”但不显示百分比
                            setProgress(-1); // 特殊值表示未知进度
                        }
                    }
                }

                // ✅ 合并所有 chunk 成 Blob
                const blob = new Blob(chunks, {type: 'application/pdf'});
                const objectUrl = URL.createObjectURL(blob);
                console.log('blob url:', objectUrl);

                // 直接用 window.open 打开 Blob URL（绕过 iframe 混合内容问题）
                const newWindow = window.open(objectUrl, '_blank');
                if (!newWindow) {
                    throw new Error('浏览器阻止了弹窗，请允许弹窗后重试');
                }

                // 可选：关闭当前预览窗口
                onOpenChange(false);
            })
            .catch((err) => {
                if (err.name === 'AbortError') {
                    console.log('PDF 加载请求已被用户取消');
                    return;
                }
                console.error(err);
                setError(err.message || 'PDF 加载失败，可能是网络或安全限制');
                setProgress(0);
            })
            .finally(() => {
                setIsLoadingBlob(false);
            });

        // 清理函数
        return () => {
            // 注意：Blob URL 由新窗口控制，不应在此 revoke
            // 取消正在进行的请求
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, [open, fileUrl, onOpenChange]);

    const handleOpenInNewTab = () => {
        // 直接打开原始链接（用户手动触发，不易被拦截）
        const separator = fileUrl.includes('?') ? '&' : '?';
        const previewUrl = `${fileUrl}${separator}preview=true`;
        window.open(previewUrl, '_blank');
    };

    const handleRetryOrDownload = () => {
        // 再次尝试或提示
        if (window.confirm('即将在新标签页打开 PDF，如果无法显示，请右键另存为下载。')) {
            handleOpenInNewTab();
        }
    };

    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            // 允许用户随时关闭预览，包括加载过程中
            onOpenChange(val);
        }}>
            <DialogContent className="max-w-2xl w-full">
                <DialogHeader>
                    <DialogTitle>{fileName || 'PDF 预览'}</DialogTitle>
                </DialogHeader>

                <div className="py-6 text-center">
                    {isLoadingBlob && (
                        <div className="flex flex-col items-center gap-4 w-full px-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>

                            {/* 进度条容器 */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-linear"
                                    style={{width: progress >= 0 ? `${progress}%` : '100%'}}
                                ></div>
                            </div>

                            {/* 进度文字 */}
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {progress >= 0
                                    ? `正在加载 PDF... ${progress}%`
                                    : '正在加载 PDF...'}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center gap-4 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-10 w-10 text-yellow-500"/>
                            <p className="font-medium">预览受限</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md">{error}</p>

                            <div className="flex gap-4 mt-4">
                                <Button onClick={handleOpenInNewTab} className="gap-2">
                                    <ExternalLink className="h-4 w-4"/>
                                    在新标签页打开
                                </Button>
                                <Button variant="outline" onClick={handleClose}>关闭</Button>
                            </div>
                        </div>
                    )}

                    {!isLoadingBlob && !error && !hasTriedFetch && (
                        <p>准备加载 PDF...</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PDFPreview;