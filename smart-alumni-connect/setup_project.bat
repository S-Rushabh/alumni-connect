@echo off
echo ==========================================
echo   Smart Alumni Connect - Setup Script
echo ==========================================

echo [1/2] Installing Web Frontend Dependencies...
cd web
call npm install
cd ..

echo [2/2] Installing AI Engine Dependencies...
cd ai-engine
pip install -r requirements.txt
cd ..

echo ==========================================
echo   Setup Complete! You can now run the app.
echo ==========================================
pause
