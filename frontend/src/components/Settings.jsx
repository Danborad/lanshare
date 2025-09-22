import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Unlock, Save, Eye, EyeOff, LogOut } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { channelAPI } from '../utils/api'
import { clearAuthToken } from '../utils/api'

const Settings = ({ onClose }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordMode, setIsPasswordMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPasswordVerify, setShowPasswordVerify] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [isModifyingPassword, setIsModifyingPassword] = useState(false)

  // 加载当前密码设置
  useEffect(() => {
    const loadPasswordSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        const data = await response.json()
        setIsPasswordMode(data.passwordEnabled || false)
      } catch (error) {
        console.error('加载密码设置失败:', error)
      }
    }
    loadPasswordSettings()
  }, [])

  // 处理密码模式切换
  const handlePasswordModeToggle = (newMode) => {
    if (!newMode && isPasswordMode) {
      // 从启用切换到禁用，需要验证当前密码
      setShowPasswordVerify(true)
      setCurrentPassword('') // 清空当前密码输入
    } else if (newMode && !isPasswordMode) {
      // 从禁用切换到启用
      setIsPasswordMode(true)
    }
    setPassword('')
    setConfirmPassword('')
  }

  // 验证当前密码并关闭密码保护
  const handleVerifyAndDisable = async () => {
    if (!currentPassword) {
      toast.error('请输入当前密码')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordEnabled: false,
          password: null,
          currentPassword: currentPassword // 添加当前密码验证
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('密码保护已关闭')
        setIsPasswordMode(false)
        setShowPasswordVerify(false)
        setCurrentPassword('')
        setPassword('')
        setConfirmPassword('')
        onClose()
      } else {
        toast.error(data.error || '密码错误')
      }
    } catch (error) {
      console.error('验证密码失败:', error)
      toast.error('验证失败')
    } finally {
      setLoading(false)
    }
  }

  // 修改密码
  const handleModifyPassword = async () => {
    if (!currentPassword) {
      toast.error('请输入当前密码')
      return
    }

    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (password.length < 4) {
      toast.error('密码长度至少为4位')
      return
    }

    setLoading(true)
    try {
      const modifyResponse = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordEnabled: true,
          password: password,
          currentPassword: currentPassword
        })
      })

      const modifyData = await modifyResponse.json()
      
      if (modifyResponse.ok) {
        toast.success('密码已修改')
        setPassword('')
        setConfirmPassword('')
        setCurrentPassword('')
        setIsModifyingPassword(false)
        onClose()
      } else {
        toast.error(modifyData.error || '修改密码失败')
      }
    } catch (error) {
      console.error('修改密码失败:', error)
      toast.error('修改密码失败')
    } finally {
      setLoading(false)
    }
  }

  // 保存密码设置
  const handleSavePassword = async () => {
    if (isPasswordMode && password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (isPasswordMode && password.length < 4) {
      toast.error('密码长度至少为4位')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          passwordEnabled: isPasswordMode,
          password: isPasswordMode ? password : null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('设置已保存')
        setPassword('')
        setConfirmPassword('')
        onClose()
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存密码设置失败:', error)
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }



  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5" />
            后台设置
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 密码保护开关 */}
          <div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium">启用密码保护</span>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isPasswordMode}
                  onChange={(e) => handlePasswordModeToggle(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${
                  isPasswordMode ? 'bg-primary' : 'bg-gray-200'
                }`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform transform ${
                    isPasswordMode ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
                </div>
              </div>
            </label>
          </div>

          {/* 修改密码按钮 */}
          {isPasswordMode && !isModifyingPassword && (
            <button
              onClick={() => {
                setIsModifyingPassword(true)
                setCurrentPassword('')
                setPassword('')
                setConfirmPassword('')
              }}
              className="w-full px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors text-sm"
            >
              修改密码
            </button>
          )}

          {/* 密码输入区域 */}
          <div className="space-y-4">
            {/* 启用密码保护时的设置区域 */}
            {isPasswordMode && !isModifyingPassword && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">确认密码</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* 修改密码时的设置区域 */}
            {isPasswordMode && isModifyingPassword && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">当前密码</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="输入当前密码"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">新密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入新密码"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">确认新密码</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入新密码"
                      className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={isModifyingPassword ? handleModifyPassword : handleSavePassword}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : isModifyingPassword ? '修改密码' : '保存设置'}
            </button>
            {isModifyingPassword && (
              <button
                onClick={() => {
                  setIsModifyingPassword(false)
                  setPassword('')
                  setConfirmPassword('')
                  setCurrentPassword('')
                }}
                className="px-4 py-2 border border-border text-muted-foreground rounded-md hover:text-foreground"
              >
                取消
              </button>
            )}
            <button
              onClick={() => {
                clearAuthToken()
                window.location.reload()
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-muted-foreground rounded-md hover:text-foreground"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* 提示信息 */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 密码长度至少4位</p>
            <p>• 关闭密码保护后，任何人都可以访问后台</p>
            <p>• 设置将在所有设备同步</p>
          </div>
        </div>
      </motion.div>

      {/* 密码验证模态框 */}
      {showPasswordVerify && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowPasswordVerify(false)}
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="bg-card border border-border rounded-lg p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">验证密码</h3>
              <button
                onClick={() => setShowPasswordVerify(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                关闭密码保护需要验证当前密码
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">当前密码</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="输入当前密码"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordVerify(false)}
                  className="flex-1 px-4 py-2 border border-border text-muted-foreground rounded-md hover:text-foreground"
                >
                  取消
                </button>
                <button
                  onClick={handleVerifyAndDisable}
                  disabled={loading || !currentPassword}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50"
                >
                  {loading ? '验证中...' : '确认关闭'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default Settings