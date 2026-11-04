@echo off
REM SIGWEB - sobe backend (porta 8000) e frontend (porta 3000) em janelas separadas
cd /d "%~dp0"
echo Iniciando SIGWEB...
start "SIGWEB Backend (8000)" cmd /k "python backend\api\main.py"
start "SIGWEB Frontend (3000)" cmd /k "npm --prefix frontend\sigweb-dashboard run dev"
timeout /t 8 >nul
start http://localhost:3000
start http://localhost:3000/adm
echo Servicos iniciados. Para encerrar execute parar.bat
