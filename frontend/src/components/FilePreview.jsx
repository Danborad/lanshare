import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Maximize2, Minimize2, Volume2, VolumeX, Play, Pause } from 'lucide-react'
import { fileAPI } from '../utils/api'
import toast from 'react-hot-toast'

const FilePreview = ({ file, isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const videoRef = useRef(null)
  const audioRef = useRef(null)
  const loadStartTime = useRef(Date.now())
  const timeoutRef = useRef(null)

  // 当文件变化时重置状态
  useEffect(() => {
    if (file && isOpen) {
      setIsLoading(true)
      setError(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      loadStartTime.current = Date.now()
      
      // 清除之前的超时
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      
      // 根据文件大小动态设置超时时间（基础20秒 + 每MB增加10秒，最大120秒）
      const baseTimeout = 20000 // 基础20秒
      const fileSizeMB = (file?.file_size || 0) / (1024 * 1024)
      const sizeBasedTimeout = Math.min(fileSizeMB * 10000, 100000) // 每MB增加10秒，最大100秒
      const totalTimeout = Math.min(baseTimeout + sizeBasedTimeout, 120000) // 最大120秒
      
      console.log(`预览文件: ${file?.filename}, 大小: ${fileSizeMB.toFixed(2)}MB, 超时时间: ${totalTimeout/1000}秒`)
      
      timeoutRef.current = setTimeout(() => {
        // 只有在仍然处于加载状态且没有错误时才触发超时
        if (isLoading && !error) {
          setError(`文件加载超时（${totalTimeout/1000}秒）`)
          setIsLoading(false)
          toast.error(`文件加载超时，请检查网络连接或稍后重试`)
        }
      }, totalTimeout)
    }
  }, [file, isOpen])

  // 清理函数
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [])

  // 获取文件预览URL
  const getPreviewUrl = () => {
    if (!file) return null
    const baseUrl = fileAPI.previewFile(file.id)
    // 添加时间戳避免缓存问题
    const timestamp = Date.now()
    const separator = baseUrl.includes('?') ? '&' : '?'
    return `${baseUrl}${separator}t=${timestamp}`
  }

  // 关闭预览
  const handleClose = () => {
    // 停止播放
    if (videoRef.current) {
      videoRef.current.pause()
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsPlaying(false)
    
    // 清除超时
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    onClose()
  }

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          handleClose()
          break
        case ' ':
          if (file?.file_type === 'video' || file?.file_type === 'audio') {
            e.preventDefault()
            togglePlayPause()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, file])

  // 处理点击背景关闭
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  // 切换播放/暂停
  const togglePlayPause = () => {
    const mediaRef = file?.file_type === 'video' ? videoRef : audioRef
    if (!mediaRef.current) return

    if (isPlaying) {
      mediaRef.current.pause()
    } else {
      mediaRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // 处理媒体加载
  const handleMediaLoad = (e) => {
    // 清除超时处理
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsLoading(false)
    setDuration(e.target.duration || 0)
    console.log('媒体加载成功:', file?.filename, '耗时:', Date.now() - loadStartTime.current + 'ms')
    toast.success('媒体文件加载成功')
  }

  // 处理媒体错误
  const handleMediaError = () => {
    // 清除超时处理
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setError('无法加载媒体文件')
    setIsLoading(false)
    console.error('媒体加载失败:', file?.filename, '耗时:', Date.now() - loadStartTime.current + 'ms')
    toast.error('媒体文件加载失败')
  }

  // 格式化时间
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00'
    
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 处理进度条点击
  const handleProgressClick = (e) => {
    const mediaRef = file?.file_type === 'video' ? videoRef : audioRef
    if (!mediaRef.current) return

    const rect = e.target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    
    mediaRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // 下载文件
  const handleDownload = () => {
    if (!file) return
    
    const url = fileAPI.downloadFile(file.id)
    const link = document.createElement('a')
    link.href = url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`开始下载 ${file.filename}`)
  }

  // 渲染图片预览
  const renderImagePreview = () => {
    const previewUrl = getPreviewUrl()
    console.log('渲染图片预览:', file?.filename, '预览URL:', previewUrl)
    
    return (
      <div className="flex items-center justify-center h-full">
        <motion.img
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          src={previewUrl}
          alt={file?.filename}
          className={`max-w-full max-h-full object-contain ${isFullScreen ? 'w-full h-full' : ''}`}
          crossOrigin="anonymous"
          loading="eager"
          decoding="async"
          onLoadStart={() => {
            console.log('图片开始加载:', file?.filename)
          }}
          onProgress={(e) => {
            console.log('图片加载进度:', e)
          }}
          onLoad={(e) => {
            // 清除超时处理
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            const loadTime = Date.now() - loadStartTime.current
            console.log('图片加载成功:', file?.filename, '耗时:', loadTime + 'ms', '尺寸:', e.target.naturalWidth + 'x' + e.target.naturalHeight)
            setIsLoading(false)
            toast.success(`图片加载成功 (${loadTime}ms)`)
          }}
          onError={(e) => {
            // 清除超时处理
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            const loadTime = Date.now() - loadStartTime.current
            console.error('图片加载失败:', file?.filename, '错误:', e, '耗时:', loadTime + 'ms')
            console.error('图片URL:', previewUrl)
            console.error('错误类型:', e.type, '错误信息:', e.message)
            setError(`图片加载失败: ${e.type || '未知错误'}`)
            setIsLoading(false)
            toast.error('图片加载失败')
          }}
          onAbort={(e) => {
            // 清除超时处理
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            const loadTime = Date.now() - loadStartTime.current
            console.log('图片加载被中断:', file?.filename, '耗时:', loadTime + 'ms')
            setError('图片加载被中断')
            setIsLoading(false)
          }}
        />
      </div>
    )
  }

  // 渲染视频预览
  const renderVideoPreview = () => (
    <div className="flex items-center justify-center h-full bg-black">
      <video
        ref={videoRef}
        src={getPreviewUrl()}
        className="max-w-full max-h-full"
        controls={false}
        onLoadedMetadata={handleMediaLoad}
        onError={handleMediaError}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* 自定义控制条 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center space-x-4 text-white">
          <button
            onClick={togglePlayPause}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <span className="text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          
          <div 
            className="flex-1 h-1 bg-white/30 rounded cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-white rounded"
              style={{ width: `${(currentTime / duration) * 100}%` }}
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
    </div>
  )

  // 渲染音频预览
  const renderAudioPreview = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-purple-500 to-pink-500">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">{file?.filename}</h3>
          <p className="text-sm opacity-75">音频文件</p>
        </div>
        
        <audio
          ref={audioRef}
          src={getPreviewUrl()}
          className="hidden"
          onLoadedMetadata={handleMediaLoad}
          onError={handleMediaError}
          onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
          onEnded={() => setIsPlaying(false)}
        />
        
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
                  className="h-full bg-white rounded"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
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
                const newVolume = volume > 0 ? 0 : 1
                setVolume(newVolume)
                if (audioRef.current) audioRef.current.volume = newVolume
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
                const newVolume = parseFloat(e.target.value)
                setVolume(newVolume)
                if (audioRef.current) audioRef.current.volume = newVolume
              }}
              className="flex-1 h-1 bg-white/30 rounded appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染加载状态
  const renderLoading = () => {
    const fileSizeMB = file ? (file.file_size || 0) / (1024 * 1024) : 0
    const estimatedTimeout = Math.min(20000 + Math.min(fileSizeMB * 10000, 100000), 120000) / 1000
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
          {fileSizeMB > 1 && (
            <p className="text-sm text-muted-foreground mt-2">
              文件较大 ({fileSizeMB.toFixed(1)}MB)，可能需要一些时间
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            预计超时时间: {estimatedTimeout}秒
          </p>
          {fileSizeMB > 10 && (
            <p className="text-xs text-yellow-600 mt-2">
              警告：文件较大，请耐心等待
            </p>
          )}
        </div>
      </div>
    )
  }

  // 渲染错误状态
  const renderError = () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-destructive">
        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-medium mb-2">加载失败</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <div className="space-y-2">
          <button 
            onClick={() => {
              setError(null)
              setIsLoading(true)
              // 重新初始化加载状态
              loadStartTime.current = Date.now()
              
              // 重新设置超时
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
              
              const baseTimeout = 20000
              const fileSizeMB = (file?.file_size || 0) / (1024 * 1024)
              const sizeBasedTimeout = Math.min(fileSizeMB * 10000, 100000)
              const totalTimeout = Math.min(baseTimeout + sizeBasedTimeout, 120000)
              
              timeoutRef.current = setTimeout(() => {
                if (isLoading && !error) {
                  setError(`文件加载超时（${totalTimeout/1000}秒）`)
                  setIsLoading(false)
                  toast.error('文件加载超时，请检查网络连接或稍后重试')
                }
              }, totalTimeout)
            }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            重新加载
          </button>
          <div className="text-xs text-muted-foreground">
            <p>提示：</p>
            <p>• 检查网络连接</p>
            <p>• 文件可能过大</p>
            <p>• 稍后再试</p>
          </div>
        </div>
      </div>
    </div>
  )

  // 根据文件类型渲染预览
  const renderPreview = () => {
    if (!file) return null

    switch (file.file_type) {
      case 'image':
        return renderImagePreview()
      case 'video':
        return renderVideoPreview()
      case 'audio':
        return renderAudioPreview()
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">该文件类型不支持预览</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                下载文件
              </button>
            </div>
          </div>
        )
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${
          isFullScreen && file?.file_type === 'image' ? 'p-0' : 'p-4'
        }`}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`relative ${
            isFullScreen && file?.file_type === 'image' 
              ? 'w-full h-full' 
              : 'max-w-4xl max-h-[90vh] w-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title="下载文件"
            >
              <Download size={20} />
            </button>
            
            {file?.file_type === 'image' && (
              <button
                onClick={() => setIsFullScreen(!isFullScreen)}
                className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                title={isFullScreen ? '退出全屏' : '全屏查看'}
              >
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            )}
            
            <button
              onClick={handleClose}
              className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
              title="关闭"
            >
              <X size={20} />
            </button>
          </div>

          {/* 文件标题 */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-lg">
            <p className="text-sm font-medium truncate max-w-xs">{file?.filename}</p>
          </div>

          {/* 预览内容 */}
          <div className={`${
            file?.file_type === 'video' || file?.file_type === 'audio' 
              ? 'h-full' 
              : 'h-full'
          }`}>
            {isLoading && !error && renderLoading()}
            {error && renderError()}
            {!isLoading && !error && renderPreview()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FilePreview