import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { io } from 'socket.io-client'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import ConnectionInfo from './components/ConnectionInfo'
import MobileNav from './components/MobileNav'
import FirstTimeSetup from './components/FirstTimeSetup'
import Settings from './components/Settings'
import PasswordAuth from './components/PasswordAuth'
import { ThemeProvider } from './contexts/ThemeContext'
import { SocketProvider } from './contexts/SocketContext'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isConnectionInfoOpen, setIsConnectionInfoOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState({ onlineUsers: 0, totalFiles: 0 })
  const [showSetup, setShowSetup] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPasswordAuth, setShowPasswordAuth] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // md断点
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // 检查是否需要首次设置和密码验证
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/settings/setup-status')
        const data = await response.json()
        if (data.needsSetup) {
          setShowSetup(true)
        } else {
          setIsSetupComplete(true)
          checkPasswordRequirement()
        }
      } catch (error) {
        console.error('检查设置状态失败:', error)
        setIsSetupComplete(true)
        setIsAuthenticated(true) // 出错时允许继续访问
      }
    }

    const checkPasswordRequirement = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        
        if (data.passwordEnabled) {
          // 检查是否已认证
          const token = localStorage.getItem('lanshare_auth')
          if (token === 'authenticated') {
            // 验证token有效性
            try {
              const verifyResponse = await fetch('/api/files')
              if (verifyResponse.status === 401) {
                setShowPasswordAuth(true)
              } else {
                setIsAuthenticated(true)
              }
            } catch {
              setShowPasswordAuth(true)
            }
          } else {
            setShowPasswordAuth(true)
          }
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('检查密码设置失败:', error)
        setIsAuthenticated(true) // 出错时允许继续访问
      }
    }

    checkSetupStatus()
  }, [])

  // 移动端关闭侧边栏
  const closeSidebar = () => setIsSidebarOpen(false)
  const closeConnectionInfo = () => setIsConnectionInfoOpen(false)
  
  // 统计数据更新
  const handleStatsUpdate = (newStats) => {
    setStats(newStats)
  }

  const handleSetupComplete = () => {
    setShowSetup(false)
    setIsSetupComplete(true)
    
    // 设置完成后检查是否需要密码验证
    setTimeout(async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        
        if (data.passwordEnabled) {
          // 如果启用了密码，显示密码验证界面
          setShowPasswordAuth(true)
        } else {
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('设置完成后检查密码状态失败:', error)
        setIsAuthenticated(true)
      }
    }, 500)
  }

  const handleAuthenticated = () => {
    setShowPasswordAuth(false)
    setIsAuthenticated(true)
    // 重新加载页面以确保所有API调用都使用新的认证状态
    window.location.reload()
  }

  return (
    <ThemeProvider>
      <SocketProvider>
        <Router>
          <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* 首次设置向导 */}
          {showSetup && <FirstTimeSetup onComplete={handleSetupComplete} />}
          
          {/* 密码验证 */}
          {showPasswordAuth && <PasswordAuth onAuthenticated={handleAuthenticated} />}
          
          {/* 设置页面 */}
          {showSettings && (
            <Settings 
              onClose={() => setShowSettings(false)} 
            />
          )}
          
          {/* 主应用界面 */}
          {isSetupComplete && isAuthenticated && (
              <>
                {/* 桌面端侧边栏 */}
                {!isMobile && <Sidebar onSettingsClick={() => setShowSettings(true)} />}
                
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
                      <Sidebar isMobile={true} onClose={closeSidebar} onSettingsClick={() => setShowSettings(true)} />
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