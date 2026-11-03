# Run from the project root after extracting the combined update.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath($PSScriptRoot)
if (-not (Test-Path -LiteralPath (Join-Path $root 'artisan'))) { throw 'Place this script in the UCIMS project root beside artisan.' }
$expected = Get-Content -Raw -LiteralPath (Join-Path $root 'CLAUDE1_CLEANUP_HASHES.json') | ConvertFrom-Json
$backup = Join-Path $root ('storage\app\claude1-cleanup-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff'))
foreach ($item in $expected.PSObject.Properties) {
    $source = [IO.Path]::GetFullPath((Join-Path $root $item.Name))
    if (-not $source.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path outside project.' }
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { continue }
    if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash -ne $item.Value) {
        Write-Warning "Skipped changed file: $($item.Name)"; continue
    }
    $destination = [IO.Path]::GetFullPath((Join-Path $backup $item.Name))
    if (-not $destination.StartsWith($backup + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid backup path.' }
    New-Item -ItemType Directory -Path (Split-Path $destination) -Force | Out-Null
    Move-Item -LiteralPath $source -Destination $destination
    Write-Host "Backed up: $($item.Name)"
}
Write-Host "Cleanup finished. Backups (if any): $backup"
