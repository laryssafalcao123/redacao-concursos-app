@echo off
title Redacao Aprovada 2.0 - Servidor Full-Stack com Cascata de IA e Google Auth
echo ========================================================
echo   REDACAO APROVADA 2.0 - SERVIDOR BACKEND SEGURO
echo   - Cascata de Modelos de IA: Gemini, OpenAI, Claude, Motor Local
echo   - Autenticacao Google com Reconhecimento de Primeiro Login
echo   - Persistencia de Redacoes e Assuntos Salvos
echo ========================================================
echo.
echo Iniciando o servidor Node.js...
start http://localhost:3000
node "%~dp0server.js"
pause
