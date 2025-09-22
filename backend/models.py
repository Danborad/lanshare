# type: ignore[import-untyped]
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Boolean  # type: ignore[import-untyped]
from sqlalchemy.ext.declarative import declarative_base  # type: ignore[import-untyped]
from sqlalchemy.orm import sessionmaker  # type: ignore[import-untyped]
from datetime import datetime, timedelta
import os

Base = declarative_base()

class FileRecord(Base):
    __tablename__ = 'files'
    
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    upload_time = Column(DateTime, default=datetime.now)
    expire_time = Column(DateTime, default=lambda: datetime.now() + timedelta(days=15))  # 默认15天过期
    uploader_ip = Column(String(45))
    uploader_name = Column(String(100), default='匿名用户')
    channel = Column(String(50), default='default')
    file_type = Column(String(50))
    is_deleted = Column(Boolean, default=False)

class Message(Base):
    __tablename__ = 'messages'
    
    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    sender_ip = Column(String(45))
    sender_name = Column(String(100), default='匿名用户')
    send_time = Column(DateTime, default=datetime.now)
    channel = Column(String(50), default='default')
    message_type = Column(String(20), default='text')  # text, file, image
    file_id = Column(Integer, nullable=True)  # 关联的文件ID（用于传输列表文件）
    file_path = Column(String(500), nullable=True)  # 聊天文件的直接路径
    file_name = Column(String(255), nullable=True)  # 文件名
    file_size = Column(Integer, nullable=True)  # 文件大小
    file_type = Column(String(50), nullable=True)  # 文件类型
    is_deleted = Column(Boolean, default=False)

def init_db(database_path):
    """初始化数据库"""
    os.makedirs(os.path.dirname(database_path), exist_ok=True)
    engine = create_engine(f'sqlite:///{database_path}')
    Base.metadata.create_all(engine)
    return engine, sessionmaker(bind=engine)