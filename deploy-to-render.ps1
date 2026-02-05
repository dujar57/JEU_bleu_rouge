# Script de déploiement sur Render
# Usage: .\deploy-to-render.ps1 "Message de commit"

param(
    [string]$CommitMessage = "Update: Deploy to Render"
)

Write-Host "🚀 Déploiement sur Render..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "server.js")) {
    Write-Host "❌ Erreur: server.js introuvable. Exécutez ce script depuis le dossier JeuBleuRouge" -ForegroundColor Red
    exit 1
}

# Étape 1: Construction du client React
Write-Host "📦 Construction du client React..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction du client" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Client construit avec succès" -ForegroundColor Green
Write-Host ""

# Étape 2: Vérifier que le dossier dist existe
if (-not (Test-Path "client\dist")) {
    Write-Host "❌ Erreur: Le dossier client\dist n'existe pas" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dossier dist vérifié" -ForegroundColor Green
Write-Host ""

# Étape 3: Git add
Write-Host "📝 Ajout des fichiers à Git..." -ForegroundColor Yellow
git add -A
Write-Host "✅ Fichiers ajoutés" -ForegroundColor Green
Write-Host ""

# Étape 4: Git status
Write-Host "📋 Statut Git:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Étape 5: Demander confirmation
$confirmation = Read-Host "Voulez-vous continuer avec le commit et le push? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o") {
    Write-Host "⚠️ Déploiement annulé" -ForegroundColor Yellow
    exit 0
}

# Étape 6: Git commit
Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Aucun changement à commiter ou erreur" -ForegroundColor Yellow
}
Write-Host "✅ Commit créé" -ForegroundColor Green
Write-Host ""

# Étape 7: Git push
Write-Host "🚀 Push vers GitHub..." -ForegroundColor Yellow
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du push" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Push réussi" -ForegroundColor Green
Write-Host ""

# Récapitulatif
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ Déploiement terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Votre application sera disponible sur:" -ForegroundColor White
Write-Host "   https://jeu-bleu-rouge.onrender.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏱️  Le déploiement prendra environ 2-3 minutes" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 Suivez le déploiement sur:" -ForegroundColor White
Write-Host "   https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
