#!/usr/bin/env python3
"""
数据库迁移脚本：为现有文件添加过期时间字段
"""

import os
import sys
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import FileRecord, init_db
from config import Config

def migrate_add_expiry():
    """为现有文件添加过期时间"""
    print("开始数据库迁移：添加文件过期时间...")
    
    # 初始化数据库连接
    engine, Session = init_db(Config.DATABASE_PATH)
    session = Session()
    
    try:
        # 检查expire_time列是否已存在
        result = session.execute(text("PRAGMA table_info(files)"))
        columns = [row[1] for row in result.fetchall()]
        
        if 'expire_time' not in columns:
            print("添加expire_time列...")
            # 添加expire_time列
            session.execute(text("ALTER TABLE files ADD COLUMN expire_time DATETIME"))
            session.commit()
            print("expire_time列添加成功")
        else:
            print("expire_time列已存在")
        
        # 为现有的没有过期时间的文件设置默认过期时间（15天后）
        files_without_expiry = session.query(FileRecord).filter(
            FileRecord.expire_time == None
        ).all()
        
        if files_without_expiry:
            print(f"找到 {len(files_without_expiry)} 个没有过期时间的文件，正在设置默认过期时间...")
            
            for file_record in files_without_expiry:
                # 设置过期时间为上传时间 + 15天
                file_record.expire_time = file_record.upload_time + timedelta(days=15)
            
            session.commit()
            print(f"已为 {len(files_without_expiry)} 个文件设置默认过期时间")
        else:
            print("所有文件都已有过期时间")
            
        print("数据库迁移完成！")
        
    except Exception as e:
        print(f"迁移失败: {e}")
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    migrate_add_expiry()