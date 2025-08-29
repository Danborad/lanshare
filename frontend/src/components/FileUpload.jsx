import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, File, X } from 'lucide-react'
import { fileAPI } from '../utils/api'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'

const FileUpload = ({ onUploadSuccess, selectedFiles: externalSelectedFiles, uploading: externalUploading, onStateChange }) => {
  // 使用外部状态，如果没有则使用内部状态
  const [internalSelectedFiles, setInternalSelectedFiles] = useState([])
  const [internalUploading, setInternalUploading] = useState(false)
  
  // 使用外部状态或内部状态
  const selectedFiles = externalSelectedFiles || internalSelectedFiles
  const uploading = externalUploading !== undefined ? externalUploading : internalUploading
  
  // 更新状态的函数
  const updateState = (newState) => {
    if (onStateChange) {
      onStateChange(newState)
    } else {
      // 如果没有外部状态管理，使用内部状态
      if (newState.selectedFiles !== undefined) {
        setInternalSelectedFiles(newState.selectedFiles)
      }
      if (newState.uploading !== undefined) {
        setInternalUploading(newState.uploading)
      }
    }
  }

  const { currentChannel } = useSocket()

  const onDrop = useCallback((acceptedFiles) => {
    const newSelectedFiles = [...selectedFiles, ...acceptedFiles]
    updateState({ selectedFiles: newSelectedFiles })
  }, [selectedFiles, updateState])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 1024 * 1024 * 1024, // 1GB
  })

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('请先选择文件')
      return
    }

    updateState({ uploading: true })

    for (const file of selectedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('channel', currentChannel)
        formData.append('uploader_name', '用户') // 可以改为用户输入

        await fileAPI.uploadFile(formData)
        toast.success(`${file.name} 上传成功`)

      } catch (error) {
        console.error('上传失败:', error)
        // 显示更详细的错误信息
        let errorMessage = `${file.name} 上传失败`
        if (error && typeof error === 'object') {
          if (error.error) {
            errorMessage = `${file.name}: ${error.error}`
          } else if (error.message) {
            errorMessage = `${file.name}: ${error.message}`
          }
        } else if (typeof error === 'string') {
          errorMessage = `${file.name}: ${error}`
        }
        toast.error(errorMessage, { duration: 5000 })
      }
    }

    updateState({ uploading: false, selectedFiles: [] })
    onUploadSuccess && onUploadSuccess()
  }

  const removeFile = (index) => {
    const newSelectedFiles = selectedFiles.filter((_, i) => i !== index)
    updateState({ selectedFiles: newSelectedFiles })
  }

  return (
    <div className="p-4 md:p-6 border-b border-border">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-4">内容传输</h2>

        {/* 拖拽上传区域 */}
        <motion.div
          {...getRootProps()}
          whileHover={{ scale: 1.02 }}
          className={`border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer transition-colors ${isDragActive
            ? 'border-primary bg-primary/5 drag-active'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
            }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-4 text-muted-foreground" />

          {isDragActive ? (
            <div>
              <p className="text-base md:text-lg font-medium text-primary">释放文件以开始上传</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                支持多文件拖拽上传
              </p>
            </div>
          ) : (
            <div>
              <p className="text-base md:text-lg font-medium">
                <span className="hidden md:inline">拖拽文件到此处，或</span>点击选择文件
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                支持文档、图片、视频、音频等多种格式，无文件大小限制
              </p>
            </div>
          )}
        </motion.div>

        {/* 已选择的文件列表 */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 md:mt-6">
            <h3 className="text-sm font-medium mb-3">已选择文件 ({selectedFiles.length})</h3>
            <div className="space-y-2 max-h-32 md:max-h-40 overflow-y-auto custom-scrollbar">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-2 md:p-3 bg-accent/50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <File className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* 上传按钮 */}
            <div className="flex justify-end mt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={uploadFiles}
                disabled={uploading}
                className="px-4 py-2 md:px-6 md:py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm md:text-base"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>开始上传</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileUpload