import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Eye, RefreshCw } from 'lucide-react';
import NewFilePreview from './NewFilePreview';

const DebugPreview = () => {
  const [testFile, setTestFile] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // 创建测试文件对象
  const createTestFile = (type) => {
    const testFiles = {
      image: {
        id: 1,
        filename: 'test-image.jpg',
        file_type: 'image',
        file_size: 1024000,
        download_url: '/api/files/1/download'
      },
      video: {
        id: 2,
        filename: 'test-video.mp4',
        file_type: 'video',
        file_size: 5242880,
        download_url: '/api/files/2/download'
      },
      audio: {
        id: 3,
        filename: 'test-audio.mp3',
        file_type: 'audio',
        file_size: 2097152,
        download_url: '/api/files/3/download'
      }
    };

    return testFiles[type];
  };

  const handleTestPreview = (type) => {
    const file = createTestFile(type);
    setTestFile(file);
    setIsPreviewOpen(true);
    setDebugInfo(`测试${type}文件预览 - ID: ${file.id}, 文件名: ${file.filename}, 大小: ${file.file_size} bytes`);
  };

  const handleRealFilePreview = async () => {
    try {
      setDebugInfo('正在获取真实文件列表...');
      const response = await fetch('/api/files');
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        const firstFile = data.files[0];
        setTestFile(firstFile);
        setIsPreviewOpen(true);
        setDebugInfo(`使用真实文件预览 - ID: ${firstFile.id}, 文件名: ${firstFile.filename}, 类型: ${firstFile.file_type}, 大小: ${firstFile.file_size} bytes`);
      } else {
        setDebugInfo('没有找到文件，请先上传文件');
      }
    } catch (error) {
      setDebugInfo(`获取文件列表失败: ${error.message}`);
    }
  };

  const handleTestPreviewUrl = () => {
    if (testFile) {
      const previewUrl = `/api/files/${testFile.id}/preview`;
      setDebugInfo(`预览URL: ${previewUrl}`);
      
      // 测试URL是否可访问
      fetch(previewUrl, { method: 'HEAD' })
        .then(response => {
          setDebugInfo(prev => prev + `\nURL测试: ${response.status} ${response.statusText}`);
        })
        .catch(error => {
          setDebugInfo(prev => prev + `\nURL测试失败: ${error.message}`);
        });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">文件预览调试工具</h1>
      
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">测试预览功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <button
            onClick={() => handleTestPreview('image')}
            className="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Eye className="w-6 h-6 mx-auto mb-2" />
            测试图片预览
          </button>
          
          <button
            onClick={() => handleTestPreview('video')}
            className="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Eye className="w-6 h-6 mx-auto mb-2" />
            测试视频预览
          </button>
          
          <button
            onClick={() => handleTestPreview('audio')}
            className="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Eye className="w-6 h-6 mx-auto mb-2" />
            测试音频预览
          </button>
          
          <button
            onClick={handleRealFilePreview}
            className="p-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <RefreshCw className="w-6 h-6 mx-auto mb-2" />
            使用真实文件
          </button>
        </div>
        
        <button
          onClick={handleTestPreviewUrl}
          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
        >
          测试预览URL
        </button>
      </div>

      {debugInfo && (
        <div className="bg-muted border border-border rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">调试信息</h3>
          <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">当前测试文件</h2>
        {testFile ? (
          <div className="space-y-2">
            <p><strong>ID:</strong> {testFile.id}</p>
            <p><strong>文件名:</strong> {testFile.filename}</p>
            <p><strong>类型:</strong> {testFile.file_type}</p>
            <p><strong>大小:</strong> {testFile.file_size} bytes</p>
            <p><strong>下载URL:</strong> {testFile.download_url}</p>
          </div>
        ) : (
          <p className="text-muted-foreground">暂无测试文件</p>
        )}
      </div>

      {/* 文件预览组件 */}
      <NewFilePreview
        file={testFile}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setDebugInfo(prev => prev + '\n预览已关闭');
        }}
      />
    </div>
  );
};

export default DebugPreview;