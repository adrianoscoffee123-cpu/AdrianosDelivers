$ErrorActionPreference = 'Stop'
$taskProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $taskProjectRoot
try {
    $taskVercelCli = Join-Path $taskProjectRoot '.tools\node_modules\.bin\vercel.cmd'
    $taskSupabaseCli = Join-Path $taskProjectRoot '.tools\node_modules\.bin\supabase.cmd'
    if (!(Test-Path -LiteralPath $taskVercelCli) -or !(Test-Path -LiteralPath $taskSupabaseCli)) {
        throw 'Local setup CLIs are missing. Ask Codex to install the reviewed setup tools first.'
    }
    Write-Host 'Sign in using the account that owns Vercel project adrianosdelivers.'
    & $taskVercelCli login
    if ($LASTEXITCODE -ne 0) { throw 'Vercel sign-in did not complete.' }

    Write-Host "Sign in using the account that owns Supabase project Adriano's delivers."
    Write-Host 'Enter any Supabase verification code directly in THIS terminal, never in chat.'
    & $taskSupabaseCli login --agent no --output-format text
    if ($LASTEXITCODE -ne 0) { throw 'Supabase sign-in did not complete.' }

    Write-Host 'Choose GitHub account adrianoscoffee123-cpu in the browser.'
    git credential-manager github login --username adrianoscoffee123-cpu --browser
    if ($LASTEXITCODE -ne 0) { throw 'GitHub sign-in did not complete.' }

    Write-Host 'Sign-in flows completed. Tell Codex to recheck access and continue the partial setup.'
    Write-Host 'This helper did not create a project, apply migrations, push code, or deploy.'
} finally {
    Pop-Location
}
