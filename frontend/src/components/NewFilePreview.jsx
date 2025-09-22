import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Maximize2, Minimize2, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

const NewFilePreview = ({ file, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const imageRef = useRef(null);
  const loadStartTime = useRef(Date.now());
  const timeoutRef = useRef(null);

  // 计算动态超时时间
  const calculateTimeout = (fileSize) => {
    const baseMB = fileSize ? fileSize / (1024 * 1024) : 1;
    const baseTimeout = 15000; // 基础15秒
    const additionalTimeout = Math.min(baseMB * 8000, 105000); // 每MB增加8秒，最大105秒
    return Math.min(baseTimeout + additionalTimeout, 120000); // 最大120秒
  };

  // 获取预览URL - 使用useMemo避免每次渲染都生成新URL
  const previewUrl = React.useMemo(() => {
    if (!file) return null;
    // 只在文件ID或重试次数变化时生成新URL，避免每次都用时间戳
    const retry = retryCount > 0 ? `&retry=${retryCount}` : '';
    
    // 判断是聊天文件还是传输文件
    const url = file.is_chat_file 
      ? `/api/messages/${file.id}/file/preview?v=1${retry}`  // 聊天文件使用消息ID
      : `/api/files/${file.id}/preview?v=1${retry}`;         // 传输文件使用文件ID
      
    console.log(`[NewFilePreview] 生成预览URL: ${url} (${file.is_chat_file ? '聊天文件' : '传输文件'}, ID: ${file.id}, 重试: ${retryCount})`);
    return url;
  }, [file?.id, file?.is_chat_file, retryCount]);

  // 重置状态
  const resetState = () => {
    setIsLoading(true);
    setError(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    loadStartTime.current = Date.now();
    
    // 清除超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // 设置超时
  const setupTimeout = () => {
    // 兼容不同的文件大小字段名：优先使用file.size，如果不存在则使用file.file_size
    const fileSize = file?.size || file?.file_size || 0;
    const timeout = calculateTimeout(fileSize);
    console.log(`[NewFilePreview] 设置超时时间: ${timeout/1000}秒, 文件: ${file?.filename}, 大小: ${fileSize}字节`);
    
    timeoutRef.current = setTimeout(() => {
      if (isLoading && !error) {
        console.error(`[NewFilePreview] 文件加载超时: ${file?.filename}`);
        setError(`文件加载超时 (${timeout/1000}秒)`);
        setIsLoading(false);
      }
    }, timeout);
  };

  // 文件变化时重置状态
  useEffect(() => {
    if (file && isOpen) {
      // 兼容不同的文件大小字段名
      const fileSize = file?.size || file?.file_size || 0;
      console.log(`[NewFilePreview] 开始预览文件: ${file.filename}, 类型: ${file.file_type}, 大小: ${fileSize}字节`);
      resetState();
      
      // 延迟设置超时，避免组件重新渲染时立即触发
      const timeoutId = setTimeout(() => {
        setupTimeout();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [file?.id, isOpen, retryCount]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // 处理成功加载
  const handleLoadSuccess = React.useCallback((type, additionalData = {}) => {
    // 防止重复触发
    if (!isLoading) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const loadTime = Date.now() - loadStartTime.current;
    console.log(`[NewFilePreview] ${type}加载成功: ${file?.filename}, 耗时: ${loadTime}ms`, additionalData);
    
    setIsLoading(false);
    setError(null);
    
    if (additionalData.duration) {
      setDuration(additionalData.duration);
    }
  }, [isLoading, file?.filename]);

  // 处理加载错误
  const handleLoadError = React.useCallback((type, errorInfo = {}) => {
    // 防止重复触发
    if (!isLoading) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    const loadTime = Date.now() - loadStartTime.current;
    console.error(`[NewFilePreview] ${type}加载失败: ${file?.filename}, 耗时: ${loadTime}ms`, errorInfo);
    
    setIsLoading(false);
    setError(`${type}加载失败`);
  }, [isLoading, file?.filename]);

  // 重试加载
  const handleRetry = React.useCallback(() => {
    console.log(`[NewFilePreview] 重试加载文件: ${file?.filename}, 重试次数: ${retryCount + 1}`);
    setRetryCount(prev => prev + 1);
  }, [file?.filename, retryCount]);

  // 关闭预览
  const handleClose = () => {
    // 停止媒体播放
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // 重置状态
    setIsPlaying(false);
    setRetryCount(0);
    
    // 清除超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    onClose();
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case ' ':
          if (file?.file_type === 'video' || file?.file_type === 'audio') {
            e.preventDefault();
            togglePlayPause();
          }
          break;
        case 'f':
        case 'F':
          if (file?.file_type === 'image') {
            setIsFullScreen(prev => !prev);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, file]);

  // 背景点击关闭
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // 切换播放/暂停
  const togglePlayPause = () => {
    const mediaRef = file?.file_type === 'video' ? videoRef : audioRef;
    if (!mediaRef.current) return;

    if (isPlaying) {
      mediaRef.current.pause();
    } else {
      mediaRef.current.play().catch(err => {
        console.error('[NewFilePreview] 播放失败:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件大小（兼容不同字段名）
  const getFileSize = () => {
    return file?.size || file?.file_size || 0;
  };

  // 处理进度条点击
  const handleProgressClick = (e) => {
    const mediaRef = file?.file_type === 'video' ? videoRef : audioRef;
    if (!mediaRef.current || !duration) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    mediaRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // 下载文件
  const handleDownload = () => {
    if (!file) return;
    
    // 根据文件类型使用不同的下载接口
    const url = file.is_chat_file 
      ? `/api/messages/${file.id}/file/download`  // 聊天文件下载接口
      : `/api/files/${file.id}/download`;         // 传输文件下载接口
      
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 渲染图片预览
  const renderImagePreview = React.useMemo(() => {
    if (!file || file.file_type !== 'image') return null;
    
    return (
      <div className={`flex items-center justify-center ${isFullScreen ? 'h-screen' : 'h-full min-h-[400px]'}`}>
        <motion.img
          key={`${file.id}-${retryCount}`}
          ref={imageRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          src={previewUrl}
          alt={file.filename}
          className={`max-w-full max-h-full object-contain ${isFullScreen ? 'w-full h-full' : ''}`}
          crossOrigin="anonymous"
          loading="eager"
          decoding="async"
          onLoad={(e) => {
            handleLoadSuccess('图片', {
              width: e.target.naturalWidth,
              height: e.target.naturalHeight
            });
          }}
          onError={(e) => {
            handleLoadError('图片', {
              error: e.type,
              src: previewUrl
            });
          }}
          onAbort={() => {
            handleLoadError('图片', { error: 'aborted' });
          }}
        />
      </div>
    );
  }, [file?.id, retryCount, previewUrl, isFullScreen, handleLoadSuccess, handleLoadError]);

  // 渲染视频预览
  const renderVideoPreview = () => (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-black rounded-lg overflow-hidden">
      <video
        key={`${file?.id}-${retryCount}`}
        ref={videoRef}
        src={previewUrl}
        className="max-w-full max-h-full"
        controls={false}
        onLoadedMetadata={(e) => {
          handleLoadSuccess('视频', { duration: e.target.duration });
        }}
        onError={(e) => {
          handleLoadError('视频', { error: e.target.error });
        }}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* 视频控制条 */}
      {!isLoading && !error && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center space-x-4 text-white">
            <button
              onClick={togglePlayPause}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            
            <span className="text-sm min-w-[80px]">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div 
              className="flex-1 h-1 bg-white/30 rounded cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-white rounded transition-all"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 渲染音频预览
  const renderAudioPreview = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            >
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </motion.div>
          </div>
          <h3 className="text-lg font-semibold mb-2 truncate">{file?.filename}</h3>
          <p className="text-sm opacity-75">{formatFileSize(getFileSize())}</p>
        </div>
        
        <audio
          key={`${file?.id}-${retryCount}`}
          ref={audioRef}
          src={previewUrl}
          className="hidden"
          onLoadedMetadata={(e) => {
            handleLoadSuccess('音频', { duration: e.target.duration });
          }}
          onError={(e) => {
            handleLoadError('音频', { error: e.target.error });
          }}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        
        {!isLoading && !error && (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <div className="flex-1">
                <div 
                  className="h-1 bg-white/30 rounded cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div 
                    className="h-full bg-white rounded transition-all"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newVolume = volume > 0 ? 0 : 1;
                  setVolume(newVolume);
                  if (audioRef.current) audioRef.current.volume = newVolume;
                }}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const newVolume = parseFloat(e.target.value);
                  setVolume(newVolume);
                  if (audioRef.current) audioRef.current.volume = newVolume;
                }}
                className="flex-1 h-1 bg-white/30 rounded appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // 渲染加载状态 - 简洁版
  const renderLoading = () => {
    const elapsed = (Date.now() - loadStartTime.current) / 1000;
    
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600">正在加载... {Math.round(elapsed)}s</p>
        </div>
      </div>
    );
  };

  // 渲染错误状态 - 简洁版
  const renderError = () => (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">加载失败</p>
        
        <div className="flex space-x-2 justify-center">
          <button
            onClick={handleRetry}
            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            <RotateCcw size={14} />
            <span>重试</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
          >
            <Download size={14} />
            <span>下载</span>
          </button>
        </div>
      </div>
    </div>
  );

  // 根据文件类型渲染内容
  const renderContent = () => {
    if (!file) return null;

    switch (file.file_type) {
      case 'image':
        return renderImagePreview;
      case 'video':
        return renderVideoPreview();
      case 'audio':
        return renderAudioPreview();
      default:
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${
          isFullScreen ? 'p-0' : 'p-4'
        }`}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative ${
            isFullScreen 
              ? 'w-full h-full' 
              : 'max-w-6xl max-h-[90vh] w-full bg-white rounded-xl shadow-2xl overflow-hidden'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部工具栏 - 简洁版 */}
          {!isFullScreen && (
            <div className="flex items-center justify-between px-3 py-2 border-b bg-white/95 backdrop-blur-sm">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <div className="text-lg">
                  {file?.file_type === 'image' && '🖼️'}
                  {file?.file_type === 'video' && '🎬'}
                  {file?.file_type === 'audio' && '🎵'}
                  {!['image', 'video', 'audio'].includes(file?.file_type) && '📄'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-800 truncate">{file?.filename}</h3>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(getFileSize())}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {file?.file_type === 'image' && (
                  <button
                    onClick={() => setIsFullScreen(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="全屏查看 (F)"
                  >
                    <Maximize2 size={16} />
                  </button>
                )}
                
                <button
                  onClick={handleDownload}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="下载文件"
                >
                  <Download size={16} />
                </button>
                
                <button
                  onClick={handleClose}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="关闭 (ESC)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 全屏模式顶部工具栏 - 简洁版 */}
          {isFullScreen && (
            <div className="absolute top-3 right-3 z-10 flex space-x-1">
              <button
                onClick={() => setIsFullScreen(false)}
                className="p-2 bg-black/40 text-white hover:bg-black/60 rounded transition-colors"
                title="退出全屏"
              >
                <Minimize2 size={16} />
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 bg-black/40 text-white hover:bg-black/60 rounded transition-colors"
                title="关闭"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* 内容区域 */}
          <div className={`${isFullScreen ? 'h-full' : 'max-h-[calc(90vh-50px)]'} overflow-hidden relative`}>
            {/* 始终挂载媒体元素以便触发 onLoad/onError */}
            {renderContent()}

            {/* 覆盖层：加载中 */}
            {isLoading && !error && (
              <div className="absolute inset-0 bg-white/70 dark:bg-black/50 flex items-center justify-center">
                {renderLoading()}
              </div>
            )}

            {/* 覆盖层：错误 */}
            {error && (
              <div className="absolute inset-0 bg-white dark:bg-black flex items-center justify-center">
                {renderError()}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewFilePreview;