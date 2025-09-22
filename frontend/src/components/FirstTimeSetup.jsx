import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Lock, Unlock, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

const FirstTimeSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1) // 1: 选择模式, 2: 设置密码
  const [usePassword, setUsePassword] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleModeSelection = (usePwd) => {
    setUsePassword(usePwd)
    if (usePwd) {
      setStep(2)
    } else {
      handleComplete()
    }
  }

  const handleComplete = async () => {
    if (usePassword && password !== confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }

    if (usePassword && password.length < 4) {
      toast.error('密码长度至少为4位')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/settings/first-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usePassword: usePassword,
          password: usePassword ? password : null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('设置完成！欢迎使用 LanShare')
        
        // 如果启用了密码，保存认证token到localStorage和axios默认header
        if (usePassword && data.token) {
          localStorage.setItem('lanshare_auth', data.token)
          // 设置Authorization header用于后续API请求
          if (window.axios) {
            window.axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
          }
        }
        
        onComplete()
      } else {
        toast.error(data.error || '设置失败')
      }
    } catch (error) {
      console.error('首次设置失败:', error)
      toast.error('设置失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4"
      >
        {step === 1 ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                欢迎使用 LanShare
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                请选择后台访问模式
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelection(false)}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <Unlock className="w-6 h-6 text-green-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">无需密码</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">任何人都可以访问后台</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeSelection(true)}
                disabled={loading}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <Lock className="w-6 h-6 text-blue-500" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">设置密码</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">需要密码才能访问后台</div>
                  </div>
                </div>
              </motion.button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              您可以在设置中随时更改此选项
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                设置后台密码
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                请输入密码保护后台访问
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  确认密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md"
              >
                返回
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleComplete}
                disabled={loading || !password || !confirmPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? '设置中...' : (
                  <>
                    完成
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default FirstTimeSetup