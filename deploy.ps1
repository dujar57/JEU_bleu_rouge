# Script de déploiement Render

Write-Host "`n🚀 Déploiement vers Render - Jeu Bleu vs Rouge`n" -ForegroundColor Cyan

# Vérifier Git
try {
    git --version | Out-Null
    Write-Host "✅ Git détecté" -ForegroundColor Green
} catch {
    Write-Host "❌ Git non installé !" -ForegroundColor Red
    exit 1
}

# Statut Git
Write-Host "`n📊 Fichiers modifiés:" -ForegroundColor Cyan
git status --short

# Demander message de commit
Write-Host "`n💬 Message de commit (ou Entrée pour message par défaut):" -ForegroundColor Cyan
$commitMessage = Read-Host
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "✨ Déploiement: Pages vintage + Config Render 100%"
}

# Ajouter tous les fichiers
Write-Host "`n📦 Ajout des fichiers..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "💾 Création du commit..." -ForegroundColor Cyan
try {
    git commit -m $commitMessage
} catch {
    Write-Host "⚠️ Aucun changement à commiter ou erreur" -ForegroundColor Yellow
}

# Push
Write-Host "`n🚀 Push vers GitHub..." -ForegroundColor Cyan
try {
    git push
    Write-Host "`n✅ Déploiement réussi !" -ForegroundColor Green
    Write-Host "⏱️ Render va redéployer automatiquement (2-3 minutes)" -ForegroundColor Yellow
    Write-Host "🌐 Dashboard: https://dashboard.render.com`n" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Erreur lors du push:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`n💡 Première fois ? Configurez Git:" -ForegroundColor Yellow
    Write-Host "   git config --global user.name `"Votre Nom`"" -ForegroundColor Gray
    Write-Host "   git config --global user.email `"votre@email.com`"" -ForegroundColor Gray
    exit 1
}
