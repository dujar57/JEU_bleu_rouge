# Importer le certificat dans les autorités de confiance
$cert = Get-ChildItem -Path "cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*bvr*" } | Select-Object -First 1
if ($cert) {
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root","LocalMachine")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "Certificat ajouté aux autorités de confiance!" -ForegroundColor Green
} else {
    Write-Host "Certificat non trouvé" -ForegroundColor Red
}
