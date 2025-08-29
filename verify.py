#!/usr/bin/env python3
"""
LanShare 项目验证脚本
检查所有必要的文件是否存在
"""

import os
import sys
from pathlib import Path

def check_file(file_path, description):
    """检查文件是否存在"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - 文件不存在")
        return False

def check_directory(dir_path, description):
    """检查目录是否存在"""
    if os.path.isdir(dir_path):
        print(f"✅ {description}: {dir_path}")
        return True
    else:
        print(f"❌ {description}: {dir_path} - 目录不存在")
        return False

def main():
    print("🔍 LanShare 项目结构验证")
    print("=" * 50)
    
    # 项目根目录文件
    root_files = [
        ("docker-compose.yml", "Docker Compose 配置"),
        ("README.md", "项目文档"),
        ("start.sh", "Linux启动脚本"),
        ("start.bat", "Windows启动脚本"),
    ]
    
    # 后端文件
    backend_files = [
        ("backend/Dockerfile", "后端Docker配置"),
        ("backend/requirements.txt", "Python依赖"),
        ("backend/app.py", "Flask主应用"),
        ("backend/models.py", "数据模型"),
        ("backend/config.py", "配置文件"),
    ]
    
    # 前端文件
    frontend_files = [
        ("frontend/Dockerfile", "前端Docker配置"),
        ("frontend/nginx.conf", "Nginx配置"),
        ("frontend/package.json", "Node.js依赖"),
        ("frontend/vite.config.js", "Vite配置"),
        ("frontend/tailwind.config.js", "TailwindCSS配置"),
        ("frontend/postcss.config.js", "PostCSS配置"),
        ("frontend/index.html", "HTML模板"),
    ]
    
    # 前端源码文件
    frontend_src_files = [
        ("frontend/src/main.jsx", "React入口"),
        ("frontend/src/App.jsx", "React主应用"),
        ("frontend/src/index.css", "CSS样式"),
    ]
    
    # React组件文件
    react_components = [
        ("frontend/src/components/Sidebar.jsx", "侧边栏组件"),
        ("frontend/src/components/MainContent.jsx", "主内容组件"),
        ("frontend/src/components/FileUpload.jsx", "文件上传组件"),
        ("frontend/src/components/FileList.jsx", "文件列表组件"),
        ("frontend/src/components/MessageArea.jsx", "消息区域组件"),
        ("frontend/src/components/ConnectionInfo.jsx", "连接信息组件"),
    ]
    
    # React上下文文件
    react_contexts = [
        ("frontend/src/contexts/ThemeContext.jsx", "主题上下文"),
        ("frontend/src/contexts/SocketContext.jsx", "Socket上下文"),
    ]
    
    # 工具文件
    utils_files = [
        ("frontend/src/utils/index.js", "通用工具函数"),
        ("frontend/src/utils/api.js", "API工具函数"),
    ]
    
    # 检查所有文件
    all_files = (
        root_files + backend_files + frontend_files + 
        frontend_src_files + react_components + react_contexts + utils_files
    )
    
    print("\n📁 检查项目文件:")
    success_count = 0
    
    for file_path, description in all_files:
        if check_file(file_path, description):
            success_count += 1
    
    # 检查目录结构
    print("\n📂 检查目录结构:")
    directories = [
        ("backend", "后端目录"),
        ("frontend", "前端目录"),
        ("frontend/src", "前端源码目录"),
        ("frontend/src/components", "React组件目录"),
        ("frontend/src/contexts", "React上下文目录"),
        ("frontend/src/utils", "工具函数目录"),
    ]
    
    for dir_path, description in directories:
        if check_directory(dir_path, description):
            success_count += 1
    
    # 统计结果
    total_items = len(all_files) + len(directories)
    print("\n" + "=" * 50)
    print(f"📊 验证完成: {success_count}/{total_items} 项通过")
    
    if success_count == total_items:
        print("🎉 项目结构验证成功！所有文件和目录都已正确创建。")
        print("\n🚀 您现在可以使用以下命令启动项目:")
        print("   Windows: start.bat")
        print("   Linux/Mac: ./start.sh")
        print("   手动启动: docker-compose up -d")
        return True
    else:
        print(f"⚠️  发现 {total_items - success_count} 个问题，请检查缺失的文件。")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)