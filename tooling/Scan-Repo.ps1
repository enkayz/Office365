param(
    [string]$RepoPath = ".",
    [string]$OutDir = "data",
    [string]$DocsDir = "docs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ServiceArea([string]$name) {
    $n = $name.ToLowerInvariant()
    if ($n -match "^mggraph-|^msgraph-|^graph-") { return 'Microsoft Graph' }
    if ($n -match "exo|exchange") { return 'Exchange Online' }
    if ($n -match "spo-|sharepoint|odfb") { return 'SharePoint Online' }
    if ($n -match "pnp") { return 'PnP PowerShell' }
    if ($n -match "tms|teams") { return 'Teams' }
    if ($n -match "intune|autopilot|win10-") { return 'Intune/Windows' }
    if ($n -match "^az-|azure|sentinel|keyvault") { return 'Azure' }
    if ($n -match "mde|mdatp|defender") { return 'Defender/MDE' }
    if ($n -match "^o365-") { return 'Microsoft 365 Core' }
    return 'Other'
}

function Get-Category([string]$name, [System.Collections.Generic.List[string]]$connectCmds) {
    if ($name.ToLowerInvariant() -match "-connect") { return 'Connect' }
    if ($connectCmds.Count -gt 0) { return 'Task (connects inline)' }
    return 'Task'
}

function Analyze-Ps1File([IO.FileInfo]$file) {
    $result = [ordered]@{}
    $result.Name = $file.Name
    $result.Path = $file.FullName
    $result.Size = $file.Length
    $result.LastWriteTime = $file.LastWriteTimeUtc.ToString("o")

    $result.Service = Get-ServiceArea -name $file.Name

    $tokens = $null; $errors = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors)

    $paramNames = @()
    if ($ast.ParamBlock) {
        foreach ($p in $ast.ParamBlock.Parameters) {
            $paramNames += $p.Name.VariablePath.UserPath
        }
    }
    $result.Parameters = $paramNames

    $cmdAsts = $ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.CommandAst] }, $true)

    $imports = New-Object System.Collections.Generic.List[string]
    $connects = New-Object System.Collections.Generic.List[string]
    $windowsOnly = New-Object System.Collections.Generic.List[string]
    $transcriptFlags = New-Object System.Collections.Generic.List[string]

    foreach ($c in $cmdAsts) {
        $cmd = $c.GetCommandName()
        if ([string]::IsNullOrWhiteSpace($cmd)) { continue }
        $lc = $cmd.ToLowerInvariant()
        if ($lc -eq 'import-module') {
            # Grab the module name argument if present
            $mod = $c.CommandElements | Select-Object -Skip 1 -First 1 | ForEach-Object { $_.ToString() }
            if ($mod) { $imports.Add($mod.Trim("'\"")) }
        }
        if ($lc -like 'connect-*') { $connects.Add($cmd) }
        if ($lc -eq 'out-gridview') { $windowsOnly.Add('Out-GridView') }
        if ($lc -eq 'start-process') {
            # look for -Verb RunAs
            $hasVerb = $false
            for ($i = 1; $i -lt $c.CommandElements.Count; $i++) {
                if ($c.CommandElements[$i].Extent.Text -ieq '-Verb') {
                    $val = $c.CommandElements[$i+1].Extent.Text
                    if ($val -match 'RunAs') { $hasVerb = $true; break }
                }
            }
            if ($hasVerb) { $windowsOnly.Add('Start-Process -Verb RunAs') }
        }
        if ($lc -eq 'start-transcript' -or $lc -eq 'stop-transcript') { $transcriptFlags.Add($cmd) }
    }

    $result.ImportModules = ($imports | Select-Object -Unique)
    $result.ConnectCommands = ($connects | Select-Object -Unique)
    $result.WindowsOnlyIndicators = ($windowsOnly | Select-Object -Unique)
    $result.UsesTranscript = [bool]($transcriptFlags.Count -gt 0)

    $lowerParams = $paramNames | ForEach-Object { $_.ToLowerInvariant() }
    $result.HasFlag_debug    = $lowerParams -contains 'debug'
    $result.HasFlag_noprompt = $lowerParams -contains 'noprompt'
    $result.HasFlag_noupdate = $lowerParams -contains 'noupdate'

    $result.Category = Get-Category -name $file.Name -connectCmds $connects

    return [pscustomobject]$result
}

function Analyze-Exe([IO.FileInfo]$file) {
    [pscustomobject]@{
        Name = $file.Name
        Path = $file.FullName
        Size = $file.Length
        LastWriteTime = $file.LastWriteTimeUtc.ToString("o")
        Service = Get-ServiceArea -name $file.Name
        Category = 'HelperExe'
        Parameters = @()
        ImportModules = @()
        ConnectCommands = @()
        WindowsOnlyIndicators = @()
        UsesTranscript = $false
        HasFlag_debug = $false
        HasFlag_noprompt = $false
        HasFlag_noupdate = $false
    }
}

# Enumerate only top-level files in the repo root (per repo structure guidance)
$root = (Resolve-Path $RepoPath).Path
$items = Get-ChildItem -LiteralPath $root -File | Where-Object { $_.Name -notmatch '^README|^WARP\.md|^best-practices|^urls\.txt|^.*\.(md|xlsx|csv)$' }

$results = New-Object System.Collections.Generic.List[object]
foreach ($it in $items) {
    switch ($it.Extension.ToLowerInvariant()) {
        '.ps1' { $results.Add((Analyze-Ps1File $it)) }
        '.exe' { $results.Add((Analyze-Exe $it)) }
        default { }
    }
}

# Write outputs
$null = New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$null = New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null

$inventoryJson = Join-Path $OutDir 'inventory.json'
$inventoryCsv  = Join-Path $OutDir 'inventory.csv'
$results | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $inventoryJson
$results | Export-Csv -NoTypeInformation -Path $inventoryCsv -Encoding UTF8

# Build script catalog markdown
$catalogPath = Join-Path $DocsDir 'script-catalog.md'
$lines = @()
$lines += "# Script Catalog"
$lines += ""
$lines += "This catalog lists top-level scripts and helpers with detected parameters, modules, and connect commands."
$lines += ""
foreach ($g in $results | Sort-Object Service, Category, Name | Group-Object Service) {
    $lines += "## $($g.Name)"
    foreach ($h in $g.Group | Group-Object Category) {
        $lines += "### $($h.Name)"
        foreach ($r in $h.Group) {
            $params = if ($r.Parameters) { ($r.Parameters -join ', ') } else { '(none)' }
            $mods = if ($r.ImportModules) { ($r.ImportModules -join ', ') } else { '(none)' }
            $conns = if ($r.ConnectCommands) { ($r.ConnectCommands -join ', ') } else { '(none)' }
            $winOnly = if ($r.WindowsOnlyIndicators) { ($r.WindowsOnlyIndicators -join ', ') } else { '(none)' }
            $lines += "- `$( $r.Name )` — Params: $params; Modules: $mods; Connects: $conns; Windows-only: $winOnly"
        }
        $lines += ""
    }
}
$lines | Set-Content -Encoding UTF8 $catalogPath

# Build capabilities matrix markdown
$matrixPath = Join-Path $DocsDir 'capabilities-matrix.md'
$ml = @()
$ml += "# Capabilities Matrix"
$ml += ""
$ml += "Counts by service area and category."
$ml += ""
$services = $results | Group-Object Service
foreach ($svc in $services) {
    $ml += "## $($svc.Name)"
    $byCat = $svc.Group | Group-Object Category | Sort-Object Name
    foreach ($cat in $byCat) {
        $ml += "- $($cat.Name): $($cat.Count)"
    }
    $ml += ""
}
$ml | Set-Content -Encoding UTF8 $matrixPath

Write-Host "Inventory written to: $inventoryJson, $inventoryCsv" -ForegroundColor Green
Write-Host "Docs written to: $catalogPath, $matrixPath" -ForegroundColor Green
