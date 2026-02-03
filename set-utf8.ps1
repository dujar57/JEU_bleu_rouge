# -*- coding: utf-8 -*-
# Script PowerShell pour forcer l'encodage UTF-8 dans tous les contextes

Write-Host "🔧 Configuration de l'encodage UTF-8..." -ForegroundColor Cyan

# Forcer UTF-8 pour la console PowerShell (code page 65001)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# Forcer UTF-8 pour le processus actuel
chcp 65001 | Out-Null

# Variables d'environnement pour Node.js
$env:NODE_OPTIONS = "--default-encoding=utf8"
$env:PYTHONIOENCODING = "utf-8"

Write-Host "✅ Encodage UTF-8 activé pour:" -ForegroundColor Green
Write-Host "   - Console PowerShell" -ForegroundColor White
Write-Host "   - Node.js" -ForegroundColor White
Write-Host "   - Encodage système (Code Page 65001)" -ForegroundColor White

Write-Host "`n💡 Pour rendre ces changements permanents:" -ForegroundColor Yellow
Write-Host "   Ajoutez ce script à votre profil PowerShell" -ForegroundColor White
Write-Host "   Profil: $PROFILE" -ForegroundColor Gray
