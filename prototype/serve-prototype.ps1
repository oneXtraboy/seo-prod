[CmdletBinding()]
param(
  [ValidateRange(1024, 65535)]
  [int]$Port = 4173,
  [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot 'dist'))
$indexPath = Join-Path $distRoot 'index.html'

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
  Write-Host 'Не найдена готовая сборка dist\index.html.' -ForegroundColor Red
  Write-Host 'Проверьте, что папка dist находится рядом с этим файлом.'
  exit 1
}

function Get-MimeType {
  param([string]$Path)

  switch ([System.IO.Path]::GetExtension($Path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.js' { 'text/javascript; charset=utf-8' }
    '.map' { 'application/json; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.svg' { 'image/svg+xml; charset=utf-8' }
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.webp' { 'image/webp' }
    '.gif' { 'image/gif' }
    '.ico' { 'image/x-icon' }
    '.txt' { 'text/plain; charset=utf-8' }
    '.woff' { 'font/woff' }
    '.woff2' { 'font/woff2' }
    default { 'application/octet-stream' }
  }
}

function Write-HttpResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$ContentType,
    [byte[]]$Content,
    [bool]$SendBody,
    [string]$CacheControl = 'no-store',
    [hashtable]$AdditionalHeaders = @{}
  )

  $statusText = switch ($StatusCode) {
    200 { 'OK' }
    400 { 'Bad Request' }
    403 { 'Forbidden' }
    404 { 'Not Found' }
    405 { 'Method Not Allowed' }
    default { 'Internal Server Error' }
  }

  $crlf = [string][char]13 + [string][char]10
  $headers = @(
    "HTTP/1.1 $StatusCode $statusText"
    "Content-Type: $ContentType"
    "Content-Length: $($Content.Length)"
    "Cache-Control: $CacheControl"
    'Connection: close'
    'X-Content-Type-Options: nosniff'
    'Referrer-Policy: no-referrer'
  )

  foreach ($name in $AdditionalHeaders.Keys) {
    $headers += "$($name): $($AdditionalHeaders[$name])"
  }

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(
    (($headers -join $crlf) + $crlf + $crlf)
  )

  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($SendBody -and $Content.Length -gt 0) {
    $Stream.Write($Content, 0, $Content.Length)
  }
  $Stream.Flush()
}

$listener = [System.Net.Sockets.TcpListener]::new(
  [System.Net.IPAddress]::Loopback,
  $Port
)

try {
  $listener.Start()
}
catch {
  Write-Host "Не удалось запустить локальный сервер на порту $Port." -ForegroundColor Red
  Write-Host 'Закройте уже запущенную копию прототипа и повторите попытку.'
  exit 1
}

$url = "http://127.0.0.1:$Port/"
Write-Host ''
Write-Host 'Локальный прототип Synapsee запущен.' -ForegroundColor Green
Write-Host "Адрес: $url"
Write-Host 'Чтобы остановить сервер, закройте это окно или нажмите Ctrl+C.'
Write-Host ''

if (-not $NoBrowser) {
  try {
    Start-Process -FilePath $url | Out-Null
  }
  catch {
    Write-Warning "Не удалось открыть браузер автоматически. Откройте вручную: $url"
  }
}

$distPrefix = $distRoot.TrimEnd(
  [System.IO.Path]::DirectorySeparatorChar,
  [System.IO.Path]::AltDirectorySeparatorChar
) + [System.IO.Path]::DirectorySeparatorChar

try {
  while ($true) {
    $client = $null
    $stream = $null
    $reader = $null

    try {
      $client = $listener.AcceptTcpClient()
      $client.NoDelay = $true
      $stream = $client.GetStream()
      $reader = New-Object System.IO.StreamReader(
        $stream,
        [System.Text.Encoding]::ASCII,
        $false,
        1024,
        $true
      )

      $requestLine = $reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($requestLine)) {
        continue
      }

      while ($true) {
        $headerLine = $reader.ReadLine()
        if ($null -eq $headerLine -or $headerLine.Length -eq 0) {
          break
        }
      }

      $requestParts = $requestLine.Split(' ')
      if ($requestParts.Length -lt 2) {
        $body = $utf8NoBom.GetBytes('Некорректный HTTP-запрос.')
        Write-HttpResponse $stream 400 'text/plain; charset=utf-8' $body $true
        continue
      }

      $method = $requestParts[0].ToUpperInvariant()
      $sendBody = $method -eq 'GET'

      if ($method -ne 'GET' -and $method -ne 'HEAD') {
        $body = $utf8NoBom.GetBytes('Метод не поддерживается.')
        Write-HttpResponse $stream 405 'text/plain; charset=utf-8' $body $true 'no-store' @{
          Allow = 'GET, HEAD'
        }
        continue
      }

      $requestedUri = $requestParts[1]
      $queryStart = $requestedUri.IndexOf('?')
      if ($queryStart -ge 0) {
        $requestedUri = $requestedUri.Substring(0, $queryStart)
      }

      try {
        $decodedPath = [System.Uri]::UnescapeDataString($requestedUri)
      }
      catch {
        $body = $utf8NoBom.GetBytes('Некорректный адрес.')
        Write-HttpResponse $stream 400 'text/plain; charset=utf-8' $body $sendBody
        continue
      }

      $decodedPath = $decodedPath.Replace('\', '/')
      $relativePath = $decodedPath.TrimStart('/')

      if ([string]::IsNullOrWhiteSpace($relativePath)) {
        $candidatePath = $indexPath
      }
      else {
        $platformPath = $relativePath -replace '/', [string][System.IO.Path]::DirectorySeparatorChar
        $candidatePath = [System.IO.Path]::GetFullPath((Join-Path $distRoot $platformPath))
      }

      $isInsideDist = $candidatePath.Equals(
        $distRoot,
        [System.StringComparison]::OrdinalIgnoreCase
      ) -or $candidatePath.StartsWith(
        $distPrefix,
        [System.StringComparison]::OrdinalIgnoreCase
      )

      if (-not $isInsideDist) {
        $body = $utf8NoBom.GetBytes('Доступ запрещён.')
        Write-HttpResponse $stream 403 'text/plain; charset=utf-8' $body $sendBody
        continue
      }

      if (Test-Path -LiteralPath $candidatePath -PathType Container) {
        $nestedIndex = Join-Path $candidatePath 'index.html'
        if (Test-Path -LiteralPath $nestedIndex -PathType Leaf) {
          $candidatePath = $nestedIndex
        }
        else {
          $candidatePath = $indexPath
        }
      }
      elseif (-not (Test-Path -LiteralPath $candidatePath -PathType Leaf)) {
        if ([string]::IsNullOrEmpty([System.IO.Path]::GetExtension($candidatePath))) {
          $candidatePath = $indexPath
        }
        else {
          $body = $utf8NoBom.GetBytes('Файл не найден.')
          Write-HttpResponse $stream 404 'text/plain; charset=utf-8' $body $sendBody
          continue
        }
      }

      $content = [System.IO.File]::ReadAllBytes($candidatePath)
      $mimeType = Get-MimeType $candidatePath
      $cacheControl = if ($candidatePath -eq $indexPath) {
        'no-store'
      }
      else {
        'public, max-age=31536000, immutable'
      }

      Write-HttpResponse $stream 200 $mimeType $content $sendBody $cacheControl
    }
    catch {
      if ($null -ne $stream) {
        try {
          $body = $utf8NoBom.GetBytes('Внутренняя ошибка локального сервера.')
          Write-HttpResponse $stream 500 'text/plain; charset=utf-8' $body $true
        }
        catch {
          # Соединение уже могло быть закрыто клиентом.
        }
      }
    }
    finally {
      if ($null -ne $reader) {
        $reader.Dispose()
      }
      if ($null -ne $stream) {
        $stream.Dispose()
      }
      if ($null -ne $client) {
        $client.Dispose()
      }
    }
  }
}
finally {
  $listener.Stop()
}
