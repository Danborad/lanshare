import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  QrCode, 
  Wifi, 
  Check, 
  Smartphone,
  Monitor,
  RefreshCw,
  ChevronDown,
  Network,
  X
} from 'lucide-react'
import { systemAPI } from '../utils/api'
import { copyToClipboard } from '../utils'
import toast from 'react-hot-toast'

const ConnectionInfo = ({ isMobile = false, onClose, onlineUsers = 0, totalFiles = 0 }) => {
  const [systemInfo, setSystemInfo] = useState(null)
  const [availableIPs, setAvailableIPs] = useState([])
  const [selectedIP, setSelectedIP] = useState('')
  const [currentQRCode, setCurrentQRCode] = useState('')
  const [currentURL, setCurrentURL] = useState('')
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showIPDropdown, setShowIPDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadSystemInfo = async () => {
    try {
      setLoading(true)
      const info = await systemAPI.getInfo()
      setSystemInfo(info)
      setAvailableIPs(info.available_ips || [])
      
      // 设置默认选中IP
      const defaultIP = info.recommended_ip || (info.available_ips && info.available_ips[0]?.ip) || 'localhost'
      setSelectedIP(defaultIP)
      
      // 生成默认URL和二维码
      await generateQRCodeForIP(defaultIP, info.port)
      
    } catch (error) {
      console.error('获取系统信息失败:', error)
      toast.error('获取系统信息失败')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCodeForIP = async (ip, port = 7070) => {
    try {
      const result = await systemAPI.generateQRCode(ip, port)
      setCurrentQRCode(result.qr_code)
      setCurrentURL(result.url)
    } catch (error) {
      console.error('生成二维码失败:', error)
      toast.error('生成二维码失败')
    }
  }

  const handleIPChange = async (ip) => {
    setSelectedIP(ip)
    setShowIPDropdown(false)
    await generateQRCodeForIP(ip, systemInfo?.port || 7070)
    toast.success(`已切换到 ${ip}`)
  }

  const getIPTypeIcon = (type) => {
    switch (type) {
      case 'lan':
      case 'interface':
        return <Wifi className="w-4 h-4 text-green-500" />
      case 'host':
        return <Monitor className="w-4 h-4 text-blue-500" />
      case 'docker':
        return <Network className="w-4 h-4 text-purple-500" />
      case 'gateway':
        return <Wifi className="w-4 h-4 text-orange-500" />
      case 'inferred':
      case 'inferred_server':
        return <Network className="w-4 h-4 text-cyan-500" />
      case 'client_network':
        return <Wifi className="w-4 h-4 text-blue-400" />
      case 'localhost':
        return <Monitor className="w-4 h-4 text-gray-500" />
      default:
        return <Network className="w-4 h-4 text-gray-400" />
    }
  }

  const getIPTypeColor = (type) => {
    switch (type) {
      case 'lan':
      case 'interface':
        return 'text-green-600'
      case 'host':
        return 'text-blue-600'
      case 'docker':
        return 'text-purple-600'
      case 'gateway':
        return 'text-orange-600'
      case 'inferred':
      case 'inferred_server':
        return 'text-cyan-600'
      case 'client_network':
        return 'text-blue-500'
      case 'localhost':
        return 'text-gray-600'
      default:
        return 'text-gray-500'
    }
  }

  useEffect(() => {
    loadSystemInfo()
  }, [])

  const handleCopyUrl = async () => {
    if (!currentURL) return

    try {
      await copyToClipboard(currentURL)
      setCopied(true)
      toast.success('地址已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  if (loading || !systemInfo) {
    return (
      <div className={`bg-card border-l border-border p-6 ${
        isMobile ? 'w-full h-full' : 'w-80'
      }`}>
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
          <div className="h-20 bg-muted rounded mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-card border-l border-border flex flex-col ${
      isMobile ? 'w-full h-full' : 'w-80'
    }`}>
      {/* 头部 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">连接信息</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadSystemInfo}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              title="刷新信息"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
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

        {/* IP选择器 */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Network className="w-4 h-4" />
            <span>网络地址选择</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowIPDropdown(!showIPDropdown)}
              className="w-full bg-background border border-border rounded-lg p-3 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="flex items-center space-x-2">
                {availableIPs.find(ip => ip.ip === selectedIP) && 
                  getIPTypeIcon(availableIPs.find(ip => ip.ip === selectedIP).type)
                }
                <span className="font-mono text-sm">{selectedIP}</span>
                <span className={`text-xs ${getIPTypeColor(availableIPs.find(ip => ip.ip === selectedIP)?.type || 'other')}`}>
                  {availableIPs.find(ip => ip.ip === selectedIP)?.name || '未知'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: showIPDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>

            <motion.div
              initial={false}
              animate={{
                height: showIPDropdown ? 'auto' : 0,
                opacity: showIPDropdown ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 right-0 z-10 overflow-hidden bg-background border border-border rounded-lg mt-1 shadow-lg"
            >
              {showIPDropdown && (
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  {availableIPs.map((ipInfo, index) => (
                    <button
                      key={index}
                      onClick={() => handleIPChange(ipInfo.ip)}
                      className={`w-full p-3 text-left hover:bg-accent transition-colors flex items-center space-x-3 ${
                        selectedIP === ipInfo.ip ? 'bg-accent/50' : ''
                      }`}
                    >
                      {getIPTypeIcon(ipInfo.type)}
                      <div className="flex-1">
                        <div className="font-mono text-sm">{ipInfo.ip}</div>
                        <div className={`text-xs ${getIPTypeColor(ipInfo.type)}`}>{ipInfo.name}</div>
                      </div>
                      {selectedIP === ipInfo.ip && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 局域网地址显示 */}
        <div className="mt-4">
          <div className="bg-background border border-border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono">{currentURL}</code>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopyUrl}
                className="p-1 rounded hover:bg-accent transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>
        </div>


      </div>

      {/* 二维码区域 */}
      <div className="p-6 border-b border-border">
        <button
          onClick={() => setShowQR(!showQR)}
          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span className="font-medium">二维码分享</span>
          </div>
          <motion.div
            animate={{ rotate: showQR ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        <motion.div
          initial={false}
          animate={{
            height: showQR ? 'auto' : 0,
            opacity: showQR ? 1 : 0
          }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          {showQR && currentQRCode && (
            <div className="mt-4 text-center">
              <img
                src={currentQRCode}
                alt="QR Code"
                className="mx-auto bg-white p-2 rounded-lg border"
                style={{ width: '200px', height: '200px' }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                使用手机扫码快速访问
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                当前IP: {selectedIP}
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* 使用说明 */}
      <div className="flex-1 p-6">
        <h4 className="font-medium mb-4">使用说明</h4>
        
        <div className="space-y-4 text-sm">
          <div className="flex items-start space-x-3">
            <Monitor className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">电脑端访问</p>
              <p className="text-muted-foreground">
                在同一局域网内的电脑浏览器中输入上方地址
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">手机端访问</p>
              <p className="text-muted-foreground">
                扫描二维码或在手机浏览器中输入地址
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-3 bg-accent/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💡 确保所有设备连接在同一WiFi网络下
          </p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="p-4 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-primary">{onlineUsers}</div>
            <div className="text-xs text-muted-foreground">用户</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-sm font-bold text-green-600">{totalFiles}</div>
            <div className="text-xs text-muted-foreground">文件</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionInfo