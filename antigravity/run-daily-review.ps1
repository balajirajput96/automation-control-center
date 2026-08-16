param(
    [string]$RepositoryPath = (Resolve-Path (Join-Path $PSScriptRoot "..")),
    [string]$PromptPath = (Join-Path $PSScriptRoot "daily-review-prompt.md")
)

$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportsDirectory = Join-Path $RepositoryPath "reports\private"
$outputPath = Join-Path $reportsDirectory "antigravity-review_$timestamp.json"

New-Item -ItemType Directory -Force -Path $reportsDirectory | Out-Null

$schema = @'
{
  "type":"object",
  "properties":{
    "repository_health":{"type":"string"},
    "n8n_deployment_readiness":{"type":"string"},
    "workflow_issues":{"type":"array","items":{"type":"string"}},
    "integration_blockers":{"type":"array","items":{"type":"string"}},
    "test_results":{"type":"array","items":{"type":"string"}},
    "recommended_changes":{"type":"array","items":{"type":"object","properties":{"path":{"type":"string"},"rationale":{"type":"string"},"risk_level":{"type":"string","enum":["low","medium","high"]},"automatic_apply":{"type":"boolean"}},"required":["path","rationale","risk_level","automatic_apply"]}},
    "risk_flags":{"type":"array","items":{"type":"string"}}
  },
  "required":["repository_health","n8n_deployment_readiness","workflow_issues","integration_blockers","test_results","recommended_changes","risk_flags"]
}
'@

if (-not (Get-Command agy -ErrorAction SilentlyContinue)) {
    throw "Antigravity CLI ('agy') is not installed or not available in PATH. Complete an interactive agy login first."
}

$prompt = Get-Content -Raw -Path $PromptPath
Push-Location $RepositoryPath
try {
    $result = & agy -p $prompt --output-format json --json-schema $schema --print-timeout 10m
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        throw "Antigravity CLI ('agy') execution failed with exit code $exitCode."
    }

    $rawContent = if ($result -is [array]) { $result -join "`n" } else { [string]$result }
    if ([string]::IsNullOrWhiteSpace($rawContent)) {
        throw "Antigravity CLI ('agy') returned empty output."
    }

    try {
        $null = ConvertFrom-Json -InputObject $rawContent -ErrorAction Stop
    }
    catch {
        throw "Antigravity CLI ('agy') output is not valid JSON: $_"
    }

    $rawContent | Set-Content -Encoding UTF8 -Path $outputPath
    Write-Output "Daily review saved to $outputPath"
}
finally {
    Pop-Location
}
