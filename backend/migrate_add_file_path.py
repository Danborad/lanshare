#!/usr/bin/env python3
"""
数据库迁移脚本：为 Message 表添加 file_path 字段
用于支持聊天文件独立存储
"""

import sqlite3
import os
from config import Config

def migrate_add_file_path():
    """为 Message 表添加 file_path 字段"""
    
    # 获取数据库路径
    database_path = Config.DATABASE_PATH
    
    # 如果是相对路径，转换为绝对路径
    if not os.path.isabs(database_path):
        database_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), database_path)
    
    if not os.path.exists(database_path):
        print(f"数据库文件不存在: {database_path}")
        return
    
    try:
        # 连接数据库
        conn = sqlite3.connect(database_path)
        cursor = conn.cursor()
        
        # 检查 file_path 字段是否已存在
        cursor.execute("PRAGMA table_info(messages)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'file_path' in columns:
            print("file_path 字段已存在，无需迁移")
            return
        
        print("开始添加 file_path 字段到 messages 表...")
        
        # 添加 file_path 字段
        cursor.execute("ALTER TABLE messages ADD COLUMN file_path TEXT")
        
        # 提交更改
        conn.commit()
        
        print("✅ 成功添加 file_path 字段")
        
        # 验证字段是否添加成功
        cursor.execute("PRAGMA table_info(messages)")
        columns = cursor.fetchall()
        
        print("\n当前 messages 表结构:")
        for column in columns:
            print(f"  {column[1]} ({column[2]})")
        
    except Exception as e:
        print(f"❌ 迁移失败: {str(e)}")
        
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    migrate_add_file_path()
