$body = @{
    instanceName = "aloai"
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

$evolutionUrl = $env:EVOLUTION_URL
$evolutionApiKey = $env:EVOLUTION_API_KEY

if (-not $evolutionUrl -or -not $evolutionApiKey) {
    Write-Host "Defina EVOLUTION_URL e EVOLUTION_API_KEY antes de executar este teste."
    exit 1
}

Write-Host "Tentando criar instancia aloai na Evolution API v2..."
try {
    $result = Invoke-RestMethod -Uri "$evolutionUrl/v2/instance/create" -Method POST -Headers @{
        "apikey" = $evolutionApiKey
        "Content-Type" = "application/json"
    } -Body $body
    Write-Host "Resposta:"
    $result | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Erro: $_"
}
