@echo off
cd /d "%~dp0"

:: 1. Tuer l'éventuel ancien processus
taskkill /f /im Magasin.Api.exe >nul 2>&1
timeout /t 1 /nobreak > nul

:: 2. Démarrer le serveur
start "Magasin API" Magasin.Api.exe

:: 3. Attendre que le serveur réponde (max 15 s)
echo Demarrage de Magasin en cours...

set /a compteur=0

:attente_serveur
timeout /t 1 /nobreak > nul
set /a compteur+=1

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5143/' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" > nul 2>&1

if not errorlevel 1 goto serveur_pret
if %compteur% geq 15 goto serveur_pret
goto attente_serveur

:serveur_pret

:: 4. Récupérer une IP LAN
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress; if ($ip) { $ip } else { '127.0.0.1' }"') do set IP=%%a

echo.
echo ========================================
echo  Magasin est pret !
echo  Adresse locale  : http://127.0.0.1:5143
echo  Adresse reseau  : http://%IP%:5143
echo ========================================
echo.

:: 5. Ouvrir le navigateur
start "" "http://%IP%:5143"