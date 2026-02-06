@echo off
echo ==========================================
echo   Starting Smart Alumni Connect 🚀
echo ==========================================

echo Starting AI Engine (Port 8000)...
start "AI Engine" cmd /k "cd ai-engine && python main.py"

echo Starting Web Frontend (Port 5173)...
start "Web App" cmd /k "cd web && npm run dev"

echo All services launched! Opening browser...
timeout /t 5
start http://localhost:5173
