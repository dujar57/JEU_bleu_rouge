# Script de deploiement Render

Write-Host "`nDEPLOIEMENT VERS RENDER - Jeu Bleu vs Rouge`n" -ForegroundColor Cyan

# Verifier Git
try {
    git --version | Out-Null
    Write-Host "Git detecte" -ForegroundColor Green
} catch {
    Write-Host "Git non installe !" -ForegroundColor Red
    exit 1
}

# Statut Git
Write-Host "`nFichiers modifies:" -ForegroundColor Cyan
git status --short

# Demander message de commit
Write-Host "`nMessage de commit (ou Entree pour message par defaut):" -ForegroundColor Cyan
$commitMessage = Read-Host
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Deploiement: Pages vintage + Config Render 100%"
}

# Ajouter tous les fichiers
Write-Host "`nAjout des fichiers..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "Creation du commit..." -ForegroundColor Cyan
try {
    git commit -m $commitMessage
} catch {
    Write-Host "Aucun changement a commiter ou erreur" -ForegroundColor Yellow
}

# Push
Write-Host "`nPush vers GitHub..." -ForegroundColor Cyan
try {
    git push
    Write-Host "`nDeploiement reussi !" -ForegroundColor Green
    Write-Host "Render va redeployer automatiquement (2-3 minutes)" -ForegroundColor Yellow
    Write-Host "Dashboard: https://dashboard.render.com`n" -ForegroundColor Cyan
} catch {
    Write-Host "`nErreur lors du push:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nPremiere fois ? Configurez Git:" -ForegroundColor Yellow
    Write-Host "   git config --global user.name `"Votre Nom`"" -ForegroundColor Gray
    Write-Host "   git config --global user.email `"votre@email.com`"" -ForegroundColor Gray
    exit 1
}
