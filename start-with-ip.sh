#!/bin/bash

# LanShare Docker 智能启动脚本 (Linux/Mac)
echo "LanShare Docker 智能启动脚本"
echo

# 获取本机局域网IP
get_local_ip() {
    local ip=""
    
    # 方法1: 通过ip route
    if command -v ip &> /dev/null; then
        ip=$(ip route get 1 | awk '{print $7}' | head -n1)
    fi
    
    # 方法2: 通过ifconfig
    if [ -z "$ip" ] && command -v ifconfig &> /dev/null; then
        ip=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -n1)
    fi
    
    # 方法3: 通过hostname
    if [ -z "$ip" ]; then
        ip=$(hostname -I | awk '{print $1}')
    fi
    
    echo "$ip"
}

# 获取所有可能的IP
get_all_ips() {
    local ips=()
    
    if command -v ip &> /dev/null; then
        while IFS= read -r line; do
            if [[ $line =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && [[ $line != "127."* ]] && [[ $line != "169.254."* ]]; then
                ips+=("$line")
            fi
        done < <(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
    elif command -v ifconfig &> /dev/null; then
        while IFS= read -r line; do
            if [[ $line =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && [[ $line != "127."* ]] && [[ $line != "169.254."* ]]; then
                ips+=("$line")
            fi
        done < <(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*')
    fi
    
    printf '%s\n' "${ips[@]}"
}

# 主逻辑
LOCAL_IP=$(get_local_ip)
ALL_IPS=($(get_all_ips))

if [ ${#ALL_IPS[@]} -eq 0 ]; then
    echo "无法自动检测到局域网IP"
    read -p "请输入局域网IP地址: " LOCAL_IP
elif [ ${#ALL_IPS[@]} -eq 1 ]; then
    LOCAL_IP=${ALL_IPS[0]}
    echo "检测到局域网IP: $LOCAL_IP"
else
    echo "检测到多个局域网IP:"
    for i in "${!ALL_IPS[@]}"; do
        echo "$((i+1)). ${ALL_IPS[i]}"
    done
    
    read -p "请选择IP序号 (1-${#ALL_IPS[@]}): " selection
    
    if [[ $selection =~ ^[0-9]+$ ]] && [ $selection -ge 1 ] && [ $selection -le ${#ALL_IPS[@]} ]; then
        LOCAL_IP=${ALL_IPS[$((selection-1))]}
    else
        LOCAL_IP=${ALL_IPS[0]}
        echo "输入无效，使用第一个IP: $LOCAL_IP"
    fi
fi

echo
echo "正在启动LanShare，使用IP: $LOCAL_IP"
echo

# 设置环境变量并启动
export HOST_IP=$LOCAL_IP
echo "环境变量 HOST_IP 设置为: $HOST_IP"

# 启动Docker Compose
docker-compose -f docker-compose-ready.yml up --build