# Générer un certificat SSL auto-signé pour HTTPS
$cert = New-SelfSignedCertificate -DnsName "bvr", "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)
$pwd = ConvertTo-SecureString -String "password" -Force -AsPlainText
$path = "cert:\LocalMachine\My\$($cert.Thumbprint)"
Export-PfxCertificate -Cert $path -FilePath "$PSScriptRoot\server.pfx" -Password $pwd
Write-Host "Certificat généré avec succès!" -ForegroundColor Green
