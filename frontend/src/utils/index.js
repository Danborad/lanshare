import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(dateInput) {
  let date;

  // 处理不同类型的时间输入
  if (typeof dateInput === 'number') {
    // 如果是数字，当作时间戳处理
    date = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    // 处理字符串格式的时间
    if (dateInput.includes('T') && !dateInput.includes('Z') && !dateInput.includes('+')) {
      // 如果是ISO格式但没有时区信息，当作本地时间处理
      date = new Date(dateInput.replace('T', ' '));
    } else {
      date = new Date(dateInput);
    }

    // 如果日期解析失败，尝试其他方式
    if (isNaN(date.getTime())) {
      date = new Date(dateInput.replace('T', ' ').replace('Z', ''));
    }
  } else {
    // 如果已经是Date对象
    date = new Date(dateInput);
  }

  const now = new Date();
  const diffInMinutes = (now - date) / (1000 * 60);

  if (diffInMinutes < 1) {
    return '刚刚';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)} 分钟前`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)} 小时前`;
  } else {
    return format(date, 'MM-dd HH:mm', { locale: zhCN });
  }
}

export function getFileTypeIcon(fileType) {
  const iconMap = {
    image: '🖼️',
    video: '🎬',
    audio: '🎵',
    pdf: '📄',
    document: '📝',
    spreadsheet: '📊',
    presentation: '📈',
    archive: '🗜️',
    file: '📁'
  }

  return iconMap[fileType] || iconMap.file
}

export function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  } else {
    // 降级方案
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'absolute'
    textArea.style.left = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      textArea.remove()
      return Promise.resolve()
    } catch (error) {
      textArea.remove()
      return Promise.reject(error)
    }
  }
}