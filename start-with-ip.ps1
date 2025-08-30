# LanShare Docker 智能启动脚本
Write-Host "LanShare Docker 智能启动脚本" -ForegroundColor Green
Write-Host ""

# 获取所有可能的局域网IP
function Get-LocalNetworkIPs {
    $ips = @()
    
    # 方法1: 通过ipconfig获取
    try {
        $ipconfig = ipconfig
        $adapter = $false
        foreach ($line in $ipconfig) {
            if ($line -match "^以太网适配器|^无线局域网适配器") {
                $adapter = $true
                continue
            }
            if ($adapter -and $line -match "IPv4.*: (\d+\.\d+\.\d+\.\d+)") {
                $ip = $matches[1]
                if ($ip -notlike "127.*" -and $ip -notlike "169.254.*") {
                    $ips += $ip
                    $adapter = $false
                }
            }
        }
    } catch {
        Write-Host "无法通过ipconfig获取IP" -ForegroundColor Yellow
    }
    
    # 方法2: 通过网络接口
    try {
        $networkInterfaces = [System.Net.NetworkInformation.NetworkInterface]::GetAllNetworkInterfaces()
        foreach ($interface in $networkInterfaces) {
            if ($interface.OperationalStatus -eq "Up") {
                $properties = $interface.GetIPProperties()
                foreach ($address in $properties.UnicastAddresses) {
                    if ($address.Address.AddressFamily -eq "InterNetwork") {
                        $ip = $address.Address.ToString()
                        if ($ip -notlike "127.*" -and $ip -notlike "169.254.*") {
                            $ips += $ip
                        }
                    }
                }
            }
        }
    } catch {
        Write-Host "无法通过网络接口获取IP" -ForegroundColor Yellow
    }
    
    return $ips | Select-Object -Unique
}

# 获取IP列表
$localIPs = Get-LocalNetworkIPs

if ($localIPs.Count -eq 0) {
    Write-Host "无法自动检测到局域网IP，请手动输入" -ForegroundColor Red
    $selectedIP = Read-Host "请输入局域网IP地址"
} elseif ($localIPs.Count -eq 1) {
    $selectedIP = $localIPs[0]
    Write-Host "检测到局域网IP: $selectedIP" -ForegroundColor Green
} else {
    Write-Host "检测到多个局域网IP:" -ForegroundColor Yellow
    for ($i = 0; $i -lt $localIPs.Count; $i++) {
        Write-Host "$($i+1). $($localIPs[$i])"
    }
    
    $selection = Read-Host "请选择IP序号 (1-$($localIPs.Count))"
    try {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $localIPs.Count) {
            $selectedIP = $localIPs[$index]
        } else {
            $selectedIP = $localIPs[0]
            Write-Host "输入无效，使用第一个IP: $selectedIP" -ForegroundColor Yellow
        }
    } catch {
        $selectedIP = $localIPs[0]
        Write-Host "输入无效，使用第一个IP: $selectedIP" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "正在启动LanShare，使用IP: $selectedIP" -ForegroundColor Green
Write-Host ""

# 设置环境变量并启动
try {
    $env:HOST_IP = $selectedIP
    Write-Host "环境变量 HOST_IP 设置为: $env:HOST_IP" -ForegroundColor Cyan
    
    # 启动Docker Compose
    docker-compose -f docker-compose-ready.yml up --build
} catch {
    Write-Host "启动失败: $_" -ForegroundColor Red
    Read-Host "按任意键退出"
}