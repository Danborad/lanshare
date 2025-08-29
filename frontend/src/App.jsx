import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { io } from 'socket.io-client'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ConnectionInfo from './components/ConnectionInfo'
import MobileNav from './components/MobileNav'
import { ThemeProvider } from './contexts/ThemeContext'
import { SocketProvider } from './contexts/SocketContext'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isConnectionInfoOpen, setIsConnectionInfoOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState({ onlineUsers: 0, totalFiles: 0 })

  // 检测是否为移动设备
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md断点
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // 移动端关闭侧边栏
  const closeSidebar = () => setIsSidebarOpen(false)
  const closeConnectionInfo = () => setIsConnectionInfoOpen(false)
  
  // 统计数据更新
  const handleStatsUpdate = (newStats) => {
    setStats(newStats)
  }

  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* 桌面端侧边栏 */}
            {!isMobile && <Sidebar />}
            
            {/* 移动端侧边栏抽屉 */}
            {isMobile && (
              <>
                {/* 遮罩层 */}
                {isSidebarOpen && (
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeSidebar}
                  />
                )}
                
                {/* 侧边栏抽屉 */}
                <div className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                  isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                  <Sidebar isMobile={true} onClose={closeSidebar} />
                </div>
              </>
            )}
            
            {/* 主内容区 */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* 移动端顶部导航 */}
              {isMobile && (
                <MobileNav 
                  onToggleSidebar={() => setIsSidebarOpen(true)}
                  onToggleConnectionInfo={() => setIsConnectionInfoOpen(true)}
                />
              )}
              
              <MainContent onStatsUpdate={handleStatsUpdate} />
            </div>
            
            {/* 桌面端连接信息面板 */}
            {!isMobile && <ConnectionInfo onlineUsers={stats.onlineUsers} totalFiles={stats.totalFiles} />}
            
            {/* 移动端连接信息抽屉 */}
            {isMobile && (
              <>
                {/* 遮罩层 */}
                {isConnectionInfoOpen && (
                  <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeConnectionInfo}
                  />
                )}
                
                {/* 连接信息抽屉 */}
                <div className={`fixed right-0 top-0 h-full z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
                  isConnectionInfoOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                  <ConnectionInfo isMobile={true} onClose={closeConnectionInfo} onlineUsers={stats.onlineUsers} totalFiles={stats.totalFiles} />
                </div>
              </>
            )}
            
            <Toaster 
              position={isMobile ? "top-center" : "top-right"}
              toastOptions={{
                className: isMobile ? 'text-sm' : '',
              }}
            />
          </div>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  )
}

export default App