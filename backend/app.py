import os
import uuid
import socket
import json
import re
import sys
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file, abort, send_from_directory, Response
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from sqlalchemy import desc, asc
from PIL import Image
import qrcode
from io import BytesIO
import base64
import mimetypes

from config import Config
from models import init_db, FileRecord, Message
import bcrypt

# 配置Flask应用，设置静态文件目录
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = Flask(__name__, static_folder=static_folder, static_url_path='')
app.config.from_object(Config)
CORS(app, origins="*")
# 配置SocketIO，修复生产环境错误
socketio = SocketIO(
    app, 
    cors_allowed_origins="*", 
    async_mode='threading',  # 强制使用threading模式避免生产环境问题
    logger=False, 
    engineio_logger=False,
    ping_timeout=60,  # 增加ping超时时间
    ping_interval=25,  # 增加ping间隔时间
    max_http_buffer_size=10 * 1024 * 1024,  # 10MB缓冲区
    always_connect=False,  # 避免不必要的连接
    transports=['websocket', 'polling']  # 明确指定传输方式
)

# 密码验证函数
def check_password_auth():
    """检查密码验证 - 跳过特定端点"""
    path = request.path
    
    # 跳过静态文件和根路径
    if path == '/' or path == '/index.html' or path.endswith('.html'):
        return None
    if path.startswith('/assets/') or path.startswith('/static/'):
        return None
    if path == '/favicon.ico' or path.endswith('.ico'):
        return None
    if path == '/manifest.json' or path == '/@vite/client':
        return None
    if path.endswith(('.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.woff', '.woff2', '.ttf', '.json')):
        return None
    
    # 跳过设置相关端点（首次设置、状态检查、获取设置等）
    if path.startswith('/api/settings/setup-status'):
        return None
    if path.startswith('/api/settings/first-setup'):
        return None
    if path.startswith('/api/settings/verify-password'):
        return None
    if path == '/api/settings' and request.method == 'GET':
        return None
    # 跳过密码设置更新端点（需要特殊处理）
    if path == '/api/settings/password' and request.method == 'PUT':
        return None
    # 跳过聊天文件预览和下载端点（公开访问）
    if path.startswith('/api/messages/') and path.endswith('/file/preview'):
        return None
    if path.startswith('/api/messages/') and path.endswith('/file/download'):
        return None
    
    # 跳过文件预览端点
    if '/api/files/' in path and '/preview' in path:
        return None
    
    # 检查密码设置
    try:
        # 使用绝对路径确保找到文件
        current_dir = os.path.dirname(os.path.abspath(__file__))
        settings_file = os.path.join(current_dir, 'data', 'settings.json')
        
        if not os.path.exists(settings_file):
            # 如果设置文件不存在，创建默认设置（密码禁用）
            os.makedirs(os.path.dirname(settings_file), exist_ok=True)
            default_settings = {"passwordEnabled": False}
            with open(settings_file, 'w', encoding='utf-8') as f:
                json.dump(default_settings, f)
            return None
            
        with open(settings_file, 'r', encoding='utf-8') as f:
            settings = json.load(f)
            
        password_enabled = settings.get('passwordEnabled', False)
        
        # 如果未启用密码，直接放行
        if not password_enabled:
            return None
            
        # 检查是否已验证
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': '需要密码验证'}), 401
            
        token = auth_header.split(' ')[1]
        if token != 'authenticated':
            return jsonify({'error': '密码验证失败'}), 401
            
    except Exception as e:
        return jsonify({'error': '验证失败'}), 401
    
    return None

# 应用密码验证中间件到所有API端点
@app.before_request
def check_auth():
    result = check_password_auth()
    if result is not None:
        return result

# 初始化数据库
engine, Session = init_db(app.config['DATABASE_PATH'])

# 前端静态文件服务
@app.route('/')
def serve_frontend():
    """服务前端首页"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/debug')
def serve_debug_tool():
    """服务调试工具页面"""
    debug_html = '''
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文件预览调试工具 - LanShare</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .debug-panel {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .status-ok { color: #22c55e; }
        .status-error { color: #ef4444; }
        .status-warning { color: #f59e0b; }
        .log-area {
            background: #1e1e1e;
            color: #ffffff;
            padding: 15px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
            height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        .preview-area {
            border: 2px dashed #ccc;
            padding: 20px;
            text-align: center;
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fafafa;
        }
        .preview-image {
            max-width: 100%;
            max-height: 350px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #2980b9;
        }
        button:disabled {
            background: #bdc3c7;
            cursor: not-allowed;
        }
        .file-info {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        .metric-label {
            font-size: 12px;
            color: #7f8c8d;
            text-transform: uppercase;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <h1>🔍 LanShare 文件预览调试工具</h1>
    <div class="debug-panel">
        <a href="/" style="text-decoration: none; color: #3498db;">← 返回主应用</a>
    </div>
    
    <div class="debug-panel">
        <h2>📊 系统状态</h2>
        <div id="system-status">正在检查系统状态...</div>
    </div>

    <div class="debug-panel">
        <h2>📁 文件信息</h2>
        <div id="file-info">正在获取文件信息...</div>
        <button onclick="loadFileInfo()">刷新文件列表</button>
        <button onclick="testPreview()" id="test-btn" disabled>测试预览</button>
    </div>

    <div class="debug-panel">
        <h2>📊 性能指标</h2>
        <div class="metrics" id="metrics">
            <div class="metric-card">
                <div class="metric-value" id="load-time">-</div>
                <div class="metric-label">加载时间 (ms)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="file-size">-</div>
                <div class="metric-label">文件大小 (MB)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="download-speed">-</div>
                <div class="metric-label">下载速度 (MB/s)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="status">-</div>
                <div class="metric-label">状态</div>
            </div>
        </div>
    </div>

    <div class="debug-panel">
        <h2>🖼️ 预览区域</h2>
        <div class="preview-area" id="preview-area">
            <div>点击"测试预览"开始测试</div>
        </div>
    </div>

    <div class="debug-panel">
        <h2>📝 调试日志</h2>
        <div class="log-area" id="log-area"></div>
        <button onclick="clearLog()">清空日志</button>
    </div>

    <script>
        let currentFile = null;
        let startTime = 0;

        function log(message, type = 'info') {
            const timestamp = new Date().toLocaleTimeString();
            const logArea = document.getElementById('log-area');
            const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
            logArea.textContent += `[${timestamp}] ${prefix} ${message}\n`;
            logArea.scrollTop = logArea.scrollHeight;
            console.log(`[${type.toUpperCase()}] ${message}`);
        }

        function clearLog() {
            document.getElementById('log-area').textContent = '';
        }

        function updateMetric(id, value) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        }

        async function checkSystemStatus() {
            try {
                log('检查系统连接状态...');
                const response = await fetch('/api/system/info');
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('system-status').innerHTML = 
                        `<span class="status-ok">✅ 系统正常</span> - 推荐IP: ${data.recommended_ip}:${data.port}`;
                    log('系统连接正常', 'success');
                    return true;
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                document.getElementById('system-status').innerHTML = 
                    `<span class="status-error">❌ 系统连接失败: ${error.message}</span>`;
                log(`系统连接失败: ${error.message}`, 'error');
                return false;
            }
        }

        async function loadFileInfo() {
            try {
                log('获取文件列表...');
                const response = await fetch('/api/files');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                const files = data.files || [];
                
                if (files.length === 0) {
                    document.getElementById('file-info').innerHTML = 
                        '<span class="status-warning">⚠️ 没有找到文件，请先上传文件</span>';
                    log('没有找到文件', 'warning');
                    return;
                }

                currentFile = files[0]; // 取第一个文件
                const fileSizeMB = (currentFile.file_size / (1024 * 1024)).toFixed(2);
                
                document.getElementById('file-info').innerHTML = `
                    <div class="file-info">
                        <strong>文件名:</strong> ${currentFile.filename}<br>
                        <strong>ID:</strong> ${currentFile.id}<br>
                        <strong>类型:</strong> ${currentFile.file_type}<br>
                        <strong>大小:</strong> ${fileSizeMB} MB (${currentFile.file_size} bytes)<br>
                        <strong>上传时间:</strong> ${new Date(currentFile.upload_time).toLocaleString()}<br>
                        <strong>过期状态:</strong> ${currentFile.is_expired ? '已过期' : '正常'}
                    </div>
                `;
                
                updateMetric('file-size', fileSizeMB);
                document.getElementById('test-btn').disabled = false;
                log(`文件信息加载成功: ${currentFile.filename} (${fileSizeMB}MB)`, 'success');
                
            } catch (error) {
                document.getElementById('file-info').innerHTML = 
                    `<span class="status-error">❌ 获取文件信息失败: ${error.message}</span>`;
                log(`获取文件信息失败: ${error.message}`, 'error');
            }
        }

        async function testPreview() {
            if (!currentFile) {
                log('没有选择文件', 'error');
                return;
            }

            const previewArea = document.getElementById('preview-area');
            const testBtn = document.getElementById('test-btn');
            
            // 重置指标
            updateMetric('load-time', '-');
            updateMetric('download-speed', '-');
            updateMetric('status', '加载中');

            try {
                testBtn.disabled = true;
                previewArea.innerHTML = `
                    <div>
                        <div class="loading-spinner"></div>
                        <p style="margin-top: 20px;">正在加载预览...</p>
                        <p style="font-size: 12px; color: #666;">文件: ${currentFile.filename}</p>
                    </div>
                `;

                log(`开始预览测试: ${currentFile.filename}`);
                startTime = Date.now();

                // 创建图片元素
                const img = new Image();
                const previewUrl = `/api/files/${currentFile.id}/preview?t=${Date.now()}`;
                
                log(`预览URL: ${previewUrl}`);

                // 设置图片事件处理器
                img.onload = function() {
                    const loadTime = Date.now() - startTime;
                    const fileSizeMB = currentFile.file_size / (1024 * 1024);
                    const downloadSpeed = (fileSizeMB * 1000 / loadTime).toFixed(2);
                    
                    // 更新指标
                    updateMetric('load-time', loadTime);
                    updateMetric('download-speed', downloadSpeed);
                    updateMetric('status', '成功');

                    // 显示图片
                    previewArea.innerHTML = `
                        <div>
                            <img src="${previewUrl}" alt="${currentFile.filename}" class="preview-image">
                            <p style="margin-top: 10px; font-size: 14px;">
                                ✅ 加载成功 - ${img.naturalWidth}×${img.naturalHeight}px - ${loadTime}ms
                            </p>
                        </div>
                    `;

                    log(`预览加载成功: ${currentFile.filename}`, 'success');
                    log(`性能指标: ${loadTime}ms, ${downloadSpeed}MB/s, ${img.naturalWidth}×${img.naturalHeight}px`, 'info');
                };

                img.onerror = function(e) {
                    const loadTime = Date.now() - startTime;
                    updateMetric('load-time', loadTime);
                    updateMetric('status', '失败');

                    previewArea.innerHTML = `
                        <div style="color: #ef4444;">
                            <div style="font-size: 48px;">❌</div>
                            <p><strong>预览加载失败</strong></p>
                            <p>文件: ${currentFile.filename}</p>
                            <p>错误: ${e.type || '未知错误'}</p>
                            <p>耗时: ${loadTime}ms</p>
                        </div>
                    `;

                    log(`预览加载失败: ${currentFile.filename}, 错误: ${e.type}, 耗时: ${loadTime}ms`, 'error');
                };

                // 设置超时
                const timeout = setTimeout(() => {
                    const loadTime = Date.now() - startTime;
                    updateMetric('load-time', loadTime);
                    updateMetric('status', '超时');

                    previewArea.innerHTML = `
                        <div style="color: #ef4444;">
                            <div style="font-size: 48px;">⏰</div>
                            <p><strong>预览加载超时</strong></p>
                            <p>文件: ${currentFile.filename}</p>
                            <p>超时时间: 120秒</p>
                            <p>实际耗时: ${loadTime}ms</p>
                        </div>
                    `;

                    log(`预览加载超时: ${currentFile.filename}, 耗时: ${loadTime}ms`, 'error');
                    img.src = ''; // 停止加载
                }, 120000); // 120秒超时

                // 开始加载图片
                img.src = previewUrl;

                // 清除超时当图片加载完成时
                const originalOnload = img.onload;
                const originalOnerror = img.onerror;

                img.onload = function(e) {
                    clearTimeout(timeout);
                    if (originalOnload) originalOnload.call(this, e);
                };

                img.onerror = function(e) {
                    clearTimeout(timeout);
                    if (originalOnerror) originalOnerror.call(this, e);
                };

            } catch (error) {
                const loadTime = Date.now() - startTime;
                updateMetric('load-time', loadTime);
                updateMetric('status', '异常');

                previewArea.innerHTML = `
                    <div style="color: #ef4444;">
                        <div style="font-size: 48px;">💥</div>
                        <p><strong>预览测试异常</strong></p>
                        <p>错误: ${error.message}</p>
                        <p>耗时: ${loadTime}ms</p>
                    </div>
                `;

                log(`预览测试异常: ${error.message}`, 'error');
            } finally {
                testBtn.disabled = false;
            }
        }

        // 页面加载时初始化
        window.addEventListener('load', async () => {
            log('=== LanShare 文件预览调试工具启动 ===');
            const systemOk = await checkSystemStatus();
            if (systemOk) {
                await loadFileInfo();
            }
        });
    </script>
</body>
</html>
    '''
    return debug_html

@app.route('/<path:path>')
def serve_static_files(path):
    """服务前端静态文件"""
    # 如果是API请求，让Flask继续处理
    if path.startswith('api/'):
        abort(404)
    
    # 尝试返回请求的静态文件
    try:
        return send_from_directory(app.static_folder, path)
    except:
        # 如果文件不存在，返回index.html支持React Router
        return send_from_directory(app.static_folder, 'index.html')

def get_all_local_ips():
    """获取所有可用的IP地址"""
    ips = []
    
    try:
        # 0. 检测是否在Docker环境中运行
        is_docker = os.path.exists('/.dockerenv') or os.environ.get('DOCKER_CONTAINER', '').lower() == 'true'
        
        # 1. 从环境变量获取宿主机IP（最高优先级）
        host_ip = os.environ.get('HOST_IP')
        if host_ip and host_ip not in [item.get('ip') for item in ips]:
            ips.append({
                'ip': host_ip,
                'name': '宿主机IP',
                'type': 'host'
            })
        
        # 2. 如果在Docker环境中，尝试多种方式获取宿主机IP
        if is_docker:
            # 2.0 从环境变量获取明确配置的IP
            explicit_host_ip = os.environ.get('HOST_IP') or os.environ.get('DOCKER_HOST_IP')
            if explicit_host_ip and explicit_host_ip not in [item['ip'] for item in ips]:
                ips.insert(0, {
                    'ip': explicit_host_ip,
                    'name': '配置IP',
                    'type': 'host'
                })
            
            # 2.1 尝试从Docker网关获取宿主机IP
            try:
                with open('/proc/net/route', 'r') as f:
                    for line in f:
                        fields = line.strip().split()
                        if len(fields) >= 3 and fields[1] == '00000000':
                            gateway_hex = fields[2]
                            if gateway_hex != '00000000':
                                gateway = socket.inet_ntoa(bytes.fromhex(gateway_hex)[::-1])
                                # 常见的Docker宿主机IP模式
                                if gateway.startswith('172.'):
                                    # Docker默认网段，宿主机通常是网关
                                    host_ip = gateway
                                    if host_ip not in [item['ip'] for item in ips]:
                                        ips.insert(0, {
                                            'ip': host_ip,
                                            'name': 'Docker宿主机',
                                            'type': 'host'
                                        })
                                        
                                    # 尝试获取更准确的宿主机局域网IP
                                    # 基于Docker网关推断可能的宿主机IP
                                    gateway_parts = gateway.split('.')
                                    if len(gateway_parts) == 4:
                                        # 假设宿主机在192.168.x.x网段
                                        possible_lan_ip = f"192.168.{gateway_parts[2]}.1"
                                        if possible_lan_ip not in [item['ip'] for item in ips]:
                                            ips.insert(0, {
                                                'ip': possible_lan_ip,
                                                'name': '局域网宿主机',
                                                'type': 'lan'
                                            })
                                break
            except Exception as e:
                print(f"Docker网关检测失败: {e}")
                pass
                
            # 2.2 从环境变量获取Docker宿主机的局域网IP（备用）
            docker_host_ip = os.environ.get('DOCKER_HOST_IP')
            if docker_host_ip and docker_host_ip not in [item['ip'] for item in ips] and docker_host_ip != explicit_host_ip:
                ips.insert(0, {
                    'ip': docker_host_ip,
                    'name': 'Docker宿主机局域网IP',
                    'type': 'lan'
                })
        
        # 3. 通过连接外部地址获取本机IP（在非Docker环境或作为补充）
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            if ip not in [item['ip'] for item in ips]:
                if ip.startswith('192.168.'):
                    ips.insert(0, {
                        'ip': ip,
                        'name': '局域网IP',
                        'type': 'lan'
                    })
                elif ip.startswith('10.'):
                    ips.insert(0, {
                        'ip': ip,
                        'name': '内网IP',
                        'type': 'lan'
                    })
                elif ip.startswith('172.'):
                    # 只有在非Docker环境或没有更好选择时才添加
                    if not is_docker or len(ips) == 0:
                        ips.append({
                            'ip': ip,
                            'name': 'Docker内网IP',
                            'type': 'docker'
                        })
                else:
                    ips.append({
                        'ip': ip,
                        'name': '其他IP',
                        'type': 'other'
                    })
        except:
            pass
        
        # 4. 检查本地网络接口（在非Docker环境中）
        if not is_docker:
            try:
                import netifaces
                interfaces = netifaces.interfaces()
                for interface in interfaces:
                    ifaddresses = netifaces.ifaddresses(interface)
                    if netifaces.AF_INET in ifaddresses:
                        for link in ifaddresses[netifaces.AF_INET]:
                            ip = link['addr']
                            if ip != '127.0.0.1' and ip not in [item['ip'] for item in ips]:
                                if ip.startswith('192.168.'):
                                    ips.insert(0, {
                                        'ip': ip,
                                        'name': f'局域网IP ({interface})',
                                        'type': 'interface'
                                    })
                                elif ip.startswith('10.'):
                                    ips.insert(0, {
                                        'ip': ip,
                                        'name': f'内网IP ({interface})',
                                        'type': 'interface'
                                    })
            except ImportError:
                pass
        
        # 5. 添加localhost作为备选
        if not any(item['ip'] == 'localhost' for item in ips):
            ips.append({
                'ip': 'localhost',
                'name': '本地地址',
                'type': 'localhost'
            })
        
        # 6. 去重并保持优先级顺序
        seen = set()
        unique_ips = []
        for ip_info in ips:
            if ip_info['ip'] not in seen:
                seen.add(ip_info['ip'])
                unique_ips.append(ip_info)
        
        return unique_ips if unique_ips else [{
            'ip': 'localhost',
            'name': '本地地址',
            'type': 'localhost'
        }]
    except Exception as e:
        print(f"获取IP地址失败: {e}")
        return [{
            'ip': 'localhost',
            'name': '本地地址',
            'type': 'localhost'
        }]

def get_local_ip():
    """获取默认的本机局域网IP（保持向后兼容）"""
    ips = get_all_local_ips()
    # 优先返回局域网IP
    for ip_info in ips:
        if ip_info['type'] in ['lan', 'host', 'interface'] and ip_info['ip'].startswith('192.168.'):
            return ip_info['ip']
    # 其次返回其他类型的非localhost IP
    for ip_info in ips:
        if ip_info['ip'] != 'localhost':
            return ip_info['ip']
    return 'localhost'

def allowed_file(filename):
    # 已取消文件类型限制，允许所有文件
    return True

def get_file_type(filename):
    """根据文件扩展名判断文件类型"""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']:
        return 'image'
    elif ext in ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv']:
        return 'video'
    elif ext in ['mp3', 'wav', 'flac', 'aac', 'm4a']:
        return 'audio'
    elif ext in ['pdf']:
        return 'pdf'
    elif ext in ['doc', 'docx']:
        return 'document'
    elif ext in ['xls', 'xlsx']:
        return 'spreadsheet'
    elif ext in ['ppt', 'pptx']:
        return 'presentation'
    elif ext in ['zip', 'rar', '7z', 'tar', 'gz']:
        return 'archive'
    else:
        return 'file'

@app.route('/api/system/info')
def system_info():
    """获取系统信息"""
    # 尝试从请求头中获取真实的客户端IP
    client_ip = request.headers.get('X-Forwarded-For')
    if client_ip:
        client_ip = client_ip.split(',')[0].strip()
    else:
        client_ip = request.remote_addr
    
    # 获取所有可用IP
    all_ips = get_all_local_ips()
    
    # 根据客户端IP智能推荐最佳IP和添加真实IP
    recommended_ip = None
    if client_ip and client_ip != '127.0.0.1' and not client_ip.startswith('172.1'):
        # 如果客户端IP是真实的局域网IP，尝试推断服务器在同一网段的IP
        if client_ip.startswith('192.168.') or client_ip.startswith('10.') or client_ip.startswith('172.'):
            client_parts = client_ip.split('.')
            if len(client_parts) == 4:
                client_network = f"{client_parts[0]}.{client_parts[1]}.{client_parts[2]}"
                
                # 查找同网段的已有IP
                for ip_info in all_ips:
                    if ip_info['ip'].startswith(client_network + '.'):
                        recommended_ip = ip_info['ip']
                        break
                
                # 如果没有找到同网段的IP，根据客户端推断可能的服务器IP
                if not recommended_ip:
                    # 尝试几个常见的服务器IP方案
                    possible_server_ips = [
                        f"{client_network}.1",    # 网关IP
                        f"{client_network}.2",    # 可能的服务器IP
                        f"{client_network}.100",  # 另一个常见的服务器IP
                        client_ip                 # 客户端本身可能就是服务器
                    ]
                    
                    for possible_ip in possible_server_ips:
                        if possible_ip not in [item['ip'] for item in all_ips]:
                            # 根据客户端IP的类型来定义名称
                            if possible_ip == client_ip:
                                ip_name = f'客户端同网段IP'
                                ip_type = 'client_network'
                            elif possible_ip.endswith('.1'):
                                ip_name = f'网关 {possible_ip}'
                                ip_type = 'gateway'
                            else:
                                ip_name = f'推断服务器IP {possible_ip}'
                                ip_type = 'inferred_server'
                                
                            all_ips.insert(0, {  # 插入到列表首位
                                'ip': possible_ip,
                                'name': ip_name,
                                'type': ip_type
                            })
                    
                    # 设置推荐IP为客户端同网段的第一个IP
                    recommended_ip = all_ips[0]['ip'] if all_ips else 'localhost'
    
    # 如果仍然没有推荐IP，使用默认逻辑
    if not recommended_ip:
        recommended_ip = get_local_ip()
    
    port = 7070
    
    return jsonify({
        'available_ips': all_ips,
        'recommended_ip': recommended_ip,
        'port': port,
        'client_ip': client_ip,  # 返回客户端IP供调试使用
        'docker_env': os.environ.get('DOCKER_CONTAINER', 'false') == 'true',
        'host_ip': os.environ.get('HOST_IP', ''),
        'docker_host_ip': os.environ.get('DOCKER_HOST_IP', '')
    })

@app.route('/api/system/qrcode', methods=['POST'])
def generate_qrcode():
    """为指定IP生成二维码"""
    data = request.get_json()
    ip = data.get('ip')
    port = data.get('port', 7070)
    
    if not ip:
        return jsonify({'error': 'IP地址不能为空'}), 400
    
    url = f"http://{ip}:{port}"
    
    # 生成二维码
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    qr_img = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    qr_img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    qr_img.save(buffered, format="PNG")
    qr_base64 = base64.b64encode(buffered.getvalue()).decode()
    
    return jsonify({
        'url': url,
        'qr_code': f"data:image/png;base64,{qr_base64}"
    })

@app.route('/api/debug/config')
def debug_config():
    """调试配置信息"""
    return jsonify({
        'upload_folder': app.config['UPLOAD_FOLDER'],
        'max_content_length': '无限制' if app.config['MAX_CONTENT_LENGTH'] is None else app.config['MAX_CONTENT_LENGTH'],
        'allowed_extensions': list(app.config['ALLOWED_EXTENSIONS']),
        'upload_folder_exists': os.path.exists(app.config['UPLOAD_FOLDER']),
        'upload_folder_writable': os.access(app.config['UPLOAD_FOLDER'], os.W_OK) if os.path.exists(app.config['UPLOAD_FOLDER']) else False
    })

@app.route('/api/files', methods=['GET'])
def get_files():
    """获取文件列表"""
    channel = request.args.get('channel', 'default')
    session = Session()
    
    try:
        files = session.query(FileRecord).filter(
            FileRecord.channel == channel,
            FileRecord.is_deleted == False
        ).order_by(desc(FileRecord.upload_time)).all()
        
        file_list = []
        current_time = datetime.now()
        
        for file in files:
            # 计算剩余时间
            time_remaining = file.expire_time - current_time
            total_seconds = int(time_remaining.total_seconds())
            
            # 判断文件是否已过期
            is_expired = total_seconds <= 0
            
            # 计算剩余时间的显示
            if is_expired:
                remaining_text = "已过期"
                remaining_days = 0
                remaining_hours = 0
                remaining_minutes = 0
            else:
                remaining_days = total_seconds // (24 * 3600)
                remaining_hours = (total_seconds % (24 * 3600)) // 3600
                remaining_minutes = (total_seconds % 3600) // 60
                
                if remaining_days > 0:
                    remaining_text = f"{remaining_days}天"
                elif remaining_hours > 0:
                    remaining_text = f"{remaining_hours}小时{remaining_minutes}分钟"
                else:
                    remaining_text = f"{remaining_minutes}分钟"
            
            file_list.append({
                'id': file.id,
                'filename': file.original_filename,
                'file_size': file.file_size,
                'upload_time': int(file.upload_time.timestamp() * 1000),  # 返回毫秒时间戳
                'expire_time': int(file.expire_time.timestamp() * 1000),  # 过期时间毫秒时间戳
                'uploader_name': file.uploader_name,
                'file_type': file.file_type,
                'download_url': f'/api/files/{file.id}/download',
                'is_expired': is_expired,
                'remaining_text': remaining_text,
                'remaining_days': remaining_days,
                'remaining_hours': remaining_hours,
                'remaining_minutes': remaining_minutes,
                'total_remaining_seconds': max(0, total_seconds)
            })
        
        return jsonify({'files': file_list})
    
    except Exception as e:
        print(f"获取文件列表错误: {str(e)}")
        return jsonify({'error': f'获取文件列表失败: {str(e)}'}), 500
    finally:
        session.close()

@app.route('/api/files/upload', methods=['POST'])
def upload_file():
    """上传文件"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        channel = request.form.get('channel', 'default')
        uploader_name = request.form.get('uploader_name', '匿名用户')
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 保存原始文件名用于显示
            original_filename = file.filename
            
            # 生成唯一文件名（用于存储）
            filename = secure_filename(file.filename)
            if not filename:
                return jsonify({'error': '文件名无效'}), 400
                
            unique_filename = f"{uuid.uuid4()}_{filename}"
            
            # 确保上传目录存在
            upload_folder = app.config['UPLOAD_FOLDER']
            os.makedirs(upload_folder, exist_ok=True)
            file_path = os.path.join(upload_folder, unique_filename)
            
            # 保存文件
            file.save(file_path)
            
            # 验证文件确实已保存
            if not os.path.exists(file_path):
                return jsonify({'error': '文件保存失败'}), 500
                
            file_size = os.path.getsize(file_path)
            
            # 保存到数据库
            session = Session()
            
            try:
                file_record = FileRecord(
                    filename=unique_filename,
                    original_filename=original_filename,  # 保存真正的原始文件名
                    file_size=file_size,
                    file_path=file_path,
                    uploader_ip=request.remote_addr,
                    uploader_name=uploader_name,
                    channel=channel,
                    file_type=get_file_type(original_filename)
                )
                
                session.add(file_record)
                session.commit()
                
                # 通过WebSocket通知所有客户端
                current_time = datetime.now()
                time_remaining = file_record.expire_time - current_time
                total_seconds = int(time_remaining.total_seconds())
                
                remaining_days = total_seconds // (24 * 3600)
                remaining_hours = (total_seconds % (24 * 3600)) // 3600
                remaining_minutes = (total_seconds % 3600) // 60
                
                if remaining_days > 0:
                    remaining_text = f"{remaining_days}天"
                elif remaining_hours > 0:
                    remaining_text = f"{remaining_hours}小时{remaining_minutes}分钟"
                else:
                    remaining_text = f"{remaining_minutes}分钟"
                
                socketio.emit('file_uploaded', {
                    'id': file_record.id,
                    'filename': filename,
                    'file_size': file_size,
                    'upload_time': int(file_record.upload_time.timestamp() * 1000),  # 返回毫秒时间戳
                    'expire_time': int(file_record.expire_time.timestamp() * 1000),  # 过期时间毫秒时间戳
                    'uploader_name': uploader_name,
                    'file_type': file_record.file_type,
                    'download_url': f'/api/files/{file_record.id}/download',
                    'is_expired': False,
                    'remaining_text': remaining_text,
                    'remaining_days': remaining_days,
                    'remaining_hours': remaining_hours,
                    'remaining_minutes': remaining_minutes,
                    'total_remaining_seconds': total_seconds
                }, room=channel)
                
                return jsonify({
                    'message': '文件上传成功',
                    'file_id': file_record.id,
                    'filename': filename,
                    'file_size': file_size
                })
                
            except Exception as db_error:
                # 数据库错误时删除已保存的文件
                try:
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except:
                    pass
                return jsonify({'error': f'数据库保存失败: {str(db_error)}'}), 500
                
            finally:
                session.close()
        
        # 文件上传失败，非空文件但上传失败
        return jsonify({'error': '文件上传失败'}), 400
            
    except Exception as e:
        print(f"文件上传错误: {str(e)}")
        return jsonify({'error': f'文件上传失败: {str(e)}'}), 500

@app.route('/api/files/<int:file_id>/download')
def download_file(file_id):
    """下载文件"""
    session = Session()
    
    try:
        file_record = session.query(FileRecord).filter(
            FileRecord.id == file_id,
            FileRecord.is_deleted == False
        ).first()
        
        if not file_record:
            abort(404)
        
        if not os.path.exists(file_record.file_path):
            abort(404)
        
        return send_file(
            file_record.file_path,
            as_attachment=True,
            download_name=file_record.original_filename,
            mimetype=mimetypes.guess_type(file_record.original_filename)[0]
        )
    
    finally:
        session.close()

@app.route('/api/messages/<int:message_id>/file/preview')
def preview_chat_file(message_id):
    """预览聊天文件（基于消息ID）"""
    session = Session()
    
    try:
        # 查找消息记录
        message = session.query(Message).filter(
            Message.id == message_id,
            Message.message_type == 'file',
            Message.is_deleted == False
        ).first()
        
        if not message:
            abort(404)
            
        file_path = message.file_path
        if not file_path or not os.path.exists(file_path):
            abort(404)
            
        # 获取文件类型
        mime_type = mimetypes.guess_type(message.file_name)[0] or 'application/octet-stream'
        
        # 支持Range请求（用于视频/音频流式传输）
        range_header = request.headers.get('Range')
        file_size = os.path.getsize(file_path)
        
        if range_header:
            # 解析Range头
            byte_start = 0
            byte_end = file_size - 1
            
            range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                byte_start = int(range_match.group(1))
                if range_match.group(2):
                    byte_end = int(range_match.group(2))
            
            # 确保范围有效
            byte_start = max(0, min(byte_start, file_size - 1))
            byte_end = max(byte_start, min(byte_end, file_size - 1))
            content_length = byte_end - byte_start + 1
            
            # 读取指定范围的文件内容
            def generate():
                with open(file_path, 'rb') as f:
                    f.seek(byte_start)
                    remaining = content_length
                    while remaining > 0:
                        chunk_size = min(8192, remaining)
                        chunk = f.read(chunk_size)
                        if not chunk:
                            break
                        remaining -= len(chunk)
                        yield chunk
            
            response = Response(
                generate(),
                206,  # Partial Content
                headers={
                    'Content-Type': mime_type,
                    'Accept-Ranges': 'bytes',
                    'Content-Range': f'bytes {byte_start}-{byte_end}/{file_size}',
                    'Content-Length': str(content_length),
                    'Cache-Control': 'public, max-age=3600',
                }
            )
            return response
        else:
            # 普通请求，返回完整文件
            response = send_file(
                file_path,
                as_attachment=False,
                download_name=message.file_name,
                mimetype=mime_type,
                conditional=True,
                etag=True,
                max_age=3600
            )
            
            # 设置额外的响应头
            response.headers['Accept-Ranges'] = 'bytes'
            response.headers['Cache-Control'] = 'public, max-age=3600'
            
            return response
            
    except Exception as e:
        print(f"聊天文件预览错误: {str(e)}")
        abort(500)
    finally:
        session.close()

@app.route('/api/messages/<int:message_id>/file/download')
def download_chat_file(message_id):
    """下载聊天文件（基于消息ID）"""
    session = Session()
    
    try:
        # 查找消息记录
        message = session.query(Message).filter(
            Message.id == message_id,
            Message.message_type == 'file',
            Message.is_deleted == False
        ).first()
        
        if not message:
            abort(404)
            
        file_path = message.file_path
        if not file_path or not os.path.exists(file_path):
            abort(404)
            
        return send_file(
            file_path,
            as_attachment=True,
            download_name=message.file_name
        )
        
    except Exception as e:
        print(f"聊天文件下载错误: {str(e)}")
        abort(500)
    finally:
        session.close()

@app.route('/api/files/<int:file_id>/preview')
def preview_file(file_id):
    """预览文件（不强制下载）"""
    session = Session()
    
    try:
        file_record = session.query(FileRecord).filter(
            FileRecord.id == file_id,
            FileRecord.is_deleted == False
        ).first()
        
        if not file_record:
            abort(404)
        
        # 使用绝对路径，兼容相对路径和绝对路径
        if os.path.isabs(file_record.file_path):
            file_path = file_record.file_path
        else:
            # 如果是相对路径，则基于应用根目录解析
            file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), file_record.file_path)
        
        # 确保路径是绝对路径
        file_path = os.path.abspath(file_path)
        
        file_exists = os.path.exists(file_path)
        
        if not file_exists:
            # 尝试使用上传目录和文件名进行回退，兼容主机运行后迁移到容器的绝对路径问题
            try:
                upload_folder = app.config.get('UPLOAD_FOLDER') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
                # 优先使用数据库中的规范化文件名字段
                candidate_names = []
                if getattr(file_record, 'filename', None):
                    candidate_names.append(file_record.filename)
                # 回退到 file_path 的 basename（处理历史遗留的绝对路径）
                candidate_names.append(os.path.basename(file_record.file_path))

                for name in candidate_names:
                    alt_path = os.path.abspath(os.path.join(upload_folder, name))
                    if os.path.exists(alt_path):
                        file_path = alt_path
                        file_exists = True
                        break
            except Exception as _e:
                pass

        if not file_exists:
            abort(404)
        
        # 获取文件类型
        file_type = file_record.file_type
        
        # 支持的预览类型
        supported_types = ['image', 'video', 'audio']
        
        if file_type not in supported_types:
            return jsonify({'error': '该文件类型不支持预览'}), 415
        
        # 设置正确的Content-Type
        mime_type = mimetypes.guess_type(file_record.original_filename)[0]
        
        # 获取文件大小用于优化传输
        file_size = os.path.getsize(file_path)

        # 对视频/音频支持 Range 请求，确保可拖动播放
        if file_record.file_type in ['video', 'audio']:
            range_header = request.headers.get('Range')
            if range_header:
                # 解析 Range: bytes=start-end
                try:
                    units, rng = range_header.split('=')
                    if units.strip() == 'bytes':
                        start_str, end_str = rng.split('-')
                        range_start = int(start_str) if start_str else 0
                        range_end = int(end_str) if end_str else file_size - 1
                        range_start = max(0, range_start)
                        range_end = min(file_size - 1, range_end)
                        if range_start > range_end:
                            range_start = 0
                            range_end = file_size - 1

                        length = range_end - range_start + 1

                        def generate():
                            with open(file_path, 'rb') as f:
                                f.seek(range_start)
                                remaining = length
                                chunk_size = 8192
                                while remaining > 0:
                                    read_size = min(chunk_size, remaining)
                                    data = f.read(read_size)
                                    if not data:
                                        break
                                    remaining -= len(data)
                                    yield data

                        response = Response(generate(), status=206, mimetype=mime_type or 'application/octet-stream')
                        response.headers.add('Content-Range', f'bytes {range_start}-{range_end}/{file_size}')
                        response.headers.add('Accept-Ranges', 'bytes')
                        response.headers.add('Content-Length', str(length))
                        response.headers['Cache-Control'] = 'public, max-age=3600'
                        response.headers['X-Content-Type-Options'] = 'nosniff'
                        return response
                except Exception as e:
                    # 如果 Range 解析失败，回退到整文件
                    print(f"Range 解析失败，回退整文件: {e}")

        # 非 Range 或图片等类型：整文件返回，并开启条件请求
        response = send_file(
            file_path,
            as_attachment=False,
            download_name=file_record.original_filename,
            mimetype=mime_type,
            conditional=True,
            etag=True,
            max_age=3600
        )
        response.headers['Cache-Control'] = 'public, max-age=3600'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Accept-Ranges'] = 'bytes'
        if file_size > 1024 * 1024:
            response.headers['X-Accel-Buffering'] = 'no'
            print(f"大文件预览优化: {file_record.original_filename} ({file_size} bytes)")
        return response
        
    except Exception as e:
        print(f"预览文件错误: {str(e)}")
        return jsonify({'error': '预览文件失败'}), 500
    finally:
        session.close()

@app.route('/api/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """删除文件"""
    session = Session()
    
    try:
        file_record = session.query(FileRecord).filter(
            FileRecord.id == file_id
        ).first()
        
        if not file_record:
            return jsonify({'error': '文件不存在'}), 404
        
        # 标记为已删除
        file_record.is_deleted = True
        session.commit()
        
        # 删除物理文件，正确处理相对路径和绝对路径
        try:
            # 使用绝对路径，兼容相对路径和绝对路径
            if os.path.isabs(file_record.file_path):
                file_path = file_record.file_path
            else:
                # 如果是相对路径，则基于应用根目录解析
                file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), file_record.file_path)
            
            # 确保路径是绝对路径
            file_path = os.path.abspath(file_path)
            
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"删除文件时出错: {str(e)}")
            pass
        
        # 通知所有客户端
        socketio.emit('file_deleted', {
            'file_id': file_id
        }, room=file_record.channel)
        
        return jsonify({'message': '文件删除成功'})
    
    finally:
        session.close()

@app.route('/api/files/<int:file_id>/extend', methods=['POST'])
def extend_file_expiry(file_id):
    """延长文件过期时间"""
    data = request.get_json() or {}
    days = data.get('days', 15)  # 默认延长15天
    
    # 限制延长时间在合理范围内
    if days < 1 or days > 365:
        return jsonify({'error': '延长时间必须在1-365天之间'}), 400
    
    session = Session()
    
    try:
        file_record = session.query(FileRecord).filter(
            FileRecord.id == file_id,
            FileRecord.is_deleted == False
        ).first()
        
        if not file_record:
            return jsonify({'error': '文件不存在'}), 404
        
        # 延长过期时间
        file_record.expire_time = file_record.expire_time + timedelta(days=days)
        session.commit()
        
        # 计算新的剩余时间
        current_time = datetime.now()
        time_remaining = file_record.expire_time - current_time
        total_seconds = int(time_remaining.total_seconds())
        
        remaining_days = total_seconds // (24 * 3600)
        remaining_hours = (total_seconds % (24 * 3600)) // 3600
        remaining_minutes = (total_seconds % 3600) // 60
        
        if remaining_days > 0:
            remaining_text = f"{remaining_days}天"
        elif remaining_hours > 0:
            remaining_text = f"{remaining_hours}小时{remaining_minutes}分钟"
        else:
            remaining_text = f"{remaining_minutes}分钟"
        
        # 通知所有客户端文件过期时间已更新
        socketio.emit('file_expiry_extended', {
            'file_id': file_id,
            'expire_time': int(file_record.expire_time.timestamp() * 1000),
            'remaining_text': remaining_text,
            'remaining_days': remaining_days,
            'remaining_hours': remaining_hours,
            'remaining_minutes': remaining_minutes,
            'total_remaining_seconds': total_seconds
        }, room=file_record.channel)
        
        return jsonify({
            'message': f'文件过期时间已延长{days}天',
            'expire_time': int(file_record.expire_time.timestamp() * 1000),
            'remaining_text': remaining_text
        })
    
    finally:
        session.close()

@app.route('/api/messages', methods=['GET'])
def get_messages():
    """获取消息列表"""
    channel = request.args.get('channel', 'default')
    session = Session()
    
    try:
        messages = session.query(Message).filter(
            Message.channel == channel,
            Message.is_deleted == False
        ).order_by(asc(Message.send_time)).all()
        
        message_list = []
        for msg in messages:
            message_list.append({
                'id': msg.id,
                'content': msg.content,
                'sender_name': msg.sender_name,
                'send_time': int(msg.send_time.timestamp() * 1000),  # 返回毫秒时间戳
                'message_type': msg.message_type,
                'file_id': msg.file_id,
                'file_name': msg.file_name,
                'file_size': msg.file_size,
                'file_type': msg.file_type
            })
        
        return jsonify({'messages': message_list})
    
    finally:
        session.close()

@app.route('/api/messages', methods=['POST'])
def send_message():
    """发送消息"""
    data = request.json
    content = data.get('content', '').strip()
    channel = data.get('channel', 'default')
    sender_name = data.get('sender_name', '匿名用户')
    message_type = data.get('message_type', 'text')
    file_id = data.get('file_id')
    file_name = data.get('file_name')
    file_size = data.get('file_size')
    file_type = data.get('file_type')
    
    if not content:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    session = Session()
    
    try:
        message = Message(
            content=content,
            sender_ip=request.remote_addr,
            sender_name=sender_name,
            channel=channel,
            message_type=message_type,
            file_id=file_id,
            file_name=file_name,
            file_size=file_size,
            file_type=file_type
        )
        
        session.add(message)
        session.commit()
        
        # 通过WebSocket广播消息
        socketio.emit('new_message', {
            'id': message.id,
            'content': content,
            'sender_name': sender_name,
            'send_time': int(message.send_time.timestamp() * 1000),  # 返回毫秒时间戳
            'message_type': message_type,
            'file_id': file_id,
            'file_name': file_name,
            'file_size': file_size,
            'file_type': file_type
        }, room=channel)
        
        return jsonify({'message': '消息发送成功'})
    
    finally:
        session.close()

@app.route('/api/messages/file', methods=['POST'])
def send_file_message():
    """发送文件消息"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        content = request.form.get('message_content', request.form.get('content', '')).strip()
        channel = request.form.get('channel', 'default')
        sender_name = request.form.get('sender_name', '匿名用户')
        
        if file.filename == '':
            return jsonify({'error': '没有选择文件'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': '文件类型不支持'}), 400
        
        # 保存原始文件名用于显示
        original_filename = file.filename
        
        # 生成唯一文件名（用于存储）
        filename = secure_filename(file.filename)
        if not filename:
            return jsonify({'error': '文件名无效'}), 400
            
        unique_filename = f"{uuid.uuid4()}_{filename}"
        
        # 确保上传目录存在
        upload_folder = app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, unique_filename)
        
        # 保存文件
        file.save(file_path)
        
        # 验证文件确实已保存
        if not os.path.exists(file_path):
            return jsonify({'error': '文件保存失败'}), 500
            
        file_size = os.path.getsize(file_path)
        
        # 保存到数据库（只创建消息记录，不创建文件记录）
        session = Session()
        
        try:
            # 创建聊天文件消息记录（独立于传输文件系统）
            message = Message(
                content=content or f'发送了文件: {original_filename}',
                sender_ip=request.remote_addr,
                sender_name=sender_name,
                channel=channel,
                message_type='file',
                file_id=None,  # 聊天文件不关联传输文件ID
                file_path=file_path,  # 直接保存文件路径
                file_name=original_filename,  # 保存原始文件名用于显示
                file_size=file_size,
                file_type=get_file_type(original_filename)
            )
            
            session.add(message)
            session.commit()
            
            # 通过WebSocket通知所有客户端
            socketio.emit('new_message', {
                'id': message.id,
                'content': message.content,
                'sender_name': sender_name,
                'send_time': int(message.send_time.timestamp() * 1000),
                'message_type': 'file',
                'file_id': message.id,  # 使用消息ID作为文件标识
                'file_name': original_filename,  # 使用原始文件名
                'file_size': file_size,
                'file_type': get_file_type(original_filename)
            }, room=channel)
            
            return jsonify({
                'message': '文件消息发送成功',
                'message_id': message.id
            })
            
        except Exception as db_error:
            # 数据库错误时删除已保存的文件
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except:
                pass
            return jsonify({'error': f'数据库保存失败: {str(db_error)}'}), 500
            
        finally:
            session.close()
            
    except Exception as e:
        print(f"文件消息发送错误: {str(e)}")
        return jsonify({'error': f'文件消息发送失败: {str(e)}'}), 500

@app.route('/api/messages/<int:message_id>', methods=['DELETE'])
def delete_message(message_id):
    """删除消息"""
    session = Session()
    
    try:
        message_record = session.query(Message).filter(
            Message.id == message_id
        ).first()
        
        if not message_record:
            return jsonify({'error': '消息不存在'}), 404
        
        # 标记为已删除
        message_record.is_deleted = True
        session.commit()
        
        # 通知所有客户端
        socketio.emit('message_deleted', {
            'message_id': message_id
        }, room=message_record.channel)
        
        return jsonify({'message': '消息删除成功'})
    
    finally:
        session.close()

# 全局频道管理API
@app.route('/api/channels', methods=['GET'])
def get_channels():
    """获取全局频道列表"""
    session = Session()
    
    try:
        # 从settings.json中读取频道列表
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        channels = ['default']
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
                saved_channels = settings.get('channels', [])
                if isinstance(saved_channels, list):
                    channels = list(set(['default'] + saved_channels))
        
        # 同时获取已使用过的频道，确保向后兼容
        file_channels = session.query(FileRecord.channel).distinct().all()
        message_channels = session.query(Message.channel).distinct().all()
        
        used_channels = set()
        for (channel,) in file_channels + message_channels:
            if channel and channel.strip() and channel.strip() != 'default':
                used_channels.add(channel.strip())
        
        # 合并保存的频道和已使用的频道
        all_channels = list(set(channels + list(used_channels)))
        
        # 按字母排序，但默认频道排在最前
        sorted_channels = sorted(all_channels)
        if 'default' in sorted_channels:
            sorted_channels.remove('default')
            sorted_channels.insert(0, 'default')
        
        return jsonify({'channels': sorted_channels})
    
    finally:
        session.close()

@app.route('/api/channels', methods=['POST'])
def create_channel():
    """创建新频道"""
    try:
        data = request.json
        channel_name = data.get('name', '').strip()
        
        if not channel_name:
            return jsonify({'error': '频道名称不能为空'}), 400
        
        if channel_name == 'default':
            return jsonify({'error': '不能创建名为default的频道'}), 400
        
        # 频道名称长度限制
        if len(channel_name) > 50:
            return jsonify({'error': '频道名称不能超过50个字符'}), 400
        
        # 频道名称只能包含字母、数字、中文、下划线和连字符
        import re
        if not re.match(r'^[\w\u4e00-\u9fff\-]+$', channel_name):
            return jsonify({'error': '频道名称包含非法字符'}), 400
        
        # 读取当前设置
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        settings = {}
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        
        # 获取或创建频道列表
        if 'channels' not in settings:
            settings['channels'] = []
        
        # 检查频道是否已存在
        if channel_name in settings['channels']:
            return jsonify({'error': '频道已存在'}), 400
        
        # 添加新频道
        settings['channels'].append(channel_name)
        
        # 保存设置
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        
        return jsonify({'message': '频道创建成功', 'channel': channel_name})
    except Exception as e:
        print(f'创建频道失败: {e}')
        return jsonify({'error': '创建频道失败'}), 500

@app.route('/api/channels/<channel_name>', methods=['DELETE'])
def delete_channel(channel_name):
    """删除频道"""
    try:
        # URL解码频道名称
        from urllib.parse import unquote
        channel_name = unquote(channel_name).strip()
        
        if not channel_name or channel_name == 'default':
            return jsonify({'error': '不能删除默认频道'}), 400
        
        # 读取当前设置
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        settings = {}
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        
        # 获取频道列表
        if 'channels' not in settings:
            settings['channels'] = []
        
        # 检查频道是否存在
        if channel_name not in settings['channels']:
            return jsonify({'error': f'频道 "{channel_name}" 不存在'}), 404
        
        # 删除频道
        settings['channels'] = [ch for ch in settings['channels'] if ch != channel_name]
        
        # 保存设置
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        
        return jsonify({'message': '频道删除成功', 'channel': channel_name})
    except Exception as e:
        print(f'删除频道失败: {e}')
        return jsonify({'error': '删除频道失败'}), 500

# 频道重命名API
@app.route('/api/channels/<old_name>', methods=['PUT'])
def rename_channel(old_name):
    """重命名频道"""
    try:
        # URL解码原频道名称
        from urllib.parse import unquote
        old_name = unquote(old_name).strip()
        
        data = request.json
        new_name = data.get('name', '').strip()
        
        if not new_name:
            return jsonify({'error': '新频道名称不能为空'}), 400
            
        if not old_name or old_name == 'default':
            return jsonify({'error': '不能重命名默认频道'}), 400
            
        if new_name == 'default':
            return jsonify({'error': '不能使用default作为频道名称'}), 400
        
        # 频道名称长度限制
        if len(new_name) > 50:
            return jsonify({'error': '频道名称不能超过50个字符'}), 400
        
        # 读取当前设置
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        settings = {}
        
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        
        # 获取频道列表
        if 'channels' not in settings:
            settings['channels'] = []
        
        # 检查原频道是否存在
        if old_name not in settings['channels']:
            return jsonify({'error': '原频道不存在'}), 404
        
        # 检查新频道名称是否已存在
        if new_name in settings['channels']:
            return jsonify({'error': '新频道名称已存在'}), 400
        
        # 重命名频道
        settings['channels'] = [new_name if ch == old_name else ch for ch in settings['channels']]
        
        # 保存设置
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        
        return jsonify({'message': '频道重命名成功', 'old_name': old_name, 'new_name': new_name})
    except Exception as e:
        print(f'重命名频道失败: {e}')
        return jsonify({'error': '重命名频道失败'}), 500

# 设置管理API
@app.route('/api/settings/setup-status', methods=['GET'])
def get_setup_status():
    """检查是否需要首次设置"""
    try:
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
                return jsonify({'needsSetup': not settings.get('setupCompleted', False)})
        return jsonify({'needsSetup': True})
    except Exception as e:
        print(f'检查设置状态失败: {e}')
        return jsonify({'needsSetup': True})

# 首次设置
@app.route('/api/settings/first-setup', methods=['POST'])
def first_setup():
    """首次设置"""
    try:
        data = request.json
        use_password = data.get('usePassword', False)
        password = data.get('password')
        
        if use_password and (not password or len(password) < 4):
            return jsonify({'error': '密码长度至少为4位'}), 400

        settings = {
            'passwordEnabled': use_password,
            'password': None,
            'setupCompleted': True,
            'channels': ['工作区', '生活区']  # 添加默认频道
        }
        
        if use_password and password:
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            settings['password'] = hashed_password.decode('utf-8')

        # 确保数据目录存在
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)

        settings_file = os.path.join(data_dir, 'settings.json')
        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)

        # 如果启用了密码，返回认证token
        response_data = {'success': True}
        if use_password:
            response_data['token'] = 'authenticated'
            
        return jsonify(response_data)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f'首次设置失败: {e}')
        print(f'详细错误: {error_details}')
        return jsonify({'error': f'设置失败: {str(e)}'}), 500

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """获取当前设置"""
    try:
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
                return jsonify({
                    'passwordEnabled': settings.get('passwordEnabled', False),
                    'setupCompleted': settings.get('setupCompleted', False),
                    'refreshLockEnabled': settings.get('refreshLockEnabled', False)
                })
        return jsonify({'passwordEnabled': False, 'setupCompleted': False, 'refreshLockEnabled': False})
    except Exception as e:
        print(f'获取设置失败: {e}')
        return jsonify({'error': '获取设置失败'}), 500

@app.route('/api/settings/verify-password', methods=['POST'])
def verify_password():
    """验证密码"""
    try:
        data = request.json
        password = data.get('password')
        
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        if not os.path.exists(settings_file):
            return jsonify({'valid': True})

        with open(settings_file, 'r') as f:
            settings = json.load(f)

        if not settings.get('passwordEnabled', False):
            return jsonify({'valid': True})

        if not settings.get('password'):
            return jsonify({'valid': True})

        is_valid = bcrypt.checkpw(password.encode('utf-8'), settings['password'].encode('utf-8'))
        return jsonify({'valid': is_valid})
    except Exception as e:
        print(f'验证密码失败: {e}')
        return jsonify({'error': '验证失败'}), 500

@app.route('/api/settings/password', methods=['PUT'])
def update_password():
    """更新密码设置 - 需要验证当前密码"""
    try:
        data = request.json
        password_enabled = data.get('passwordEnabled', False)
        password = data.get('password')
        current_password = data.get('currentPassword')
        refresh_lock_enabled = data.get('refreshLockEnabled', False)
        
        settings_file = os.path.join(os.path.dirname(__file__), 'data', 'settings.json')
        
        # 读取当前设置
        if os.path.exists(settings_file):
            with open(settings_file, 'r') as f:
                settings = json.load(f)
        else:
            settings = {'passwordEnabled': False, 'password': None}

        # 如果当前启用了密码保护，需要验证当前密码
        if settings.get('passwordEnabled', False) and settings.get('password'):
            if not current_password:
                return jsonify({'error': '当前密码不能为空'}), 400
            
            # 验证当前密码
            try:
                is_valid = bcrypt.checkpw(current_password.encode('utf-8'), settings['password'].encode('utf-8'))
                if not is_valid:
                    return jsonify({'error': '当前密码错误'}), 400
            except Exception as e:
                print(f'密码验证失败: {e}')
                return jsonify({'error': '密码验证失败'}), 400

        # 更新设置
        settings['passwordEnabled'] = password_enabled
        settings['refreshLockEnabled'] = refresh_lock_enabled
        
        if password_enabled and password:
            if len(password) < 4:
                return jsonify({'error': '密码长度至少为4位'}), 400
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            settings['password'] = hashed_password.decode('utf-8')
        else:
            settings['password'] = None

        with open(settings_file, 'w') as f:
            json.dump(settings, f, indent=2)

        return jsonify({'success': True})
    except Exception as e:
        print(f'更新密码设置失败: {e}')
        return jsonify({'error': '更新失败'}), 500

@app.route('/health')
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'lanshare'
    }), 200

@app.route('/api/system/version')
def get_version():
    """获取系统版本信息"""
    try:
        # 获取VERSION文件的路径（在容器内）
        version_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'VERSION')
        
        try:
            with open(version_file, 'r', encoding='utf-8') as f:
                version_content = f.read().strip()
        except UnicodeDecodeError:
            # 如果UTF-8失败，尝试其他编码
            with open(version_file, 'r', encoding='gbk', errors='ignore') as f:
                version_content = f.read().strip()
        
        # 解析版本内容
        lines = version_content.split('\n')
        version = 'v1.0.0'  # 默认值
        build_date = None
        platform = None
        
        for line in lines:
            if line.startswith('LanShare'):
                version = line.replace('LanShare', '').strip()
            elif line.startswith('Build:'):
                build_date = line.replace('Build:', '').strip()
            elif line.startswith('Platform:'):
                platform = line.replace('Platform:', '').strip()
        
        return jsonify({
            'version': version,
            'build_date': build_date,
            'platform': platform,
            'full_version': version_content,
            'service': 'lanshare'
        })
    except Exception as e:
        return jsonify({
            'version': 'v1.0.0',
            'build_date': None,
            'platform': 'Unknown',
            'full_version': 'LanShare v1.0.0',
            'service': 'lanshare'
        })

@app.route('/api/system/check-update')
def check_update():
    """检查GitHub最新版本"""
    try:
        import urllib.request
        import json as json_lib
        
        # 获取当前版本
        current_response = get_version()
        current_data = current_response.get_json()
        current_version = current_data.get('version', 'v1.0.0')
        
        # 版本检查配置
        github_repo = os.environ.get('GITHUB_REPO', 'Danborad/lanshare')
        docker_repo = os.environ.get('DOCKER_REPO', 'zhong12138/lanshare')
        check_mode = os.environ.get('VERSION_CHECK_MODE', 'auto')  # auto, github, docker, tags
        
        # 如果没有配置任何仓库，返回本地模式
        if not github_repo and not docker_repo:
            return jsonify({
                'current_version': current_version,
                'latest_version': current_version,
                'has_update': False,
                'release_name': f'LanShare {current_version}',
                'release_notes': '当前为本地部署版本，无法检查更新。\n\n如需启用更新检查，请设置环境变量:\nGITHUB_REPO=owner/repo-name\n或\nDOCKER_REPO=username/imagename',
                'release_date': current_data.get('build_date', ''),
                'download_url': '',
                'check_time': datetime.now().isoformat(),
                'mode': 'local'
            })
        
        # 尝试不同的版本检查方式
        version_sources = []
        
        if check_mode in ['auto', 'docker'] and docker_repo:
            version_sources.append(('docker', docker_repo))
        if check_mode in ['auto', 'github', 'tags'] and github_repo:
            version_sources.append(('github_tags', github_repo))
            if check_mode in ['auto', 'github']:
                version_sources.append(('github_releases', github_repo))
        
        # 尝试各种版本源
        for source_type, repo in version_sources:
            try:
                result = check_version_from_source(source_type, repo, current_version, current_data)
                if result:
                    return jsonify(result)
            except Exception as e:
                print(f"检查版本源 {source_type} 失败: {e}")
                continue
        
        # 所有方式都失败，返回无更新状态
        return jsonify({
            'current_version': current_version,
            'latest_version': current_version,
            'has_update': False,
            'release_name': f'LanShare {current_version}',
            'release_notes': '无法检查更新，所有版本源都不可用。\n\n已尝试的源:\n' + 
                           '\n'.join([f'- {source_type}: {repo}' for source_type, repo in version_sources]),
            'release_date': current_data.get('build_date', ''),
            'download_url': f'https://github.com/{github_repo}' if github_repo else '',
            'check_time': datetime.now().isoformat(),
            'mode': 'fallback'
        })
            
    except Exception as e:
        return jsonify({
            'error': 'unknown_error',
            'message': '检查更新失败',
            'details': str(e)
        }), 500

def check_version_from_source(source_type, repo, current_version, current_data):
    """从不同源检查版本信息"""
    import urllib.request
    import json as json_lib
    
    try:
        if source_type == 'docker':
            # Docker Hub API - 获取更多标签以便更好地分析版本
            api_url = f"https://hub.docker.com/v2/repositories/{repo}/tags/?page_size=50&ordering=-last_updated"
            req = urllib.request.Request(api_url, headers={'User-Agent': 'LanShare-UpdateChecker/1.0'})
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json_lib.loads(response.read().decode())
                tags = data.get('results', [])
                
                # 查找最新的版本标签，使用更智能的版本排序
                import re
                
                # 过滤掉latest标签
                valid_tags = [tag for tag in tags if tag.get('name', '') != 'latest']
                
                if not valid_tags:
                    latest_version = current_version
                    latest_tag_info = None
                else:
                    # 尝试按版本号排序（提取数字部分）
                    def extract_version_number(tag_name):
                        # 提取版本号，如 1.0.19-werkzeug-fix -> (1, 0, 19)
                        match = re.match(r'v?(\d+)\.(\d+)\.?(\d+)?', tag_name)
                        if match:
                            major = int(match.group(1))
                            minor = int(match.group(2))
                            patch = int(match.group(3)) if match.group(3) else 0
                            return (major, minor, patch)
                        # 如果无法解析，返回一个很小的版本号
                        return (0, 0, 0)
                    
                    # 按版本号排序，取最大的
                    sorted_tags = sorted(valid_tags, key=lambda tag: extract_version_number(tag.get('name', '')), reverse=True)
                    
                    latest_tag_info = sorted_tags[0]
                    tag_name = latest_tag_info.get('name', '')
                    
                    # 格式化版本号
                    if tag_name.startswith('v'):
                        latest_version = tag_name
                    elif re.match(r'\d+\.\d+', tag_name):
                        # 如果是数字开头的版本号，添加v前缀
                        latest_version = f'v{tag_name}'
                    else:
                        latest_version = tag_name
                
                if not latest_version:
                    latest_version = current_version
                    
                has_update = latest_version != current_version
                
                # 构建拉取命令 - 优先使用latest，备选具体版本
                pull_commands = []
                pull_commands.append(f'docker pull {repo}:latest')
                if latest_version and latest_version != 'latest':
                    # 移除v前缀用于Docker标签
                    docker_tag = latest_version[1:] if latest_version.startswith('v') else latest_version
                    pull_commands.append(f'docker pull {repo}:{docker_tag}')
                
                pull_command_text = '\n'.join(pull_commands)
                
                return {
                    'current_version': current_version,
                    'latest_version': latest_version,
                    'has_update': has_update,
                    'release_name': f'LanShare {latest_version}',
                    'release_notes': f'Docker Hub 最新版本: {latest_version}\n\n从 Docker Hub 获取的版本信息。\n\n推荐拉取命令:\n{pull_command_text}',
                    'release_date': latest_tag_info.get('last_updated', '') if latest_tag_info else '',
                    'download_url': f'https://hub.docker.com/r/{repo}/tags',
                    'check_time': datetime.now().isoformat(),
                    'mode': 'docker_hub'
                }
                
        elif source_type == 'github_tags':
            # GitHub Tags API
            api_url = f"https://api.github.com/repos/{repo}/tags"
            req = urllib.request.Request(api_url, headers={'User-Agent': 'LanShare-UpdateChecker/1.0'})
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json_lib.loads(response.read().decode())
                
                if not data:
                    return None
                    
                # 获取最新的标签
                latest_tag = data[0]
                latest_version = latest_tag.get('name', 'v1.0.0')
                
                has_update = latest_version != current_version
                
                return {
                    'current_version': current_version,
                    'latest_version': latest_version,
                    'has_update': has_update,
                    'release_name': f'LanShare {latest_version}',
                    'release_notes': f'GitHub 最新标签: {latest_version}\n\n从 GitHub Tags 获取的版本信息。',
                    'release_date': current_data.get('build_date', ''),
                    'download_url': f'https://github.com/{repo}/releases/tag/{latest_version}',
                    'check_time': datetime.now().isoformat(),
                    'mode': 'github_tags'
                }
                
        elif source_type == 'github_releases':
            # GitHub Releases API
            api_url = f"https://api.github.com/repos/{repo}/releases/latest"
            req = urllib.request.Request(api_url, headers={'User-Agent': 'LanShare-UpdateChecker/1.0'})
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json_lib.loads(response.read().decode())
                
                latest_version = data.get('tag_name', 'v1.0.0')
                release_name = data.get('name', latest_version)
                release_notes = data.get('body', '暂无更新说明')
                release_date = data.get('published_at', '')
                download_url = data.get('html_url', '')
                
                has_update = latest_version != current_version
                
                return {
                    'current_version': current_version,
                    'latest_version': latest_version,
                    'has_update': has_update,
                    'release_name': release_name,
                    'release_notes': release_notes,
                    'release_date': release_date,
                    'download_url': download_url,
                    'check_time': datetime.now().isoformat(),
                    'mode': 'github_releases'
                }
                
    except urllib.error.HTTPError as e:
        if e.code == 404 and source_type == 'github_releases':
            # GitHub Releases不存在，但仓库可能存在
            try:
                repo_check_url = f"https://api.github.com/repos/{repo}"
                repo_req = urllib.request.Request(repo_check_url, headers={'User-Agent': 'LanShare-UpdateChecker/1.0'})
                with urllib.request.urlopen(repo_req, timeout=5):
                    return {
                        'current_version': current_version,
                        'latest_version': current_version,
                        'has_update': False,
                        'release_name': f'LanShare {current_version}',
                        'release_notes': f'仓库 {repo} 存在，但尚未发布任何Release版本。\n\n这是正常情况，说明项目还在开发中。',
                        'release_date': current_data.get('build_date', ''),
                        'download_url': f'https://github.com/{repo}',
                        'check_time': datetime.now().isoformat(),
                        'mode': 'no_releases'
                    }
            except:
                pass
        raise e
        
    except Exception as e:
        raise e
    
    return None

if __name__ == '__main__':
    # 启动Flask应用
    port = int(os.environ.get('PORT', 7070))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting server on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=debug, allow_unsafe_werkzeug=True)