# Fetch Inter fonts using npm @fontsource and copy TTFs to public/fonts
# Run from project root: powershell -ExecutionPolicy Bypass -File .\scripts\fetch-inter-fonts.ps1

$ErrorActionPreference = 'Stop'
Write-Host "Installing @fontsource/inter (no-save)..."
npm install @fontsource/inter --no-save

$srcDir = Join-Path -Path $PWD -ChildPath "node_modules/@fontsource/inter/files"
$destDir = Join-Path -Path $PWD -ChildPath "public/fonts"

if (-Not (Test-Path $srcDir)) {
  Write-Host "Could not find @fontsource files at $srcDir" -ForegroundColor Yellow
  Write-Host "Please ensure @fontsource/inter is installed or download Inter font files manually into public/fonts" -ForegroundColor Yellow
  exit 1
}

New-Item -ItemType Directory -Path $destDir -Force | Out-Null

Get-ChildItem -Path $srcDir -Filter "*.ttf" -Recurse | ForEach-Object {
  $dest = Join-Path $destDir $_.Name
  Write-Host "Copying $_.FullName -> $dest"
  Copy-Item -Path $_.FullName -Destination $dest -Force
}

Write-Host "Fonts copied to $destDir"
Write-Host "You can now run the sample PDF generator to embed fonts in PDF output."