import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const FilePreview = ({ file, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadStartTime, setLoadStartTime] = useState(0);
  const mediaRef = useRef(null);
  const timeoutRef = useRef(null);

  // 重置状态当文件或模态框状态改变时
  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true);
      setError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setLoadStartTime(Date.now());
      
      // 清除之前的超时
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 设置10秒超时
      timeoutRef.current = setTimeout(() => {
        if (isLoading && !error) {
          setError('文件加载超时（10秒）');
          setIsLoading(false);
        }
      }, 10000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [file, isOpen]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!file || !isOpen) return null;

  const previewUrl = `/api/files/${file.id}/preview`;
  const loadTime = loadStartTime ? Date.now() - loadStartTime : 0;

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
    console.log(`图片加载成功: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('图片加载失败');
    console.error(`图片加载失败: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleImageAbort = () => {
    setIsLoading(false);
    setError('图片加载被中断');
    console.log(`图片加载被中断: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
    console.log(`视频加载成功: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('视频加载失败');
    console.error(`视频加载失败: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleAudioLoad = () => {
    setIsLoading(false);
    setError(null);
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
    console.log(`音频加载成功: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const handleAudioError = () => {
    setIsLoading(false);
    setError('音频加载失败');
    console.error(`音频加载失败: ${file.filename}, 耗时: ${loadTime}ms`);
  };

  const togglePlay = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">正在加载文件...</p>
          <p className="text-sm text-gray-500 mt-2">已用时: {loadTime}ms</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">文件: {file.filename}</p>
          <p className="text-sm text-gray-500 mb-6">耗时: {loadTime}ms</p>
          <button
            onClick={() => window.open(previewUrl, '_blank')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            在新窗口打开
          </button>
        </div>
      );
    }

    switch (file.file_type) {
      case 'image':
        return (
          <div className="flex flex-col items-center">
            <img
              src={previewUrl}
              alt={file.filename}
              className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
              onLoad={handleImageLoad}
              onError={handleImageError}
              onAbort={handleImageAbort}
            />
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>文件: {file.filename}</p>
              <p>大小: {formatFileSize(file.size)} | 加载时间: {loadTime}ms</p>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="flex flex-col items-center">
            <video
              ref={mediaRef}
              src={previewUrl}
              className="max-w-full max-h-96 rounded-lg shadow-lg"
              controls
              onLoadedData={handleVideoLoad}
              onError={handleVideoError}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>文件: {file.filename}</p>
              <p>大小: {formatFileSize(file.size)} | 时长: {formatTime(duration)}</p>
              <p>加载时间: {loadTime}ms</p>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-8 rounded-lg shadow-lg">
              <audio
                ref={mediaRef}
                src={previewUrl}
                className="w-full max-w-md"
                controls
                onLoadedData={handleAudioLoad}
                onError={handleAudioError}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>
            <div className="mt-4 text-sm text-gray-600 text-center">
              <p>文件: {file.filename}</p>
              <p>大小: {formatFileSize(file.size)} | 时长: {formatTime(duration)}</p>
              <p>加载时间: {loadTime}ms</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-center">
            <div className="text-gray-400 text-6xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">不支持预览</h3>
            <p className="text-gray-500 mb-4">此文件类型暂不支持预览</p>
            <p className="text-sm text-gray-500 mb-6">文件: {file.filename}</p>
            <button
              onClick={() => window.open(`/api/files/${file.id}/download`, '_blank')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              下载文件
            </button>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-full overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">
              {file.file_type === 'image' && '🖼️'}
              {file.file_type === 'video' && '🎬'}
              {file.file_type === 'audio' && '🎵'}
              {!['image', 'video', 'audio'].includes(file.file_type) && '📄'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 truncate max-w-md">{file.filename}</h3>
              <p className="text-sm text-gray-600">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        {/* 内容区域 */}
        <div className="p-6 max-h-96vh overflow-auto">
          {renderContent()}
        </div>

        {/* 底部信息 */}
        <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>文件类型: {file.file_type}</span>
            <span>剩余时间: {file.remaining_text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

FilePreview.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.number.isRequired,
    filename: PropTypes.string.isRequired,
    file_type: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
    remaining_text: PropTypes.string.isRequired,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FilePreview;