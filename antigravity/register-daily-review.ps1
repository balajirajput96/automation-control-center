param(
    [string]$RepositoryPath = (Resolve-Path (Join-Path $PSScriptRoot "..")),
    [string]$RunTime = "08:30"
)

$ErrorActionPreference = "Stop"
$taskName = "Automation Control Center — Daily Antigravity Review"
$runnerPath = Join-Path $PSScriptRoot "run-daily-review.ps1"

if (-not (Test-Path $runnerPath)) {
    throw "The daily review runner was not found: $runnerPath"
}

if (-not (Get-Command agy -ErrorAction SilentlyContinue)) {
    throw "Antigravity CLI ('agy') is not available in PATH. Install it and complete one interactive login before creating the scheduled task."
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`" -RepositoryPath `"$RepositoryPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $RunTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Runs a read-only, structured Antigravity review for the automation-control-center repository." -Force | Out-Null
Write-Output "Scheduled task '$taskName' is registered for $RunTime daily."
