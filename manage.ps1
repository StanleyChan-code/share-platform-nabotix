# Share Platform Nabotix Web 管理脚本

param(
    [string]$Action = "status"
)

$ContainerName = "share-platform-nabotix-web"

switch ($Action.ToLower()) {
    "start" {
        Write-Host "启动容器..." -ForegroundColor Green
        docker start $ContainerName
    }
    "stop" {
        Write-Host "停止容器..." -ForegroundColor Yellow
        docker stop $ContainerName
    }
    "restart" {
        Write-Host "重启容器..." -ForegroundColor Cyan
        docker restart $ContainerName
    }
    "logs" {
        Write-Host "查看日志 (Ctrl+C 退出)..." -ForegroundColor Magenta
        docker logs -f $ContainerName
    }
    "status" {
        Write-Host "容器状态:" -ForegroundColor Green
        docker ps -a --filter "name=$ContainerName" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.RunningFor}}"

        # 显示详细信息
        Write-Host "`n详细信息:" -ForegroundColor Cyan
        docker inspect $ContainerName --format='{{range .NetworkSettings.Networks}}IP: {{.IPAddress}}{{end}} | 镜像: {{.Config.Image}}'
    }
    "shell" {
        Write-Host "进入容器 (输入 exit 退出)..." -ForegroundColor Cyan
        docker exec -it $ContainerName sh
    }
    "remove" {
        Write-Host "删除容器和镜像..." -ForegroundColor Red
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
        docker rmi share-platform-nabotix-web 2>$null
        Write-Host "✓ 已清理完成" -ForegroundColor Green
    }
    "clean" {
        Write-Host "清理所有相关资源..." -ForegroundColor Red
        docker stop $ContainerName 2>$null
        docker rm $ContainerName 2>$null
        docker rmi share-platform-nabotix-web 2>$null
        docker network rm share-platform-network 2>$null
        Write-Host "✓ 系统清理完成" -ForegroundColor Green
    }
    default {
        Write-Host "可用命令:" -ForegroundColor Yellow
        Write-Host "  .\manage.ps1 status    - 查看状态" -ForegroundColor White
        Write-Host "  .\manage.ps1 start     - 启动容器" -ForegroundColor White
        Write-Host "  .\manage.ps1 stop      - 停止容器" -ForegroundColor White
        Write-Host "  .\manage.ps1 restart   - 重启容器" -ForegroundColor White
        Write-Host "  .\manage.ps1 logs      - 查看日志" -ForegroundColor White
        Write-Host "  .\manage.ps1 shell     - 进入容器" -ForegroundColor White
        Write-Host "  .\manage.ps1 remove    - 删除容器" -ForegroundColor White
        Write-Host "  .\manage.ps1 clean     - 彻底清理" -ForegroundColor White
    }
}