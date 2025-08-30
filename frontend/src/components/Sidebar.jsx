import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Hash,
  Plus,
  Settings,
  Sun,
  Moon,
  Wifi,
  Users,
  X,
  Edit3,
  Trash2,
  MoreVertical,
  Check,
  XCircle
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'

const Sidebar = ({ isMobile = false, onClose }) => {
  const { theme, toggleTheme } = useTheme()
  const { connected, currentChannel, joinChannel } = useSocket()
  const [channels, setChannels] = useState(['default', '工作区', '生活区'])
  const [editingChannel, setEditingChannel] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [showAddInput, setShowAddInput] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  // 获取频道显示名称
  const getChannelDisplayName = (channel) => {
    return channel === 'default' ? '默认列表' : channel
  }

  const handleChannelChange = (channel) => {
    joinChannel(channel)
    // 移动端切换频道后关闭侧边栏
    if (isMobile && onClose) {
      onClose()
    }
  }

  // 添加新频道
  const handleAddChannel = () => {
    if (newChannelName.trim() && !channels.includes(newChannelName.trim())) {
      setChannels([...channels, newChannelName.trim()])
      setNewChannelName('')
      setShowAddInput(false)
      toast.success(`频道 "${newChannelName.trim()}" 已创建`)
    } else if (channels.includes(newChannelName.trim())) {
      toast.error('频道名称已存在')
    }
  }

  // 开始编辑频道名称
  const startEditChannel = (channel) => {
    setEditingChannel(channel)
    setEditingName(getChannelDisplayName(channel))
    setShowContextMenu(null)
  }

  // 保存编辑
  const saveEditChannel = () => {
    if (editingName.trim() && editingName.trim() !== editingChannel) {
      if (channels.includes(editingName.trim())) {
        toast.error('频道名称已存在')
        return
      }

      const updatedChannels = channels.map(ch =>
        ch === editingChannel ? editingName.trim() : ch
      )
      setChannels(updatedChannels)

      // 如果当前频道被重命名，更新当前频道
      if (currentChannel === editingChannel) {
        joinChannel(editingName.trim())
      }

      toast.success(`频道已重命名为 "${editingName.trim()}"`)
    }
    setEditingChannel(null)
    setEditingName('')
  }

  // 取消编辑
  const cancelEditChannel = () => {
    setEditingChannel(null)
    setEditingName('')
  }

  // 删除频道
  const deleteChannel = (channel) => {
    if (channel === 'default') {
      toast.error('默认列表不能删除')
      return
    }

    if (channels.length <= 1) {
      toast.error('至少需要保留一个频道')
      return
    }

    const updatedChannels = channels.filter(ch => ch !== channel)
    setChannels(updatedChannels)

    // 如果删除的是当前频道，切换到默认频道
    if (currentChannel === channel) {
      joinChannel('default')
    }

    setShowContextMenu(null)
    toast.success(`频道 "${getChannelDisplayName(channel)}" 已删除`)
  }

  // 右键菜单
  const handleContextMenu = (e, channel) => {
    e.preventDefault()
    setShowContextMenu(channel)
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  // 点击其他地方关闭菜单
  const handleClickOutside = () => {
    setShowContextMenu(null)
    setShowAddInput(false)
  }

  // 版本信息状态
  const [version, setVersion] = useState('v1.0.0')

  // 获取版本信息
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch('/api/system/version')
        const data = await response.json()
        setVersion(data.version || 'v1.0.0')
      } catch (error) {
        console.error('获取版本信息失败:', error)
        setVersion('v1.0.0')
      }
    }
    fetchVersion()
  }, [])

  return (
    <div className={`bg-card border-r border-border flex flex-col ${isMobile ? 'w-80 h-full' : 'w-64 h-full'
      }`}>
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* LanShare 图标 */}
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 1024 1024"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 fill-current text-black dark:text-white"
              >
                <path d="M852 0 172 0C77.408 0 0 77.408 0 172l0 680c0 94.592 77.408 172 172 172l680 0c94.592 0 172-77.408 172-172L1024 172C1024 77.408 946.592 0 852 0zM843.68 807.68c-113.344 37.344-334.656 110.016-376 120.32s-84 27.68-108-41.664c0 0-204-602.656-222.656-656S100.16 144.864 142.336 128c97.376-38.88 198.656-88.512 217.344-32 16.704 50.56 194.656 608 194.656 608s209.344-73.664 266.656-89.664 76.992-26.656 92 52S956.992 770.336 843.68 807.68z"/>
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-lg">LanShare</h1>
              <p className="text-xs text-muted-foreground">局域网传输</p>
            </div>
          </div>

          {/* 移动端关闭按钮 */}
          {isMobile && onClose && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>

      {/* 连接状态 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'
            }`} />
          <span className="text-sm text-muted-foreground">
            {connected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      {/* 频道列表 */}
      <div className="flex-1 p-4 overflow-y-auto" onClick={handleClickOutside}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground">频道</h2>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              setShowAddInput(true)
            }}
            className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </motion.button>
        </div>

        {/* 添加频道输入框 */}
        {showAddInput && (
          <div className="mb-3 p-2 border border-border rounded-lg">
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="输入频道名称"
              className="w-full px-2 py-1 text-sm bg-transparent border-none outline-none"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddChannel()
                } else if (e.key === 'Escape') {
                  setShowAddInput(false)
                  setNewChannelName('')
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex justify-end space-x-1 mt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  cancelEditChannel()
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <XCircle className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddChannel()
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Check className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {channels.map((channel) => (
            <div key={channel} className="relative">
              {editingChannel === channel ? (
                /* 编辑模式 */
                <div className="flex items-center space-x-2 px-3 py-3 rounded-lg border border-border">
                  <Hash className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 text-sm bg-transparent border-none outline-none"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveEditChannel()
                      } else if (e.key === 'Escape') {
                        cancelEditChannel()
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex space-x-1">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        cancelEditChannel()
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <XCircle className="w-3 h-3" />
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        saveEditChannel()
                      }}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Check className="w-3 h-3" />
                    </motion.button>
                  </div>
                </div>
              ) : (
                /* 正常显示模式 */
                <motion.button
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleChannelChange(channel)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, channel)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors group ${currentChannel === channel
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    }`}
                >
                  <div className="flex items-center space-x-2">
                    <Hash className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{getChannelDisplayName(channel)}</span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleContextMenu(e, channel)
                    }}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded transition-opacity"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </motion.button>
                </motion.button>
              )}
            </div>
          ))}
        </div>

        {/* 右键菜单 */}
        {showContextMenu && (
          <div
            className="fixed bg-popover border border-border rounded-lg shadow-lg py-2 z-50"
            style={{
              left: Math.min(contextMenuPosition.x, window.innerWidth - 150),
              top: Math.min(contextMenuPosition.y, window.innerHeight - 100)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => startEditChannel(showContextMenu)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>重命名</span>
            </button>
            {showContextMenu !== 'default' && (
              <button
                onClick={() => deleteChannel(showContextMenu)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center space-x-2 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-border">
        <div className="flex justify-between items-center">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </motion.button>
          
          {/* 版本号显示 */}
          <div className="text-xs text-muted-foreground">
            {version}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar