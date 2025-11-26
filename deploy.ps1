# Share Platform Nabotix Web 一键部署脚本

param(
    [string]$Environment = "dev",
    [int]$Port = 10025,
    [switch]$Quick = $false
)

Write-Host "=== Share Platform Nabotix Web 部署 ===" -ForegroundColor Green
Write-Host "环境: $Environment" -ForegroundColor Cyan
Write-Host "端口: $Port" -ForegroundColor Cyan
Write-Host "模式: $(if ($Quick) { '快速部署' } else { '完整部署' })" -ForegroundColor Cyan

# 检查 Docker 是否运行
try {
    $dockerVersion = docker version
    Write-Host "✓ Docker 已运行" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker 没有运行，请启动 Docker Desktop"
    exit 1
}

# 检查 dist 目录
if (-not (Test-Path "dist")) {
    Write-Error "❌ dist 目录不存在，请确认构建文件位置"
    Write-Host "当前目录文件:" -ForegroundColor Yellow
    Get-ChildItem -Name
    exit 1
}

# 检查 dist 目录内容
$distFiles = Get-ChildItem "dist"
if ($distFiles.Count -eq 0) {
    Write-Error "❌ dist 目录为空，请先构建项目"
    exit 1
}

Write-Host "✓ dist 目录检查通过 (包含 $($distFiles.Count) 个文件)" -ForegroundColor Green

# 停止并删除现有容器
Write-Host "`n🔄 清理现有容器..." -ForegroundColor Yellow
docker stop share-platform-nabotix-web 2>$null
docker rm share-platform-nabotix-web 2>$null

if (-not $Quick) {
    # 删除旧镜像
    Write-Host "🗑️  清理旧镜像..." -ForegroundColor Yellow
    docker rmi share-platform-nabotix-web 2>$null

    # 构建新镜像
    Write-Host "🔨 构建 Docker 镜像..." -ForegroundColor Green
    docker build -t share-platform-nabotix-web .

    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ 镜像构建失败"
        exit 1
    }
}

# 运行容器
Write-Host "🚀 启动容器..." -ForegroundColor Green
$runCommand = @(
    "run", "-d",
    "-p", "${Port}:80",
    "--name", "share-platform-nabotix-web",
    "--restart", "unless-stopped"
)

if ($Quick) {
    # 快速模式：直接使用 nginx 镜像挂载 volume
    $runCommand += @(
        "-v", "${PWD}/dist:/usr/share/nginx/html:ro",
        "-v", "${PWD}/nginx.conf:/etc/nginx/nginx.conf:ro",
        "nginx:alpine"
    )
} else {
    $runCommand += "share-platform-nabotix-web"
}

docker @runCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 容器启动失败"
    exit 1
}

# 等待启动
Write-Host "⏳ 等待应用启动..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

# 检查部署结果
Write-Host "`n📊 部署结果检查:" -ForegroundColor Green

# 检查容器状态
$containerInfo = docker ps --filter "name=share-platform-nabotix-web" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host "容器状态:" -ForegroundColor Cyan
Write-Host $containerInfo

# 健康检查
Write-Host "健康检查:" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:${Port}/health" -TimeoutSec 10
    $content = [System.Text.Encoding]::UTF8.GetString($healthResponse.Content).Trim()
    Write-Host "✓ 健康检查通过: $content" -ForegroundColor Green
} catch {
    Write-Host "⚠️  健康检查失败: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 最终信息
Write-Host "`n🎉 部署完成！" -ForegroundColor Green
Write-Host "📍 应用地址: http://localhost:${Port}" -ForegroundColor Yellow
Write-Host "📝 容器名称: share-platform-nabotix-web" -ForegroundColor Cyan
Write-Host "🔧 管理模式: .\manage.ps1 [status|logs|restart|stop]" -ForegroundColor White

if (-not $Quick) {
    Write-Host "`n💡 提示: 下次部署可使用 -Quick 参数快速启动" -ForegroundColor Magenta
    Write-Host "    示例: .\deploy.ps1 -Quick" -ForegroundColor Magenta
}