$body = @{
    instanceName = "aloai"
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

Write-Host "Tentando criar instancia aloai na Evolution API v2..."
try {
    $result = Invoke-RestMethod -Uri "https://evolution-api-production-2fc5.up.railway.app/v2/instance/create" -Method POST -Headers @{
        "apikey" = "ev0-k3yx9mz2pqr8w4h7c5n6b3a1"
        "Content-Type" = "application/json"
    } -Body $body
    Write-Host "Resposta:"
    $result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro: $_"
}
