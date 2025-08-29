import os
import uuid
import socket
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_file, abort, send_from_directory
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

# 配置Flask应用，设置静态文件目录
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
app = Flask(__name__, static_folder=static_folder, static_url_path='')
app.config.from_object(Config)
CORS(app, origins="*")
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=app.config['SOCKETIO_ASYNC_MODE'])

# 初始化数据库
engine, Session = init_db(app.config['DATABASE_PATH'])

# 前端静态文件服务
@app.route('/')
def serve_frontend():
    """服务前端首页"""
    return send_from_directory(app.static_folder, 'index.html')

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
            except:
                pass
                
            # 2.2 从环境变量获取Docker宿主机的局域网IP
            docker_host_ip = os.environ.get('DOCKER_HOST_IP')
            if docker_host_ip and docker_host_ip not in [item['ip'] for item in ips]:
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
        'client_ip': client_ip  # 返回客户端IP供调试使用
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
    
    qr_img = qrcode.make_image(fill_color="black", back_color="white")
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
            # 生成唯一文件名
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
                    original_filename=filename,
                    file_size=file_size,
                    file_path=file_path,
                    uploader_ip=request.remote_addr,
                    uploader_name=uploader_name,
                    channel=channel,
                    file_type=get_file_type(filename)
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
        
        # 删除物理文件
        try:
            if os.path.exists(file_record.file_path):
                os.remove(file_record.file_path)
        except:
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
                'message_type': msg.message_type
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
    
    if not content:
        return jsonify({'error': '消息内容不能为空'}), 400
    
    session = Session()
    
    try:
        message = Message(
            content=content,
            sender_ip=request.remote_addr,
            sender_name=sender_name,
            channel=channel,
            message_type=message_type
        )
        
        session.add(message)
        session.commit()
        
        # 通过WebSocket广播消息
        socketio.emit('new_message', {
            'id': message.id,
            'content': content,
            'sender_name': sender_name,
            'send_time': int(message.send_time.timestamp() * 1000),  # 返回毫秒时间戳
            'message_type': message_type
        }, room=channel)
        
        return jsonify({'message': '消息发送成功'})
    
    finally:
        session.close()

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

# ... existing code ...

@app.route('/health')
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'lanshare'
    }), 200

if __name__ == '__main__':
    # 启动Flask应用
    port = int(os.environ.get('PORT', 7070))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"Starting server on port {port}")
    socketio.run(app, host='0.0.0.0', port=port, debug=debug)