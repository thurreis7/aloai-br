[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [string]$ApiBaseUrl = $env:ALO_API_URL,
  [string]$FrontendBaseUrl = $env:ALO_FRONTEND_URL,
  [string]$WorkspaceId = $env:ALO_WORKSPACE_ID,
  [string]$ConversationId = $env:ALO_CONVERSATION_ID,
  [string]$Token = $env:ALO_TOKEN,
  [int]$TimeoutSec = 20,
  [switch]$IncludeMutations
)

$ErrorActionPreference = 'Stop'

$results = @()

function Add-Result {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )

  $entry = [pscustomobject]@{
    name = $Name
    status = $Status
    detail = $Detail
  }

  $script:results += $entry
  $color = if ($Status -eq 'PASS') { 'Green' } elseif ($Status -eq 'FAIL') { 'Red' } else { 'Yellow' }
  Write-Host "[$Status] $Name - $Detail" -ForegroundColor $color
}

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [hashtable]$Body,
    [switch]$Authenticated
  )

  $headers = @{}
  if ($Authenticated) {
    $headers.Authorization = "Bearer $Token"
  }

  $request = @{
    Method = $Method
    Uri = $Url
    TimeoutSec = $TimeoutSec
    Headers = $headers
    ErrorAction = 'Stop'
  }

  if ($Body) {
    $request.ContentType = 'application/json'
    $request.Body = ($Body | ConvertTo-Json -Depth 6)
  }

  return Invoke-RestMethod @request
}

function Invoke-SmokeStep {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  if (-not $PSCmdlet.ShouldProcess($Name, 'Run smoke step')) {
    Add-Result -Name $Name -Status 'SKIP' -Detail 'dry-run (-WhatIf)'
    return
  }

  try {
    & $Action
  } catch {
    Add-Result -Name $Name -Status 'FAIL' -Detail $_.Exception.Message
  }
}

if (-not $ApiBaseUrl) {
  if ($WhatIfPreference) {
    Add-Result -Name 'Bootstrap' -Status 'SKIP' -Detail 'dry-run sem ALO_API_URL'
    $ApiBaseUrl = 'http://localhost:3001'
  } else {
    Add-Result -Name 'Bootstrap' -Status 'FAIL' -Detail 'Defina ALO_API_URL (ou -ApiBaseUrl).'
    exit 1
  }
}

$ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')
$hasAuthContext = -not [string]::IsNullOrWhiteSpace($Token) -and -not [string]::IsNullOrWhiteSpace($WorkspaceId) -and -not [string]::IsNullOrWhiteSpace($ConversationId)

Invoke-SmokeStep -Name 'API health' -Action {
  $health = Invoke-JsonRequest -Method 'GET' -Url "$ApiBaseUrl/health"
  if (-not $health.status) { throw 'Resposta sem campo status.' }
  Add-Result -Name 'API health' -Status 'PASS' -Detail ("status={0}" -f $health.status)
}

if ($FrontendBaseUrl) {
  $frontend = $FrontendBaseUrl.TrimEnd('/')
  Invoke-SmokeStep -Name 'Frontend reachability' -Action {
    $response = Invoke-WebRequest -Uri $frontend -Method 'GET' -TimeoutSec $TimeoutSec -ErrorAction Stop
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) {
      throw "HTTP $($response.StatusCode)"
    }
    Add-Result -Name 'Frontend reachability' -Status 'PASS' -Detail ("http={0}" -f $response.StatusCode)
  }
} else {
  Add-Result -Name 'Frontend reachability' -Status 'SKIP' -Detail 'ALO_FRONTEND_URL nao informado.'
}

if (-not $hasAuthContext) {
  Add-Result -Name 'Inbox critical path' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'Routing critical path' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'AI context critical path' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'Handoff critical path' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
} else {
  $baseWorkspaceUrl = "$ApiBaseUrl/workspaces/$WorkspaceId"

  Invoke-SmokeStep -Name 'Inbox critical path' -Action {
    $response = Invoke-JsonRequest -Method 'GET' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff-history" -Authenticated
    if ($null -eq $response.events) { throw 'Resposta sem events no handoff-history.' }
    Add-Result -Name 'Inbox critical path' -Status 'PASS' -Detail ("handoff_events={0}" -f @($response.events).Count)
  }

  Invoke-SmokeStep -Name 'Routing critical path' -Action {
    $response = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/routing/conversations/$ConversationId/recommend" -Authenticated
    if ([string]::IsNullOrWhiteSpace([string]$response.queue)) { throw 'Recomendacao sem queue.' }
    if ([string]::IsNullOrWhiteSpace([string]$response.intent)) { throw 'Recomendacao sem intent.' }
    Add-Result -Name 'Routing critical path' -Status 'PASS' -Detail ("queue={0} intent={1}" -f $response.queue, $response.intent)
  }

  Invoke-SmokeStep -Name 'AI context critical path' -Action {
    $response = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/ai-assist/conversations/$ConversationId/classify" -Authenticated
    if ([string]::IsNullOrWhiteSpace([string]$response.intent)) { throw 'Classificacao sem intent.' }
    Add-Result -Name 'AI context critical path' -Status 'PASS' -Detail ("intent={0}" -f $response.intent)
  }

  Invoke-SmokeStep -Name 'Handoff critical path' -Action {
    if ($IncludeMutations) {
      $null = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff/takeover" -Authenticated
      $null = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/conversations/$ConversationId/copilot/reactivate" -Authenticated
      Add-Result -Name 'Handoff critical path' -Status 'PASS' -Detail 'takeover + reactivate executados'
      return
    }

    $response = Invoke-JsonRequest -Method 'GET' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff-history" -Authenticated
    if ($null -eq $response.events) { throw 'Sem historico para validar handoff.' }
    Add-Result -Name 'Handoff critical path' -Status 'PASS' -Detail 'historico de handoff acessivel'
  }
}

$failed = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
$passed = @($results | Where-Object { $_.status -eq 'PASS' }).Count
$skipped = @($results | Where-Object { $_.status -eq 'SKIP' }).Count

Write-Host ''
Write-Host 'Phase 6 Smoke Summary' -ForegroundColor Cyan
Write-Host ("PASS={0} FAIL={1} SKIP={2}" -f $passed, $failed, $skipped)

if ($failed -gt 0) {
  exit 1
}

exit 0
