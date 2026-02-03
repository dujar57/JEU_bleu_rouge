# Script de vérification et correction d'encodage UTF-8
# Usage: .\verify-encoding.ps1

Write-Host "🔍 Vérification de l'encodage UTF-8..." -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier l'encodage d'un fichier
function Test-FileEncoding {
    param(
        [string]$FilePath
    )
    
    try {
        $bytes = [System.IO.File]::ReadAllBytes($FilePath)
        
        # Vérifier BOM UTF-8 (EF BB BF)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            return "UTF-8 avec BOM"
        }
        
        # Tenter de décoder en UTF-8
        try {
            $encoding = New-Object System.Text.UTF8Encoding($false, $true)
            $reader = New-Object System.IO.StreamReader($FilePath, $encoding)
            $null = $reader.ReadToEnd()
            $reader.Close()
            return "UTF-8 sans BOM"
        }
        catch {
            return "Autre encodage"
        }
    }
    catch {
        return "Erreur de lecture"
    }
}

# Fonction pour convertir en UTF-8 sans BOM
function ConvertTo-UTF8NoBOM {
    param(
        [string]$FilePath
    )
    
    try {
        $content = Get-Content -Path $FilePath -Raw -Encoding UTF8
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($FilePath, $content, $utf8NoBom)
        Write-Host "  ✅ Converti: $FilePath" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ❌ Erreur: $FilePath - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Liste des extensions à vérifier
$extensions = @("*.css", "*.js", "*.jsx", "*.html", "*.json", "*.md")

Write-Host "📁 Fichiers à vérifier:" -ForegroundColor Yellow
Write-Host ""

$totalFiles = 0
$utf8Files = 0
$convertedFiles = 0
$errorFiles = 0

foreach ($ext in $extensions) {
    $files = Get-ChildItem -Path . -Filter $ext -Recurse -File | 
             Where-Object { $_.FullName -notmatch "node_modules|\.git|dist|build" }
    
    foreach ($file in $files) {
        $totalFiles++
        $encoding = Test-FileEncoding -FilePath $file.FullName
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        
        if ($encoding -eq "UTF-8 sans BOM" -or $encoding -eq "UTF-8 avec BOM") {
            Write-Host "  ✅ $relativePath" -ForegroundColor Green -NoNewline
            Write-Host " [$encoding]" -ForegroundColor DarkGray
            $utf8Files++
        }
        else {
            Write-Host "  ⚠️  $relativePath" -ForegroundColor Yellow -NoNewline
            Write-Host " [$encoding]" -ForegroundColor DarkYellow
            
            # Demander si on doit convertir
            $response = Read-Host "     Convertir en UTF-8 sans BOM ? (O/N)"
            if ($response -eq "O" -or $response -eq "o") {
                if (ConvertTo-UTF8NoBOM -FilePath $file.FullName) {
                    $convertedFiles++
                }
                else {
                    $errorFiles++
                }
            }
        }
    }
}

Write-Host ""
Write-Host "📊 Résumé:" -ForegroundColor Cyan
Write-Host "  Total de fichiers vérifiés: $totalFiles"
Write-Host "  Fichiers déjà en UTF-8: $utf8Files" -ForegroundColor Green
Write-Host "  Fichiers convertis: $convertedFiles" -ForegroundColor Yellow
Write-Host "  Erreurs: $errorFiles" -ForegroundColor Red
Write-Host ""

# Vérifier les caractères corrompus dans les fichiers CSS et JS
Write-Host "🔍 Recherche de caractères corrompus..." -ForegroundColor Cyan
$corruptedPatterns = @(
    "Ã©", "Ã¨", "Ã ", "Ã´", "Ã®", "Ã§", 
    "Ãƒ", "Â©", "Â¨", "Â ", "â€"
)

$foundCorruption = $false
foreach ($pattern in $corruptedPatterns) {
    $results = Get-ChildItem -Path . -Include "*.css", "*.js", "*.jsx", "*.html" -Recurse -File |
               Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
               Select-String -Pattern $pattern -SimpleMatch
    
    if ($results) {
        $foundCorruption = $true
        Write-Host ""
        Write-Host "  ⚠️  Caractères corrompus trouvés: '$pattern'" -ForegroundColor Red
        foreach ($result in $results) {
            $relativePath = $result.Path.Replace($PWD.Path + "\", "")
            Write-Host "     Ligne $($result.LineNumber): $relativePath" -ForegroundColor Yellow
            Write-Host "     > $($result.Line.Trim())" -ForegroundColor DarkYellow
        }
    }
}

if (-not $foundCorruption) {
    Write-Host "  ✅ Aucun caractère corrompu détecté !" -ForegroundColor Green
}

Write-Host ""
Write-Host "🧪 Test du serveur..." -ForegroundColor Cyan

# Vérifier si Node.js est installé
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host "  ✅ Node.js détecté: $(node --version)" -ForegroundColor Green
    
    # Vérifier package.json
    if (Test-Path "package.json") {
        Write-Host "  ✅ package.json trouvé" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "💡 Commandes disponibles:" -ForegroundColor Yellow
        Write-Host "   npm install           # Installer les dépendances"
        Write-Host "   npm start            # Démarrer le serveur"
        Write-Host "   npm run dev          # Mode développement"
        Write-Host ""
        Write-Host "🌐 Pages de test:" -ForegroundColor Yellow
        Write-Host "   http://localhost:3000/                    # Page principale"
        Write-Host "   http://localhost:3000/test-encodage.html  # Test d'encodage UTF-8"
    }
}
else {
    Write-Host "  ⚠️  Node.js non détecté. Installez-le depuis https://nodejs.org/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Vérification terminée !" -ForegroundColor Green
Write-Host ""
