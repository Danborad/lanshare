import React from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Wifi, 
  Info,
  Settings,
  Moon,
  Sun
} from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import { useTheme } from '../contexts/ThemeContext'

const MobileNav = ({ onToggleSidebar, onToggleConnectionInfo }) => {
  const { connected } = useSocket()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between md:hidden">
      {/* 左侧：菜单和状态 */}
      <div className="flex items-center space-x-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </motion.button>
        
        <div className="flex items-center space-x-2">
          {/* LanShare 图标 */}
          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 fill-current text-black dark:text-white"
            >
              <path d="M852 0 172 0C77.408 0 0 77.408 0 172l0 680c0 94.592 77.408 172 172 172l680 0c94.592 0 172-77.408 172-172L1024 172C1024 77.408 946.592 0 852 0zM843.68 807.68c-113.344 37.344-334.656 110.016-376 120.32s-84 27.68-108-41.664c0 0-204-602.656-222.656-656S100.16 144.864 142.336 128c97.376-38.88 198.656-88.512 217.344-32 16.704 50.56 194.656 608 194.656 608s209.344-73.664 266.656-89.664 76.992-26.656 92 52S956.992 770.336 843.68 807.68z"/>
            </svg>
          </div>
          <div>
            <h1 className="font-semibold text-sm">LanShare</h1>
          </div>
        </div>
        
        {/* 连接状态指示器 */}
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-muted-foreground">
            {connected ? '已连接' : '未连接'}
          </span>
        </div>
      </div>

      {/* 右侧：连接信息和设置 */}
      <div className="flex items-center space-x-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </motion.button>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onToggleConnectionInfo}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Info className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  )
}

export default MobileNav