import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

interface PDFPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileUrl: string;
  fileName?: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ open, onOpenChange, fileUrl, fileName }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (open && fileUrl) {
      // 设置PDF URL
      setPdfUrl(fileUrl);
      setLoading(false);
      setError(null);
    } else {
      setPdfUrl(null);
      setLoading(false);
      setError(null);
    }
  }, [open, fileUrl]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // 清理URL对象以避免内存泄漏
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] w-full h-[90vh] flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle>{fileName || 'PDF预览'}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              重置
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto relative">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <p>加载中...</p>
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">{error}</p>
            </div>
          )}
          
          {pdfUrl && !loading && !error && (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              title={fileName || 'PDF预览'}
              onError={() => setError('PDF加载失败')}
            />
          )}
          
          {!pdfUrl && !loading && !error && (
            <div className="flex items-center justify-center h-full">
              <p>未提供有效的PDF文件</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFPreview;