import React from 'react';
import Image from 'rc-image';

interface RcImageComponentProps {
  src: string;
  alt?: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  preview?: boolean; // 是否支持预览功能
  fallbackSrc?: string; // 备用图片路径
}

const RcImageComponent: React.FC<RcImageComponentProps> = ({
  src,
  alt = '',
  className = '',
  width = 'auto',
  height = 'auto',
  preview = true,
  fallbackSrc,
}) => {
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      preview={preview}
      fallback={fallbackSrc}
      style={{
        maxWidth: '100%',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '4px',
      }}
    />
  );
};

export default RcImageComponent;