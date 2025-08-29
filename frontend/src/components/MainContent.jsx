import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import FileUpload from './FileUpload'
import FileList from './FileList'
import MessageArea from './MessageArea'
import ErrorBoundary from './ErrorBoundary'
import { useSocket } from '../contexts/SocketContext'
import { fileAPI, messageAPI } from '../utils/api'
import toast from 'react-hot-toast'

const MainContent = ({ onStatsUpdate }) => {
  const [activeTab, setActiveTab] = useState('files')
  const [files, setFiles] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  // 保存FileUpload组件的状态，避免切换标签页时丢失
  const [fileUploadState, setFileUploadState] = useState({
    selectedFiles: [],
    uploading: false
  })
  const { socket, currentChannel, connected } = useSocket()

  // 加载文件列表
  const loadFiles = async () => {
    try {
      setLoading(true)
      const response = await fileAPI.getFiles(currentChannel)
      setFiles(response.files || [])
    } catch (error) {
      console.error('加载文件失败:', error)
      toast.error('加载文件失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载消息列表
  const loadMessages = async () => {
    try {
      const response = await messageAPI.getMessages(currentChannel)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('加载消息失败:', error)
      toast.error('加载消息失败')
    }
  }

  // Socket事件监听
  useEffect(() => {
    if (!socket) return

    // 监听文件上传事件
    socket.on('file_uploaded', (data) => {
      setFiles(prev => [data, ...prev])
      toast.success(`新文件: ${data.filename}`)
    })

    // 监听文件删除事件
    socket.on('file_deleted', (data) => {
      setFiles(prev => prev.filter(file => file.id !== data.file_id))
      toast.success('文件已删除')
    })

    // 监听新消息事件
    socket.on('new_message', (data) => {
      setMessages(prev => [...prev, data])
    })

    return () => {
      socket.off('file_uploaded')
      socket.off('file_deleted')
      socket.off('new_message')
    }
  }, [socket])

  // 统计数据更新
  useEffect(() => {
    if (onStatsUpdate) {
      // 模拟在线用户数（可以根据实际情况调整）
      const onlineUsers = connected ? 1 : 0
      onStatsUpdate({ onlineUsers, totalFiles: files.length })
    }
  }, [files.length, connected, onStatsUpdate])

  // 当频道切换时重新加载数据
  useEffect(() => {
    loadFiles()
    loadMessages()
  }, [currentChannel])

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* 标签页切换 */}
      <div className="border-b border-border">
        <div className="flex space-x-0 overflow-x-auto">
          {[
            { id: 'files', label: '文件传输', icon: '📁' },
            { id: 'messages', label: '消息聊天', icon: '💬' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 md:px-6 md:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">
                {tab.id === 'files' ? '文件' : '消息'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'files' && (
            <motion.div
              key="files"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              <FileUpload 
                onUploadSuccess={loadFiles} 
                selectedFiles={fileUploadState.selectedFiles}
                uploading={fileUploadState.uploading}
                onStateChange={setFileUploadState}
              />
              <ErrorBoundary>
                <FileList files={files} loading={loading} onDelete={loadFiles} onUploadSuccess={loadFiles} />
              </ErrorBoundary>
            </motion.div>
          )}

          {activeTab === 'messages' && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              <MessageArea
                messages={messages}
                onSendMessage={loadMessages}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MainContent