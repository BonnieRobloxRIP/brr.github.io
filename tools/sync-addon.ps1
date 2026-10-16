# Copies the addon files the encyclopedia reads into addon/, and grabs an icon for any new block.
#
# Usage (from the project folder):
#   powershell -ExecutionPolicy Bypass -File tools\sync-addon.ps1
#   powershell -ExecutionPolicy Bypass -File tools\sync-addon.ps1 -AddonPath "D:\path\to\addon"
#
# -AddonPath is the folder holding the BP and RP packs (defaults to reference\).

param(
    [string]$AddonPath = (Join-Path $PSScriptRoot '..\reference')
)

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$scripts = Join-Path $AddonPath 'BP\scripts'
$textures = Join-Path $AddonPath 'RP\textures'

# These are loaded by the site as-is. They must not import @minecraft/* modules.
$files = @(
    'engine\classes.js',
    'tool_ui\block_info.js',
    'tool_ui\block_forms.js',
    'tool_ui\conditions_tools.js'
)

foreach ($file in $files) {
    $source = Join-Path $scripts $file
    $target = Join-Path $root "addon\$file"
    if (-not (Test-Path $source)) { throw "Missing addon file: $source" }

    if (Select-String -Path $source -Pattern '@minecraft/' -Quiet) {
        Write-Warning "$file now imports a @minecraft module; the site cannot load it in a browser."
    }

    New-Item -ItemType Directory -Force (Split-Path $target) | Out-Null
    Copy-Item $source $target -Force
    Write-Host "Copied $file"
}

# Every engine class needs assets\blocks\<short name>.png, e.g. brr:logic_relay_block -> logic_relay.png.
$classes = Get-Content (Join-Path $root 'addon\engine\classes.js') -Raw
$typeIds = [regex]::Matches($classes, '^\s+"(brr:[a-z0-9_]+)":', 'Multiline') | ForEach-Object { $_.Groups[1].Value }

foreach ($typeId in $typeIds) {
    $short = $typeId -replace '^brr:', '' -replace '_block$', ''
    $icon = Join-Path $root "assets\blocks\$short.png"
    if (Test-Path $icon) { continue }

    $found = Get-ChildItem $textures -Recurse -Filter "$short.png" | Select-Object -First 1
    if ($found) {
        Copy-Item $found.FullName $icon
        Write-Host "Added icon for $typeId ($($found.FullName))"
    } else {
        Write-Warning "No icon found for $typeId. Add assets\blocks\$short.png by hand."
    }
}

Write-Host 'Done. New blocks also need an entry in js\data\block-meta.js (name and category).'
