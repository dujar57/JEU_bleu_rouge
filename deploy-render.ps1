# -*- coding: utf-8 -*-
# Script de déploiement automatique vers Render

Write-Host "`n🚀 Déploiement vers Render - Jeu Bleu vs Rouge" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

# Vérifier si Git est installé
try {
    git --version | Out-Null
    Write-Host "✅ Git détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Git n'est pas installé !" -ForegroundColor Red
    Write-Host "   Téléchargez-le sur : https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}

# Se placer dans le bon dossier
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "📁 Dossier : $scriptPath" -ForegroundColor Gray

# Vérifier le statut Git
Write-Host "`n📊 Vérification des fichiers modifiés..." -ForegroundColor Cyan
git status --short

# Demander confirmation
Write-Host "`n❓ Voulez-vous déployer ces modifications sur Render ? (O/N)" -ForegroundColor Yellow
$confirmation = Read-Host

if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "❌ Déploiement annulé" -ForegroundColor Red
    exit 0
}

# Demander un message de commit
Write-Host "`n💬 Message de commit (appuyez sur Entrée pour le message par défaut) :" -ForegroundColor Cyan
$commitMessage = Read-Host
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "✨ Configuration UTF-8 + URLs production Render"
}

# Ajouter tous les fichiers
Write-Host "`n📦 Ajout des fichiers..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "💾 Création du commit..." -ForegroundColor Cyan
git commit -m $commitMessage

# Push vers GitHub
Write-Host "🚀 Envoi vers GitHub..." -ForegroundColor Cyan
try {
    git push
    Write-Host "`n✅ Push réussi !" -ForegroundColor Green
    Write-Host "`n🎉 Render va détecter les changements et redéployer automatiquement" -ForegroundColor Green
    Write-Host "⏱️  Attendez 2-3 minutes puis vérifiez :" -ForegroundColor Yellow
    Write-Host "   👉 https://jeu-bleu-rouge.onrender.com" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Erreur lors du push" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    Write-Host "`n💡 Première fois ? Configurez Git :" -ForegroundColor Yellow
    Write-Host '   git config --global user.name "Votre Nom"' -ForegroundColor Gray
    Write-Host '   git config --global user.email "votre@email.com"' -ForegroundColor Gray
    exit 1
}

Write-Host "`n✨ Déploiement terminé !" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Gray
