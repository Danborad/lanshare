import React, { useState, useEffect } from 'react'
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
  XCircle,
  Globe,
  User,
  Download,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'
import { channelAPI, systemAPI } from '../utils/api'

const Sidebar = ({ isMobile = false, onClose, onSettingsClick }) => {
  const { theme, toggleTheme } = useTheme()
  const { connected, currentChannel, joinChannel } = useSocket()

  // 频道列表状态 - 只使用全局模式
  const [channels, setChannels] = useState(['default'])
  const [loading, setLoading] = useState(false)

  // 全局频道：从后端API获取
  const loadGlobalChannels = async () => {
    try {
      setLoading(true)
      const response = await channelAPI.getChannels()
      // 正确访问响应数据 - axios响应格式
      return response.channels || response.data?.channels || ['default']
    } catch (error) {
      console.error('获取全局频道失败:', error)
      toast.error('获取频道列表失败')
      return ['default']
    } finally {
      setLoading(false)
    }
  }

  // 初始化加载 - 只使用全局模式
  useEffect(() => {
    loadGlobalChannels().then(setChannels)
  }, [])

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

  // 添加新频道 - 只使用全局模式
  const handleAddChannel = async () => {
    const name = newChannelName.trim()
    if (!name) {
      toast.error('频道名称不能为空')
      return
    }

    if (channels.includes(name)) {
      toast.error('频道已存在')
      return
    }

    try {
      // 全局模式：调用后端API创建频道
      await channelAPI.createChannel(name)
      
      // 重新加载频道列表
      const updatedChannels = await loadGlobalChannels()
      setChannels(updatedChannels)

      setNewChannelName('')
      setShowAddInput(false)
      toast.success(`频道 "${name}" 已创建`)
      joinChannel(name)
    } catch (error) {
      console.error('创建频道失败:', error)
      toast.error('创建频道失败')
    }
  }

  // 开始编辑频道名称
  const startEditChannel = (channel) => {
    setEditingChannel(channel)
    setEditingName(getChannelDisplayName(channel))
    setShowContextMenu(null)
  }

  // 保存编辑
  const saveEditChannel = async () => {
    const newName = editingName.trim()
    if (newName && newName !== editingChannel) {
      if (channels.includes(newName)) {
        toast.error('频道名称已存在')
        return
      }

      try {
        // 调用后端API重命名频道
        await channelAPI.renameChannel(editingChannel, newName)
        
        // 重新加载频道列表
        const updatedChannels = await loadGlobalChannels()
        setChannels(updatedChannels)

        // 如果当前频道被重命名，更新当前频道
        if (currentChannel === editingChannel) {
          joinChannel(newName)
        }

        toast.success(`频道已重命名为 "${newName}"`)
      } catch (error) {
        console.error('重命名频道失败:', error)
        if (error.response?.status === 401) {
          // 处理未授权错误
          toast.error('需要密码验证')
          // 触发密码验证界面
          localStorage.removeItem('lanshare_auth')
          window.location.reload()
        } else {
          toast.error(error.message || '重命名频道失败')
        }
      }
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
  const deleteChannel = async (channel) => {
    if (channel === 'default') {
      toast.error('默认列表不能删除')
      return
    }

    if (channels.length <= 1) {
      toast.error('至少需要保留一个频道')
      return
    }

    try {
      // 使用channelAPI删除频道，会自动包含认证头
      await channelAPI.deleteChannel(channel)
      
      // 重新加载频道列表
      const updatedChannels = await loadGlobalChannels()
      setChannels(updatedChannels)

      // 如果删除的是当前频道，切换到默认频道
      if (currentChannel === channel) {
        joinChannel('default')
      }

      setShowContextMenu(null)
      toast.success(`频道 "${getChannelDisplayName(channel)}" 已删除`)
    } catch (error) {
      console.error('删除频道失败:', error)
      if (error.response?.status === 401) {
        // 处理未授权错误
        toast.error('需要密码验证')
        // 触发密码验证界面
        localStorage.removeItem('lanshare_auth')
        window.location.reload()
      } else {
        toast.error(error.message || '删除频道失败')
      }
    }
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
  const [versionInfo, setVersionInfo] = useState(null)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)

  // 获取版本信息
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const data = await systemAPI.getVersion()
        setVersion(data.version || 'v1.0.0')
        setVersionInfo(data)
      } catch (error) {
        console.error('获取版本信息失败:', error)
        setVersion('v1.0.0')
      }
    }
    fetchVersion()
  }, [])

  // 检查更新
  const handleCheckUpdate = async () => {
    if (checkingUpdate) return
    
    setCheckingUpdate(true)
    try {
      const data = await systemAPI.checkUpdate()
      setUpdateInfo(data)
      setShowUpdateModal(true)
    } catch (error) {
      console.error('检查更新失败:', error)
      toast.error('检查更新失败: ' + (error.message || '网络连接异常'))
    } finally {
      setCheckingUpdate(false)
    }
  }

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
          <div className="flex items-center space-x-2">
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
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSettingsClick}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
          
          {/* 版本号显示 - 可点击检查更新 */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCheckUpdate}
            disabled={checkingUpdate}
            className="flex items-center space-x-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="点击检查更新"
          >
            {checkingUpdate && <RefreshCw className="w-3 h-3 animate-spin" />}
            <span>{version}</span>
          </motion.button>
        </div>
      </div>

      {/* 更新检查弹窗 */}
      {showUpdateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowUpdateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">检查更新</h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="p-1 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateInfo?.error ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-2">检查更新失败</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {updateInfo.message}
                </p>
                <button
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {checkingUpdate ? '检查中...' : '重试'}
                </button>
              </div>
            ) : updateInfo?.has_update ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium mb-2">发现新版本！</p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo.current_version}
                  <br />
                  最新版本: <span className="text-green-600 font-medium">{updateInfo.latest_version}</span>
                </p>
                
                {updateInfo.release_name && (
                  <p className="text-sm font-medium mb-2">{updateInfo.release_name}</p>
                )}
                
                {updateInfo.release_notes && (
                  <div className="bg-accent/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">更新说明:</p>
                    <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {updateInfo.release_notes}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    稍后更新
                  </button>
                  {updateInfo.download_url && (
                    <button
                      onClick={() => window.open(updateInfo.download_url, '_blank')}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>立即更新</span>
                    </button>
                  )}
                </div>
              </div>
            ) : updateInfo?.mode === 'local' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-blue-500" />
                </div>
                <p className="font-medium mb-2">本地部署版本</p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo?.current_version || version}
                  <br />
                  {versionInfo?.build_date && (
                    <span className="text-xs">构建时间: {versionInfo.build_date}</span>
                  )}
                </p>
                {updateInfo.release_notes && (
                  <div className="bg-accent/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">说明:</p>
                    <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {updateInfo.release_notes}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  知道了
                </button>
              </div>
            ) : updateInfo?.mode === 'no_releases' ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="font-medium mb-2">开发版本</p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo?.current_version || version}
                  <br />
                  {versionInfo?.build_date && (
                    <span className="text-xs">构建时间: {versionInfo.build_date}</span>
                  )}
                </p>
                {updateInfo.release_notes && (
                  <div className="bg-accent/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">说明:</p>
                    <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {updateInfo.release_notes}
                    </p>
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    知道了
                  </button>
                  {updateInfo.download_url && (
                    <button
                      onClick={() => window.open(updateInfo.download_url, '_blank')}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>访问仓库</span>
                    </button>
                  )}
                </div>
              </div>
            ) : updateInfo?.mode === 'docker_hub' ? (
              <div className="text-center">
                <div className={`w-12 h-12 ${updateInfo.has_update ? 'bg-blue-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Globe className={`w-6 h-6 ${updateInfo.has_update ? 'text-blue-500' : 'text-green-500'}`} />
                </div>
                <p className="font-medium mb-2">
                  {updateInfo.has_update ? 'Docker Hub 发现新版本！' : 'Docker Hub 已是最新版本'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo.current_version}
                  {updateInfo.has_update && (
                    <>
                      <br />
                      最新版本: <span className="text-blue-600 font-medium">{updateInfo.latest_version}</span>
                    </>
                  )}
                </p>
                
                {updateInfo.release_notes && (
                  <div className="bg-accent/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">Docker Hub 信息:</p>
                    <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {updateInfo.release_notes}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    {updateInfo.has_update ? '稍后更新' : '知道了'}
                  </button>
                  {updateInfo.download_url && (
                    <button
                      onClick={() => window.open(updateInfo.download_url, '_blank')}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>查看镜像</span>
                    </button>
                  )}
                </div>
              </div>
            ) : updateInfo?.mode === 'github_tags' ? (
              <div className="text-center">
                <div className={`w-12 h-12 ${updateInfo.has_update ? 'bg-purple-100' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Globe className={`w-6 h-6 ${updateInfo.has_update ? 'text-purple-500' : 'text-green-500'}`} />
                </div>
                <p className="font-medium mb-2">
                  {updateInfo.has_update ? 'GitHub 发现新标签！' : 'GitHub Tags 已是最新版本'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo.current_version}
                  {updateInfo.has_update && (
                    <>
                      <br />
                      最新版本: <span className="text-purple-600 font-medium">{updateInfo.latest_version}</span>
                    </>
                  )}
                </p>
                
                {updateInfo.release_notes && (
                  <div className="bg-accent/50 rounded-lg p-3 mb-4 text-left">
                    <p className="text-xs text-muted-foreground mb-1">GitHub Tags 信息:</p>
                    <p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {updateInfo.release_notes}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    {updateInfo.has_update ? '稍后更新' : '知道了'}
                  </button>
                  {updateInfo.download_url && (
                    <button
                      onClick={() => window.open(updateInfo.download_url, '_blank')}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>查看标签</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <p className="font-medium mb-2">已是最新版本</p>
                <p className="text-sm text-muted-foreground mb-4">
                  当前版本: {updateInfo?.current_version || version}
                  <br />
                  {versionInfo?.build_date && (
                    <span className="text-xs">构建时间: {versionInfo.build_date}</span>
                  )}
                </p>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  知道了
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Sidebar