import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [currentChannel, setCurrentChannel] = useState('default')

  useEffect(() => {
    const socketInstance = io('/', {
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      setConnected(true)
      // 初始连接时加入默认频道
      socketInstance.emit('join_channel', { channel: 'default' })
      // 不显示连接成功的toast，减少干扰
    })

    socketInstance.on('disconnect', () => {
      setConnected(false)
      // 只在真正断开连接时显示错误
      toast.error('与服务器断开连接')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('连接错误:', error)
      toast.error('连接服务器失败')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, []) // 移除currentChannel依赖，避免重新连接

  const joinChannel = (channel) => {
    if (socket && currentChannel !== channel) {
      socket.emit('leave_channel', { channel: currentChannel })
      socket.emit('join_channel', { channel })
      setCurrentChannel(channel)
      // 不显示频道切换的toast，减少干扰
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      currentChannel,
      joinChannel
    }}>
      {children}
    </SocketContext.Provider>
  )
}