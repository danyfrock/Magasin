@echo off
cd /d "%~dp0"

:: 1. Démarrer le serveur s'il n'est pas déjà lancé
tasklist /fi "imagename eq Magasin.Api.exe" | find /i "Magasin.Api.exe" > nul

if errorlevel 1 (
    start "" "Magasin.Api.exe"
)

:: 2. Attendre que le serveur réponde (max ~10 s)
echo Demarrage de Magasin en cours...

set /a compteur=0

:attente_serveur

timeout /t 1 /nobreak > nul
set /a compteur+=1

powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5143/index.html' -UseBasicParsing -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" > nul 2>&1

if not errorlevel 1 goto serveur_pret

if %compteur% geq 10 goto serveur_trop_long

goto attente_serveur

:serveur_trop_long

echo Le serveur met trop de temps a demarrer.
echo Ouverture du navigateur malgre tout...

:serveur_pret

:: 3. Récupérer une IP LAN utilisable
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Sort-Object InterfaceMetric | Select-Object -First 1).IPAddress; if ($ip) { $ip } else { '127.0.0.1' }"') do set IP=%%a

echo.
echo ========================================
echo  Magasin est pret !
echo  Adresse locale  : http://127.0.0.1:5143
echo  Adresse reseau  : http://%IP%:5143
echo  (Donnez cette adresse aux autres appareils)
echo ========================================
echo.

:: 4. Ouvrir le navigateur
start "" "http://%IP%:5143"
