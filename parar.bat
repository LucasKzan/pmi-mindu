@echo off
REM SIGWEB - encerra os servicos das portas 8000 e 3000
for %%P in (8000 3000) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do taskkill /F /T /PID %%I >nul 2>&1
)
taskkill /F /FI "WINDOWTITLE eq SIGWEB*" >nul 2>&1
echo Servicos SIGWEB encerrados.
