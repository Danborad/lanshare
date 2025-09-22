import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'lanshare-secret-key-2025')
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
    DATABASE_PATH = os.environ.get('DATABASE_PATH', './data/lanshare.db')
    MAX_CONTENT_LENGTH = None  # 无文件大小限制
    
    # WebSocket配置
    SOCKETIO_ASYNC_MODE = 'threading'
    
    # 支持的文件类型（已取消限制，支持所有类型）
    ALLOWED_EXTENSIONS = set()  # 空集合表示支持所有类型
    
    # 自动清理设置
    AUTO_CLEAN_DAYS = int(os.environ.get('AUTO_CLEAN_DAYS', 7))