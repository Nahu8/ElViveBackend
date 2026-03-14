# Ejecutar antes de commitear vendor (para Render)
# Elimina .git de paquetes para que se incluyan correctamente
Get-ChildItem -Path vendor -Recurse -Directory -Filter ".git" -Force -ErrorAction SilentlyContinue |
    ForEach-Object { Remove-Item $_.FullName -Recurse -Force }
Write-Host "Vendor listo para commit"
