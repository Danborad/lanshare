import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Image, Paperclip, Smile, Copy, Check, Trash2 } from 'lucide-react'
import { messageAPI } from '../utils/api'
import { useSocket } from '../contexts/SocketContext'
import { formatTime } from '../utils'
import toast from 'react-hot-toast'

const MessageArea = ({ messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState('')
  const [senderName, setSenderName] = useState(() => {
    return localStorage.getItem('senderName') || '匿名用户'
  })
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
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
                    {/* 复制按钮 */}
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
                        <p className="text-foreground whitespace-pre-wrap break-words text-sm md:text-base">
                          {message.content}
                        </p>
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
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-accent transition-colors hidden md:block"
                title="上传图片"
                onClick={() => toast.success('图片上传功能开发中...')}
              >
                <Image className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </button>

              <button
                type="button"
                className="p-2 rounded-lg hover:bg-accent transition-colors hidden md:block"
                title="添加附件"
                onClick={() => toast.success('附件功能开发中...')}
              >
                <Paperclip className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
              </button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </motion.button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-2 hidden md:block">
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
    </div>
  )
}

export default MessageArea