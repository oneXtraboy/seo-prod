$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RootDir

if (Test-Path "public") {
  Remove-Item "public" -Recurse -Force
}

node scripts/generate.js

$requiredFiles = @(
  "public/index.html",
  "public/sitemap.xml",
  "public/404.html"
)

foreach ($file in $requiredFiles) {
  if (-not (Test-Path $file -PathType Leaf)) {
    throw "Build failed: required file missing: $file"
  }
}

Write-Host "Build completed successfully."
