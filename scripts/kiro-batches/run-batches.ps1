# Runs the Kiro batch prompts in order through the Kiro CLI.
# Usage (from the repo root):  powershell -ExecutionPolicy Bypass -File scripts\kiro-batches\run-batches.ps1 [-Only 05-impl-pbt]
# - Skips batches already marked done (scripts\kiro-batches\.done\<name>).
# - Re-runs an implementation batch (up to 3 times) while its spec still has unchecked tasks.
# - Stops with exit code 2 if Kiro reports rate/credit limits, so it can be resumed later.
param([string]$Only = "")

$ErrorActionPreference = "Stop"
$repo   = (Resolve-Path "$PSScriptRoot\..\..").Path
$dir    = $PSScriptRoot
$logs   = Join-Path $dir "logs"
$done   = Join-Path $dir ".done"
$kiro   = Join-Path $env:LOCALAPPDATA "Kiro-Cli\kiro-cli.exe"
New-Item -ItemType Directory -Force -Path $logs, $done | Out-Null

# implementation batch -> spec folder whose tasks.md must end up fully checked
$specOf = @{
  "01-skeleton-finish" = "skeleton";   "03-impl-a11y-brain" = "a11y-brain"
  "05-impl-pbt"        = "a11y-pbt";   "07-impl-a11y-mcp"   = "a11y-mcp"
  "09-impl-acr"        = "acr-report"; "11-impl-new-app"    = "new-app-script"
  "13-impl-grimoire"   = "grimoire";   "15-impl-seance"     = "seance"
}

function Get-Unchecked([string]$spec) {
  $f = Join-Path $repo ".kiro\specs\$spec\tasks.md"
  if (-not (Test-Path $f)) { return -1 }
  return @(Select-String -Path $f -Pattern '^\s*- \[ \]').Count
}

$batches = Get-ChildItem $dir -Filter "*.txt" | Sort-Object Name
if ($Only) { $batches = $batches | Where-Object { $_.BaseName -eq $Only } }

Set-Location $repo
foreach ($b in $batches) {
  $name = $b.BaseName
  if (Test-Path (Join-Path $done $name)) { Write-Host "skip  $name (done)"; continue }

  $attempts = if ($specOf.ContainsKey($name)) { 3 } else { 1 }
  for ($a = 1; $a -le $attempts; $a++) {
    $log = Join-Path $logs "$name-$a.log"
    Write-Host ("run   {0} (attempt {1}) {2}" -f $name, $a, (Get-Date -Format "HH:mm"))
    # Kiro logs [INFO] lines to stderr; don't let PowerShell treat them as fatal.
    $ErrorActionPreference = "Continue"
    Get-Content $b.FullName -Raw | & $kiro chat --no-interactive --trust-all-tools *> $log
    $ErrorActionPreference = "Stop"

    $text = Get-Content $log -Raw
    if ($text -match 'ThrottlingException|CREDIT_CONSUMPTION|429|limit reached|insufficient credits|quota') {
      $m = [regex]::Match($text, '"retryAfterMilliseconds":(\d+)')
      $wait = if ($m.Success) { [math]::Round([int64]$m.Groups[1].Value / 60000) } else { "?" }
      Write-Host "STOP  $name hit a Kiro rate/credit limit (retry after ~$wait min). Re-run this script to resume."
      exit 2
    }

    if ($specOf.ContainsKey($name)) {
      $left = Get-Unchecked $specOf[$name]
      Write-Host "      unchecked tasks left in $($specOf[$name]): $left"
      if ($left -eq 0) { break }
    } else { break }
  }

  if ($specOf.ContainsKey($name) -and (Get-Unchecked $specOf[$name]) -ne 0) {
    Write-Host "STOP  $name still has unchecked tasks after $attempts attempts. Needs review."
    exit 3
  }
  New-Item -ItemType File -Force -Path (Join-Path $done $name) | Out-Null
  Write-Host "done  $name"
}
Write-Host "ALL BATCHES COMPLETE"
