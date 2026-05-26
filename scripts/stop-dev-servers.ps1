$ports = 8080, 8081
$killed = @()

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $connections) {
    $procId = $conn.OwningProcess
    if ($procId -and $killed -notcontains $procId) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      $killed += $procId
      Write-Host "Arrete PID $procId (port $port)"
    }
  }
}

if ($killed.Count -eq 0) {
  Write-Host "Aucun serveur sur les ports 8080/8081."
} else {
  Write-Host "Termine. $($killed.Count) processus arrete(s)."
}
