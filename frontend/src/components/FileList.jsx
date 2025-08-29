import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download,
  Trash2,
  Eye,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  Archive,
  File as FileIcon,
  MoreVertical,
  MessageSquare,
  Copy,
  Check,
  Clock,
  Plus
} from 'lucide-react'
import { fileAPI, messageAPI } from '../utils/api'
import { formatFileSize, formatTime } from '../utils'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'

const FileList = ({ files, loading, onDelete, onUploadSuccess }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [extendDialog, setExtendDialog] = useState(null) // 延长过期时间对话框
  const [extendDays, setExtendDays] = useState(15) // 延长的天数
  const [pastedMessages, setPastedMessages] = useState(() => {
    // 从localStorage恢复粘贴的文本消息
    const saved = localStorage.getItem('pastedMessages')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('senderName') || '匿名用户'
  })
  const { currentChannel, socket } = useSocket()

  // 保存用户名
  useEffect(() => {
    localStorage.setItem('senderName', senderName)
  }, [senderName])

  // 保存粘贴的文本消息到localStorage
  useEffect(() => {
    localStorage.setItem('pastedMessages', JSON.stringify(pastedMessages))
  }, [pastedMessages])

  // 监听 WebSocket 事件
  useEffect(() => {
    if (!socket) return

    // 监听文件过期时间延长事件
    const handleFileExpiryExtended = (data) => {
      // 刷新文件列表
      if (onUploadSuccess) {
        onUploadSuccess()
      }
      toast.success(`文件过期时间已延长，剩余 ${data.remaining_text}`)
    }

    socket.on('file_expiry_extended', handleFileExpiryExtended)

    return () => {
      socket.off('file_expiry_extended', handleFileExpiryExtended)
    }
  }, [socket, onUploadSuccess])

  // 当频道切换时，清空当前频道的粘贴消息
  useEffect(() => {
    // 频道切换时保持消息不变，因为消息是全局的
    // 不需要清空，因为粘贴的消息应该跨频道共享
  }, [currentChannel])

  // 处理粘贴事件（支持文本和文件）
  const handlePaste = async (e) => {
    // 防止错误导致组件崩溃
    try {
      const clipboardData = e?.clipboardData
      if (!clipboardData) {
        console.warn('无法访问剪贴板数据')
        return
      }

      // 先处理文件（优先级更高）
      const items = clipboardData.items
      if (!items || items.length === 0) {
        console.warn('剪贴板中没有内容')
        return
      }

      let hasFiles = false
      
      // 检查是否有文件
      for (let i = 0; i < items.length; i++) {
        if (items[i] && items[i].kind === 'file') {
          hasFiles = true
          break
        }
      }
      
      if (hasFiles) {
        e.preventDefault()
        await handleFilesPaste(items)
        return
      }
      
      // 如果没有文件，处理文本
      const text = clipboardData.getData('text/plain')
      if (text && text.trim()) {
        e.preventDefault()
        handleTextPaste(text.trim())
      }
    } catch (error) {
      console.error('粘贴操作失败:', error)
      toast.error('粘贴操作失败：' + (error.message || '未知错误'))
    }
  }

  // 处理文件粘贴
  const handleFilesPaste = async (items) => {
    // 防止重复上传
    if (isUploading) {
      toast.error('正在上传中，请稍后再试')
      return
    }

    // 安全检查 items
    if (!items || items.length === 0) {
      console.warn('没有可用的粘贴项目')
      return
    }

    const filesToUpload = []
    
    try {
      // 安全遍历项目
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item && item.kind === 'file') {
          const file = item.getAsFile()
          if (file) {
            filesToUpload.push(file)
          }
        }
      }

      if (filesToUpload.length === 0) {
        toast.error('没有找到可上传的文件')
        return
      }

      setIsUploading(true)
      toast.success(`开始上传 ${filesToUpload.length} 个文件`)

      // 逐个上传文件
      for (const file of filesToUpload) {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('channel', currentChannel || 'default')
          formData.append('uploader_name', senderName || '匿名用户')
          
          await fileAPI.uploadFile(formData)
          toast.success(`${file.name} 上传成功`)
        } catch (fileError) {
          console.error(`文件 ${file.name} 上传失败:`, fileError)
          toast.error(`${file.name} 上传失败`)
        }
      }
      
      // 刷新文件列表
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error) {
      console.error('文件上传过程中发生错误:', error)
      toast.error('文件上传失败：' + (error.message || '未知错误'))
    } finally {
      // 确保上传状态被正确重置
      setIsUploading(false)
    }
  }

  // 处理文本粘贴
  const handleTextPaste = (text) => {
    try {
      // 安全检查输入
      if (!text || typeof text !== 'string' || !text.trim()) {
        console.warn('无效的文本内容')
        return
      }

      // 生成更安全的 ID
      const timestamp = Date.now()
      const random = Math.floor(Math.random() * 10000)
      const messageId = `paste-text-${timestamp}-${random}`
      
      const newMessage = {
        id: messageId,
        content: text.trim(),
        sender_name: senderName || '匿名用户',
        send_time: timestamp,
        message_type: 'paste'
      }
      
      // 安全更新状态
      setPastedMessages(prev => {
        const newMessages = Array.isArray(prev) ? [...prev] : []
        return [...newMessages, newMessage]
      })
      
      toast.success('文本已粘贴到传输列表')
    } catch (error) {
      console.error('文本粘贴失败:', error)
      toast.error('文本粘贴失败：' + (error.message || '未知错误'))
    }
  }

  // 复制消息到剪贴板
  const copyMessage = async (messageContent, messageId) => {
    try {
      // 方法1: 使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(messageContent)
        setCopiedMessageId(messageId)
        toast.success('已复制到剪贴板')
        
        // 2秒后清除复制状态
        setTimeout(() => {
          setCopiedMessageId(null)
        }, 2000)
        return
      }
      
      // 方法2: 使用 document.execCommand (兼容性更好)
      const textArea = document.createElement('textarea')
      textArea.value = messageContent
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopiedMessageId(messageId)
        toast.success('已复制到剪贴板')
        
        // 2秒后清除复制状态
        setTimeout(() => {
          setCopiedMessageId(null)
        }, 2000)
        return
      }
      
      // 方法3: 回退到手动选择
      throw new Error('execCommand failed')
      
    } catch (error) {
      console.error('复制失败:', error)
      
      // 最后的回退方案：手动选择文本并提示用户
      try {
        const textArea = document.createElement('textarea')
        textArea.value = messageContent
        textArea.style.position = 'fixed'
        textArea.style.left = '50%'
        textArea.style.top = '50%'
        textArea.style.transform = 'translate(-50%, -50%)'
        textArea.style.zIndex = '9999'
        textArea.style.width = '300px'
        textArea.style.height = '150px'
        textArea.style.border = '2px solid #ccc'
        textArea.style.borderRadius = '8px'
        textArea.style.padding = '10px'
        textArea.style.fontSize = '14px'
        textArea.style.backgroundColor = 'white'
        textArea.style.color = 'black'
        
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        toast.success('文本已选择，请按 Ctrl+C 复制', { duration: 4000 })
        
        // 3秒后自动移除
        setTimeout(() => {
          if (document.body.contains(textArea)) {
            document.body.removeChild(textArea)
          }
        }, 3000)
        
      } catch (fallbackError) {
        console.error('回退方案也失败:', fallbackError)
        toast.error('复制失败，请手动选择复制')
      }
    }
  }

  // 删除粘贴的消息
  const deletePastedMessage = (messageId) => {
    setPastedMessages(prev => prev.filter(msg => msg.id !== messageId))
    toast.success('消息已删除')
  }

  const getFileIcon = (fileType) => {
    const iconMap = {
      image: FileImage,
      video: FileVideo,
      audio: FileAudio,
      pdf: FileText,
      document: FileText,
      spreadsheet: FileText,
      presentation: FileText,
      archive: Archive,
      file: FileIcon
    }

    const IconComponent = iconMap[fileType] || FileIcon
    return <IconComponent className={`w-10 h-10 file-icon-${fileType}`} />
  }

  const handleDownload = (file) => {
    const url = fileAPI.downloadFile(file.id)
    const link = document.createElement('a')
    link.href = url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`开始下载 ${file.filename}`)
  }

  const handleDelete = async (fileId) => {
    try {
      await fileAPI.deleteFile(fileId)
      toast.success('文件删除成功')
      onDelete && onDelete()
    } catch (error) {
      console.error('删除文件失败:', error)
      toast.error('删除文件失败')
    } finally {
      setDeleteConfirm(null)
    }
  }

  // 延长文件过期时间
  const handleExtendExpiry = async (fileId, days) => {
    try {
      const response = await fetch(`/api/files/${fileId}/extend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ days })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '延长失败')
      }
      
      const result = await response.json()
      toast.success(result.message)
      
      // 刷新文件列表
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error) {
      console.error('延长过期时间失败:', error)
      toast.error(error.message || '延长过期时间失败')
    } finally {
      setExtendDialog(null)
      setExtendDays(15)
    }
  }

  // 获取过期状态的样式
  const getExpiryStatusStyle = (file) => {
    if (file.is_expired) {
      return 'text-red-500 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
    }
    
    if (file.remaining_days === 0 && file.remaining_hours <= 1) {
      return 'text-orange-500 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
    }
    
    if (file.remaining_days <= 1) {
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    }
    
    return 'text-blue-600 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex-1 overflow-hidden"
      onPaste={handlePaste}
      tabIndex={0}
      style={{ outline: 'none' }}
    >
      <div className="h-full overflow-y-auto custom-scrollbar p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-base md:text-lg font-semibold">
              传输列表 ({files.length + pastedMessages.length}{isUploading ? ' - 上传中...' : ''})
            </h2>
            <div className="text-xs text-muted-foreground">
              按 Ctrl+V 粘贴文本或文件
            </div>
          </div>

          {/* 用户名输入 */}
          <div className="flex items-center space-x-2 mb-4">
            <label className="text-sm font-medium text-muted-foreground flex-shrink-0">
              用户名:
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="flex-1 px-3 py-1 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="输入您的用户名"
              maxLength={20}
            />
          </div>

          <div className="space-y-3 md:space-y-4">
            <AnimatePresence>
              {/* 粘贴的文本消息 */}
              {pastedMessages.map((message) => (
                <motion.div
                  key={`paste-${message.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 md:p-4 group relative"
                >
                  {/* 按钮组 */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10">
                    {/* 复制按钮 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyMessage(message.content, message.id)}
                      className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 transition-colors"
                      title="复制消息"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-300" />
                      )}
                    </motion.button>

                    {/* 删除按钮 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deletePastedMessage(message.id)}
                      className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 transition-colors"
                      title="删除消息"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4 text-red-600 dark:text-red-300" />
                    </motion.button>
                  </div>

                  <div className="flex items-start space-x-2 md:space-x-3">
                    {/* 消息图标 */}
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>

                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center space-x-2 mb-1 md:mb-2">
                        <span className="font-medium text-sm text-blue-700 dark:text-blue-300">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-blue-500 dark:text-blue-400">
                          {formatTime(message.send_time)}
                        </span>
                        <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          粘贴文本
                        </span>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        <pre className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap break-words text-sm md:text-base bg-blue-100 dark:bg-blue-900 p-2 rounded-lg font-mono">
                          {message.content}
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* 文件列表 */}
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-card border border-border rounded-xl p-3 md:p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start md:items-center space-x-3 md:space-x-4">
                    {/* 文件图标 */}
                    <div className="flex-shrink-0 mt-1 md:mt-0">
                      <div className="w-8 h-8 md:w-10 md:h-10">
                        {getFileIcon(file.file_type)}
                      </div>
                    </div>

                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm md:text-base truncate">{file.filename}</h3>
                      <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4 text-xs md:text-sm text-muted-foreground mt-1">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span className="hidden md:inline">•</span>
                        <span>{formatTime(file.upload_time)}</span>
                        <span className="hidden md:inline">•</span>
                        <span className="truncate">上传者: {file.uploader_name}</span>
                      </div>
                      
                      {/* 过期时间显示 */}
                      <div className="mt-2">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${getExpiryStatusStyle(file)}`}>
                          <Clock className="w-3 h-3" />
                          <span>
                            {file.is_expired ? '已过期' : `剩余 ${file.remaining_text}`}
                          </span>
                          {!file.is_expired && (
                            <button
                              onClick={() => setExtendDialog(file.id)}
                              className="ml-1 p-0.5 rounded hover:bg-current hover:bg-opacity-10 transition-colors"
                              title="延长过期时间"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDownload(file)}
                        className="p-2 md:p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-8 h-8 md:w-auto md:h-auto flex items-center justify-center"
                        title="下载文件"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDeleteConfirm(file.id)}
                        className="p-2 md:p-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors w-8 h-8 md:w-auto md:h-auto flex items-center justify-center"
                        title="删除文件"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-4 md:p-6 max-w-lg md:max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">确认删除</h3>
              <p className="text-muted-foreground mb-6">
                确定要删除这个文件吗？此操作无法撤销。
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 延长过期时间对话框 */}
      <AnimatePresence>
        {extendDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setExtendDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-4 md:p-6 max-w-lg md:max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">延长过期时间</h3>
              <p className="text-muted-foreground mb-4">
                请选择要延长的天数：
              </p>
              
              <div className="mb-6">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[1, 7, 15, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setExtendDays(days)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        extendDays === days 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      {days}天
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium flex-shrink-0">自定义：</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="输入天数"
                  />
                  <span className="text-sm text-muted-foreground">天</span>
                </div>
              </div>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {
                    setExtendDialog(null)
                    setExtendDays(15)
                  }}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleExtendExpiry(extendDialog, extendDays)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  确认延长
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
                  
      {/* 空状态 */}
      {files.length === 0 && pastedMessages.length === 0 && !isUploading && (
        <div className="text-center py-8 md:py-12">
          <FileIcon className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">暂无内容</p>
          <p className="text-sm text-muted-foreground mt-2">
            上传文件或粘贴文本/文件后将在这里显示
          </p>
        </div>
      )}
    </div>
  )
}

export default FileList