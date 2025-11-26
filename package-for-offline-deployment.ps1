# Share Platform Nabotix - 离线部署包打包脚本
# 该脚本用于创建可在无网络环境下部署的Docker镜像包

Write-Host "=== Share Platform Nabotix 离线部署包生成工具 ===" -ForegroundColor Green

# 检查Docker是否运行
try {
    $dockerVersion = docker version
    Write-Host "✓ Docker 已运行" -ForegroundColor Green
} catch {
    Write-Error "❌ Docker 没有运行，请启动 Docker Desktop"
    exit 1
}

# 检查dist目录
if (-not (Test-Path "dist")) {
    Write-Host "正在构建项目..."
    npm run build
}

# 检查dist目录内容
$distFiles = Get-ChildItem "dist"
if ($distFiles.Count -eq 0) {
    Write-Error "❌ dist 目录为空，请先构建项目"
    exit 1
}

Write-Host "✓ dist 目录检查通过 (包含 $($distFiles.Count) 个文件)" -ForegroundColor Green

# 构建Docker镜像
Write-Host "`n🔨 正在构建 Docker 镜像..." -ForegroundColor Green
docker build -t share-platform-nabotix-web .

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 镜像构建失败"
    exit 1
}

Write-Host "✓ 镜像构建完成" -ForegroundColor Green

# 导出镜像为tar文件
Write-Host "`n📦 正在导出 Docker 镜像..." -ForegroundColor Green
docker save share-platform-nabotix-web -o share-platform-nabotix-image.tar

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 镜像导出失败"
    exit 1
}

Write-Host "✓ 镜像导出完成" -ForegroundColor Green

# 创建离线部署包
Write-Host "`n📦 正在创建离线部署包..." -ForegroundColor Green
tar -czvf share-platform-nabotix-offline-v2.tar.gz share-platform-nabotix-image.tar

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ 离线部署包创建失败"
    exit 1
}

Write-Host "✓ 离线部署包创建完成" -ForegroundColor Green

# 显示生成的文件信息
Write-Host "`n📄 生成的文件:" -ForegroundColor Cyan
Get-ChildItem share-platform-nabotix-image.tar | Format-Table Name, Length, LastWriteTime
Get-ChildItem share-platform-nabotix-offline-v2.tar.gz | Format-Table Name, Length, LastWriteTime

# 显示部署说明
Write-Host "`n🚀 部署说明:" -ForegroundColor Green
Write-Host "1. 将 share-platform-nabotix-offline-v2.tar.gz 传输到 CentOS 服务器" -ForegroundColor White
Write-Host "2. 在 CentOS 上执行以下命令:" -ForegroundColor White
Write-Host "   tar -xzvf share-platform-nabotix-offline-v2.tar.gz" -ForegroundColor Yellow
Write-Host "   docker load -i share-platform-nabotix-image.tar" -ForegroundColor Yellow
Write-Host "   docker run -d -p 10025:80 --name share-platform-nabotix-web share-platform-nabotix-web" -ForegroundColor Yellow
Write-Host "3. 访问应用: http://localhost:10025" -ForegroundColor White
Write-Host "   验证部署: curl http://localhost:10025" -ForegroundColor White

Write-Host "`n🎉 离线部署包已准备就绪！" -ForegroundColor Green