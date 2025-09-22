import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Image, Paperclip, Smile, Copy, Check, Trash2, X, Download, Eye } from 'lucide-react'
import { messageAPI } from '../utils/api'
import { useSocket } from '../contexts/SocketContext'
import { formatTime, formatFileSize } from '../utils'
import toast from 'react-hot-toast'
import NewFilePreview from './NewFilePreview'

const MessageArea = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('senderName') || '匿名用户'
  })
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const { currentChannel, socket } = useSocket()

  // 自动滚动到底部（仅在消息容器内部滚动）
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }

  useEffect(() => {
    // 延迟滚动，确保 DOM 更新完成
    const timer = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timer)
  }, [messages])

  // 保存用户名
  useEffect(() => {
    localStorage.setItem('senderName', senderName)
  }, [senderName])

  // 监听WebSocket事件
  useEffect(() => {
    if (!socket) return

    // 监听消息删除事件
    const handleMessageDeleted = (data) => {
      console.log('收到消息删除事件:', data)
      // 重新加载消息列表
      onSendMessage && onSendMessage()
    }

    socket.on('message_deleted', handleMessageDeleted)

    return () => {
      socket.off('message_deleted', handleMessageDeleted)
    }
  }, [socket, onSendMessage])

  // 复制消息到剪贴板
  const copyMessage = async (messageContent, messageId) => {
    try {
      await navigator.clipboard.writeText(messageContent)
      setCopiedMessageId(messageId)
      toast.success('已复制到剪贴板')

      // 2秒后清除复制状态
      setTimeout(() => {
        setCopiedMessageId(null)
      }, 2000)
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败，请手动选择复制')
    }
  }

  // 删除消息
  const deleteMessage = async (messageId) => {
    try {
      setDeletingMessageId(messageId)
      await messageAPI.deleteMessage(messageId)
      toast.success('消息已删除')
      // 重新加载消息列表
      onSendMessage && onSendMessage()
    } catch (error) {
      console.error('删除消息失败:', error)
      toast.error('删除消息失败')
    } finally {
      setDeletingMessageId(null)
      setDeleteConfirm(null)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (!newMessage.trim()) {
      toast.error('请输入消息内容')
      return
    }

    try {
      await messageAPI.sendMessage({
        content: newMessage.trim(),
        channel: currentChannel,
        sender_name: senderName,
        message_type: 'text'
      })

      setNewMessage('')
      onSendMessage && onSendMessage()

    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // 处理文件选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  // 处理图片选择
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setSelectedFiles(files)
    }
  }

  // 移除选中的文件
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // 发送文件消息
  const handleSendFiles = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    try {
      for (const file of selectedFiles) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('channel', currentChannel)
        formData.append('sender_name', senderName)
        formData.append('message_content', newMessage.trim() || `发送了文件: ${file.name}`)

        await messageAPI.sendFileMessage(formData)
      }

      setSelectedFiles([])
      setNewMessage('')
      onSendMessage && onSendMessage()
      toast.success(`成功发送 ${selectedFiles.length} 个文件`)

    } catch (error) {
      console.error('发送文件失败:', error)
      toast.error('发送文件失败')
    } finally {
      setUploading(false)
    }
  }

  // 渲染文件消息
  const renderFileMessage = (message) => {
    const fileType = message.file_type || 'unknown'
    const fileName = message.file_name || '未知文件'
    const fileSize = message.file_size || 0
    
    const isImage = fileType.includes('image')
    const isVideo = fileType.includes('video')
    const isAudio = fileType.includes('audio')

    return (
      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-3">
          {/* 文件图标或预览 */}
          <div className="flex-shrink-0">
            {isImage ? (
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
            ) : isVideo ? (
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            ) : isAudio ? (
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Paperclip className="w-6 h-6 text-gray-600" />
              </div>
            )}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
            <p className="text-xs text-gray-500">{formatFileSize(fileSize)} • {fileType}</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center space-x-1">
            {(isImage || isVideo || isAudio) && (
              <button
                onClick={() => setPreviewFile({
                  id: message.id,  // 使用消息ID而不是文件ID
                  filename: fileName,
                  file_type: isImage ? 'image' : isVideo ? 'video' : 'audio',
                  file_size: fileSize,
                  original_filename: fileName,
                  is_chat_file: true  // 标记为聊天文件
                })}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="预览"
              >
                <Eye size={16} />
              </button>
            )}
            
            <a
              href={`/api/messages/${message.id}/file/download`}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
              title="下载"
            >
              <Download size={16} />
            </a>
          </div>
        </div>

        {/* 图片预览 */}
        {isImage && message.id && (
          <div className="mt-3">
            <img
              src={`/api/messages/${message.id}/file/preview`}
              alt={fileName}
              className="max-w-full h-auto max-h-64 rounded-lg border cursor-pointer"
              onClick={() => setPreviewFile({
                id: message.id,  // 使用消息ID
                filename: fileName,
                file_type: 'image',
                file_size: fileSize,
                original_filename: fileName,
                is_chat_file: true  // 标记为聊天文件
              })}
            />
          </div>
        )}
      </div>
    )
  }

  const handleImagePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          // 这里可以实现图片上传功能
          toast.success('图片粘贴功能开发中...')
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 消息列表 */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3 md:space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-xl p-3 md:p-4 group relative"
                >
                  {/* 按钮组 */}
                  <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 z-10">
                    {/* 复制按钮 - 只对文本消息显示 */}
                    {message.message_type !== 'file' && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyMessage(message.content, message.id)}
                        className="p-1.5 rounded-lg bg-accent/80 hover:bg-accent transition-colors"
                        title="复制消息"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
                        )}
                      </motion.button>
                    )}

                    {/* 删除按钮 */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDeleteConfirm(message.id)}
                      disabled={deletingMessageId === message.id}
                      className="p-1.5 rounded-lg bg-accent/80 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="删除消息"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </motion.button>
                  </div>

                  <div className="flex items-start space-x-2 md:space-x-3">
                    {/* 用户头像 */}
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs md:text-sm font-medium text-primary-foreground">
                        {message.sender_name?.charAt(0) || '匿'}
                      </span>
                    </div>

                    {/* 消息内容 */}
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center space-x-2 mb-1 md:mb-2">
                        <span className="font-medium text-sm">
                          {message.sender_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.send_time)}
                        </span>
                      </div>

                      <div className="prose prose-sm max-w-none">
                        {message.message_type === 'file' ? (
                          <div className="space-y-2">
                            <p className="text-foreground text-sm md:text-base">
                              {message.content}
                            </p>
                            {renderFileMessage(message)}
                          </div>
                        ) : (
                          <p className="text-foreground whitespace-pre-wrap break-words text-sm md:text-base">
                            {message.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 空状态 */}
            {messages.length === 0 && (
              <div className="text-center py-8 md:py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                </div>
                <p className="text-base md:text-lg font-medium text-muted-foreground">暂无消息</p>
                <p className="text-sm text-muted-foreground mt-2">
                  发送第一条消息开始聊天
                </p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 消息输入区域 */}
      <div className="border-t border-border p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* 用户名输入 */}
          <div className="flex items-center space-x-2 md:space-x-4 mb-3 md:mb-4">
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

          {/* 消息输入框 */}
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2 md:space-x-3">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onPaste={handleImagePaste}
                className="w-full px-3 md:px-4 py-2 md:py-3 bg-background border border-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm md:text-base"
                placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
              />
            </div>

            {/* 工具按钮 */}
            <div className="flex items-center space-x-1 md:space-x-2">
              {/* 图片上传按钮 */}
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="上传图片"
                onClick={() => imageInputRef.current?.click()}
              >
                <Image className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </button>

              {/* 文件上传按钮 */}
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                title="添加附件"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </button>

              {/* 发送按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={(!newMessage.trim() && selectedFiles.length === 0) || uploading}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={selectedFiles.length > 0 ? (e) => { e.preventDefault(); handleSendFiles(); } : undefined}
              >
                {uploading ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </motion.button>
            </div>
          </form>

          {/* 隐藏的文件输入框 */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="*/*"
          />

          <input
            ref={imageInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleImageSelect}
            accept="image/*"
          />

          {/* 选中文件显示 */}
          {selectedFiles.length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  已选择 {selectedFiles.length} 个文件
                </span>
                <button
                  onClick={() => setSelectedFiles([])}
                  className="text-xs text-gray-500 hover:text-red-600"
                >
                  清空
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                      {file.type.startsWith('image/') ? (
                        <Image className="w-3 h-3 text-blue-600" />
                      ) : (
                        <Paperclip className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                    <span className="flex-1 truncate text-gray-700">{file.name}</span>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="text-gray-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            支持粘贴图片和文件拖拽
          </p>
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
                确定要删除这条消息吗？此操作无法撤销。
              </p>
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteMessage(deleteConfirm)}
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 文件预览组件 */}
      <NewFilePreview
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  )
}

export default MessageArea