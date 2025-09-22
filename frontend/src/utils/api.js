import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000, // 增加到60秒支持大文件预览
})

// 获取认证token
export const getAuthToken = () => {
  return sessionStorage.getItem('lanshare_auth')
}

// 设置认证token
export const setAuthToken = (token) => {
  if (token) {
    sessionStorage.setItem('lanshare_auth', token)
  } else {
    sessionStorage.removeItem('lanshare_auth')
  }
}

// 清除认证token
export const clearAuthToken = () => {
  sessionStorage.removeItem('lanshare_auth')
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    
    // 处理401未授权错误
    if (error.response?.status === 401) {
      clearAuthToken()
      window.location.reload() // 重新加载页面触发密码验证
    }
    
    return Promise.reject(error.response?.data || error.message)
  }
)

// 系统信息API
export const systemAPI = {
  getInfo: () => api.get('/system/info'),
  generateQRCode: (ip, port = 7070) => api.post('/system/qrcode', { ip, port }),
  getVersion: () => api.get('/system/version'),
  checkUpdate: () => api.get('/system/check-update')
}

// 文件API
export const fileAPI = {
  getFiles: (channel = 'default') => api.get(`/files?channel=${channel}`),
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      // 这里可以触发进度回调
      console.log(`上传进度: ${percentCompleted}%`)
    },
  }),
  downloadFile: (fileId) => `/api/files/${fileId}/download`,
  previewFile: (fileId) => `/api/files/${fileId}/preview`,
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
}

// 消息API
export const messageAPI = {
  getMessages: (channel = 'default') => api.get(`/messages?channel=${channel}`),
  sendMessage: (data) => api.post('/messages', data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  sendFileMessage: (formData) => {
    return api.post('/messages/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    })
  }
}

// 频道管理API
export const channelAPI = {
  getChannels: () => api.get('/channels'),
  createChannel: (name) => api.post('/channels', { name }),
  deleteChannel: (name) => api.delete(`/channels/${encodeURIComponent(name)}`),
  renameChannel: (oldName, newName) => api.put(`/channels/${encodeURIComponent(oldName)}`, { name: newName }),
}

export default api