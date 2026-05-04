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

  $script:results += [pscustomobject]@{
    name = $Name
    status = $Status
    detail = $Detail
  }

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
    $request.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  return Invoke-RestMethod @request
}

function Invoke-SmokeStep {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  if (-not $PSCmdlet.ShouldProcess($Name, 'Run v1 final smoke step')) {
    Add-Result -Name $Name -Status 'SKIP' -Detail 'dry-run (-WhatIf)'
    return
  }

  try {
    & $Action
  } catch {
    Add-Result -Name $Name -Status 'FAIL' -Detail $_.Exception.Message
  }
}

function Test-FileContains {
  param(
    [string]$Path,
    [string[]]$Markers
  )

  if (-not (Test-Path $Path)) { throw "Arquivo nao encontrado: $Path" }
  $text = Get-Content -Path $Path -Raw
  foreach ($marker in $Markers) {
    if ($text -notmatch [regex]::Escape($marker)) { throw "Marker ausente: $marker" }
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$realtimeFile = Join-Path $repoRoot 'src\lib\realtimeEvents.js'
$launchFile = Join-Path $repoRoot '.planning\LAUNCH.md'
$readmeFile = Join-Path $repoRoot 'README.md'
$runbookFile = Join-Path $repoRoot '.planning\design\phase1-infrastructure-runbook.md'

Invoke-SmokeStep -Name 'Realtime envelope markers' -Action {
  Test-FileContains -Path $realtimeFile -Markers @(
    'conversation.created',
    'message.created',
    'conversation.updated',
    'assignment.updated',
    'kanban.updated',
    'presence.updated',
    'workspace_id',
    'resource_type',
    'resource_id',
    'actor_id',
    'occurred_at',
    'version',
    'payload'
  )
  Add-Result -Name 'Realtime envelope markers' -Status 'PASS' -Detail 'six canonical events and envelope fields present'
}

Invoke-SmokeStep -Name 'Presence acceptance prerequisites' -Action {
  Test-FileContains -Path (Join-Path $repoRoot 'src\pages\Inbox.jsx') -Markers @('presence.updated', 'is_online', 'Online', 'Offline')
  Test-FileContains -Path (Join-Path $repoRoot 'src\pages\Team.jsx') -Markers @('presence.updated', 'is_online', 'Online', 'Offline')
  Add-Result -Name 'Presence acceptance prerequisites' -Status 'PASS' -Detail 'Inbox and Team consume presence.updated'
}

Invoke-SmokeStep -Name 'Launch blocker documentation' -Action {
  Test-FileContains -Path $launchFile -Markers @('PROD-03', 'CHAN-01', 'go/no-go', 'Evolution', 'rotacao', 'defer')
  Add-Result -Name 'Launch blocker documentation' -Status 'PASS' -Detail 'launch checklist records blockers and deferred items'
}

Invoke-SmokeStep -Name 'Documentation secret hygiene' -Action {
  foreach ($path in @($readmeFile, $runbookFile, $launchFile)) {
    $text = Get-Content -Path $path -Raw
    if ($text -match 'aloai2025') { throw "unsafe Evolution key example in $path" }
    if ($text -match 'your-api-key-here') { throw "unsafe API key placeholder in $path" }
  }
  Add-Result -Name 'Documentation secret hygiene' -Status 'PASS' -Detail 'docs use neutral placeholders only'
}

if (-not $ApiBaseUrl) {
  if ($WhatIfPreference) {
    Add-Result -Name 'Bootstrap' -Status 'SKIP' -Detail 'dry-run sem ALO_API_URL'
    $ApiBaseUrl = 'http://localhost:3001'
  } else {
    Add-Result -Name 'Bootstrap' -Status 'FAIL' -Detail 'Defina ALO_API_URL ou -ApiBaseUrl.'
  }
}

if ($ApiBaseUrl) {
  $ApiBaseUrl = $ApiBaseUrl.TrimEnd('/')
  Invoke-SmokeStep -Name 'API health' -Action {
    $health = Invoke-JsonRequest -Method 'GET' -Url "$ApiBaseUrl/health"
    if (-not $health.status) { throw 'Resposta sem campo status.' }
    Add-Result -Name 'API health' -Status 'PASS' -Detail ("status={0}" -f $health.status)
  }
}

if ($FrontendBaseUrl) {
  $frontend = $FrontendBaseUrl.TrimEnd('/')
  Invoke-SmokeStep -Name 'Frontend frontdoor' -Action {
    $response = Invoke-WebRequest -Uri $frontend -Method 'GET' -TimeoutSec $TimeoutSec -ErrorAction Stop
    if ($response.StatusCode -lt 200 -or $response.StatusCode -ge 400) { throw "HTTP $($response.StatusCode)" }
    Add-Result -Name 'Frontend frontdoor' -Status 'PASS' -Detail ("http={0}" -f $response.StatusCode)
  }
} else {
  Add-Result -Name 'Frontend frontdoor' -Status 'SKIP' -Detail 'ALO_FRONTEND_URL nao informado.'
}

$hasAuthContext = -not [string]::IsNullOrWhiteSpace($Token) -and -not [string]::IsNullOrWhiteSpace($WorkspaceId) -and -not [string]::IsNullOrWhiteSpace($ConversationId) -and -not [string]::IsNullOrWhiteSpace($ApiBaseUrl)

if (-not $hasAuthContext) {
  Add-Result -Name 'Inbox critical flow' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'Handoff critical flow' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'Kanban state critical flow' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
  Add-Result -Name 'AI suggest/classify critical flow' -Status 'SKIP' -Detail 'ALO_TOKEN/ALO_WORKSPACE_ID/ALO_CONVERSATION_ID nao informados.'
} else {
  $baseWorkspaceUrl = "$ApiBaseUrl/workspaces/$WorkspaceId"

  Invoke-SmokeStep -Name 'Inbox critical flow' -Action {
    $response = Invoke-JsonRequest -Method 'GET' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff-history" -Authenticated
    if ($null -eq $response.events) { throw 'Resposta sem events no handoff-history.' }
    Add-Result -Name 'Inbox critical flow' -Status 'PASS' -Detail ("conversation={0} handoff_events={1}" -f $ConversationId, @($response.events).Count)
  }

  Invoke-SmokeStep -Name 'Handoff critical flow' -Action {
    if ($IncludeMutations) {
      $null = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff/takeover" -Authenticated
      $null = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/conversations/$ConversationId/copilot/reactivate" -Authenticated
      Add-Result -Name 'Handoff critical flow' -Status 'PASS' -Detail 'takeover + reactivate executados'
      return
    }

    $response = Invoke-JsonRequest -Method 'GET' -Url "$baseWorkspaceUrl/conversations/$ConversationId/handoff-history" -Authenticated
    if ($null -eq $response.events) { throw 'Sem historico de handoff.' }
    Add-Result -Name 'Handoff critical flow' -Status 'PASS' -Detail 'historico acessivel; mutacao exige -IncludeMutations'
  }

  Invoke-SmokeStep -Name 'Kanban state critical flow' -Action {
    $response = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/routing/conversations/$ConversationId/recommend" -Authenticated
    if ([string]::IsNullOrWhiteSpace([string]$response.queue)) { throw 'Resposta sem queue.' }
    Add-Result -Name 'Kanban state critical flow' -Status 'PASS' -Detail ("queue={0}; state move deve ser validado no UAT guiado" -f $response.queue)
  }

  Invoke-SmokeStep -Name 'AI suggest/classify critical flow' -Action {
    $response = Invoke-JsonRequest -Method 'POST' -Url "$baseWorkspaceUrl/ai-assist/conversations/$ConversationId/classify" -Authenticated
    if ([string]::IsNullOrWhiteSpace([string]$response.intent)) { throw 'Classificacao sem intent.' }
    Add-Result -Name 'AI suggest/classify critical flow' -Status 'PASS' -Detail ("intent={0}" -f $response.intent)
  }
}

$failed = @($results | Where-Object { $_.status -eq 'FAIL' }).Count
$passed = @($results | Where-Object { $_.status -eq 'PASS' }).Count
$skipped = @($results | Where-Object { $_.status -eq 'SKIP' }).Count

Write-Host ''
Write-Host 'ALO AI v1 Final Smoke Summary' -ForegroundColor Cyan
Write-Host ("PASS={0} FAIL={1} SKIP={2}" -f $passed, $failed, $skipped)

if ($failed -gt 0) {
  Write-Host 'BLOCKER: final smoke has failing checks.' -ForegroundColor Red
  exit 1
}

if ($skipped -gt 0) {
  Write-Host 'WARNING: final smoke has skipped checks; provide env vars before RC sign-off.' -ForegroundColor Yellow
}

exit 0
