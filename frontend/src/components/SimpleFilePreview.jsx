import React, { useState, useEffect, useRef } from 'react';
import { X, Download, RotateCcw } from 'lucide-react';

const SimpleFilePreview = ({ file, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now());
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // 计算预览URL（只在文件改变时计算一次）
  const previewUrl = React.useMemo(() => {
    if (!file) return null;
    return `/api/files/${file.id}/preview?t=${Date.now()}`;
  }, [file?.id]);

  // 重置状态（只在文件或打开状态改变时）
  useEffect(() => {
    if (!isOpen || !file) {
      return;
    }

    console.log(`[SimpleFilePreview] 开始预览文件: ${file.filename}`);
    
    // 重置状态
    setIsLoading(true);
    setError(null);
    setLoadingStartTime(Date.now());
    
    // 清除之前的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 设置30秒超时
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        setError('文件加载超时（30秒）');
        setIsLoading(false);
      }
    }, 30000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [file?.id, isOpen]);

  // 组件卸载时清理
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 处理图片加载成功
  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    
    console.log(`[SimpleFilePreview] 图片加载成功: ${file?.filename}`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    setError(null);
  };

  // 处理图片加载失败
  const handleImageError = () => {
    if (!mountedRef.current) return;
    
    console.error(`[SimpleFilePreview] 图片加载失败: ${file?.filename}`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    setError('图片加载失败');
  };

  // 处理媒体加载成功
  const handleMediaLoad = () => {
    if (!mountedRef.current) return;
    
    console.log(`[SimpleFilePreview] 媒体加载成功: ${file?.filename}`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    setError(null);
  };

  // 处理媒体加载失败
  const handleMediaError = () => {
    if (!mountedRef.current) return;
    
    console.error(`[SimpleFilePreview] 媒体加载失败: ${file?.filename}`);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsLoading(false);
    setError('媒体文件加载失败');
  };

  // 关闭预览
  const handleClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onClose();
  };

  // 重试加载
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setLoadingStartTime(Date.now());
    
    // 设置新的超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && isLoading) {
        setError('文件加载超时（30秒）');
        setIsLoading(false);
      }
    }, 30000);
  };

  // 下载文件
  const handleDownload = () => {
    if (!file) return;
    
    const url = `/api/files/${file.id}/download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 渲染加载状态
  const renderLoading = () => {
    const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000);
    
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 mb-2">正在加载文件...</p>
          <p className="text-sm text-gray-500">已用时: {elapsed}秒</p>
          <p className="text-xs text-gray-400 mt-2">文件: {file?.filename}</p>
        </div>
      </div>
    );
  };

  // 渲染错误状态
  const renderError = () => (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">加载失败</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <p className="text-sm text-gray-500 mb-6">文件: {file?.filename}</p>
        
        <div className="flex space-x-2 justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RotateCcw size={16} />
            <span>重新加载</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download size={16} />
            <span>下载</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 渲染预览内容
  const renderContent = () => {
    if (isLoading) return renderLoading();
    if (error) return renderError();
    
    if (!file || !previewUrl) return null;

    switch (file.file_type) {
      case 'image':
        return (
          <div className="flex items-center justify-center min-h-96">
            <img
              src={previewUrl}
              alt={file.filename}
              className="max-w-full max-h-96 object-contain"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center min-h-96">
            <video
              src={previewUrl}
              controls
              className="max-w-full max-h-96"
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center justify-center min-h-96 bg-gradient-to-br from-purple-500 to-pink-500">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-white text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-4">{file.filename}</h3>
              <audio
                src={previewUrl}
                controls
                className="w-full max-w-sm"
                onLoadedData={handleMediaLoad}
                onError={handleMediaError}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">不支持预览</h3>
              <p className="text-gray-500 mb-4">此文件类型暂不支持预览</p>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
              >
                <Download size={16} />
                <span>下载文件</span>
              </button>
            </div>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {file?.file_type === 'image' && '🖼️'}
              {file?.file_type === 'video' && '🎬'}
              {file?.file_type === 'audio' && '🎵'}
              {!['image', 'video', 'audio'].includes(file?.file_type) && '📄'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-800 truncate">{file?.filename}</h3>
              <p className="text-sm text-gray-600">
                {formatFileSize(file?.size)} • {file?.file_type}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              title="下载文件"
            >
              <Download size={20} />
            </button>
            
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
              title="关闭 (ESC)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="max-h-[calc(90vh-80px)] overflow-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SimpleFilePreview;