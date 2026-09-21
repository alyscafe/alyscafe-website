param(
    [int]$Port = 3000,
    [string]$Root = $PSScriptRoot
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()

Write-Host "=========================================" -ForegroundColor Green
Write-Host " ☕ alys.cafe rodando localmente!" -ForegroundColor Yellow
Write-Host " -> http://localhost:$Port" -ForegroundColor Cyan
Write-Host " -> http://127.0.0.1:$Port" -ForegroundColor Cyan
Write-Host " Pressione Ctrl+C para encerrar." -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green

$mimeTypes = @{
    ".html"  = "text/html; charset=utf-8"
    ".htm"   = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "application/javascript; charset=utf-8"
    ".json"  = "application/json; charset=utf-8"
    ".svg"   = "image/svg+xml"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".ico"   = "image/x-icon"
    ".pdf"   = "application/pdf"
    ".woff2" = "font/woff2"
    ".woff"  = "font/woff"
    ".ttf"   = "font/ttf"
}

$rootFullPath = [System.IO.Path]::GetFullPath($Root)

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        try {
            $rawPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($rawPath) -or $rawPath -eq "/") {
                $rawPath = "index.html"
            }

            $filePath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootFullPath, $rawPath))
            if (-not $filePath.StartsWith($rootFullPath, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
            } elseif (Test-Path -Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
                $response.ContentType = $mime

                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length

                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
                $response.StatusCode = 200
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("<h1>404 Nao Encontrado - alys.cafe</h1>")
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $msg.Length
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($msg, 0, $msg.Length)
                }
            }
        } catch {
            # Catch individual request errors without terminating server
        } finally {
            try { $response.Close() } catch {}
        }
    }
} finally {
    try { $listener.Stop() } catch {}
    try { $listener.Close() } catch {}
}
