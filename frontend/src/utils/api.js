import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error.response?.data || error.message)
  }
)

// 系统信息API
export const systemAPI = {
  getInfo: () => api.get('/system/info'),
  generateQRCode: (ip, port = 7070) => api.post('/system/qrcode', { ip, port }),
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
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
}

// 消息API
export const messageAPI = {
  getMessages: (channel = 'default') => api.get(`/messages?channel=${channel}`),
  sendMessage: (data) => api.post('/messages', data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
}

export default api