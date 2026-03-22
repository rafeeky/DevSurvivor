$base = "c:\Users\rimse\OneDrive\바탕 화면\DevSurvivor"
$folders = @("assets\custom\icons", "docs\assets\custom\icons")
foreach ($folder in $folders) {
    $fullFolder = Join-Path $base $folder
    $files = Get-ChildItem "$fullFolder\*.png" | Where-Object { $_.Name -notlike "A_*" }
    foreach ($f in $files) {
        $newName = "A_" + $f.Name
        Rename-Item $f.FullName $newName
        Write-Host "Renamed: $($f.Name) -> $newName in $folder"
    }
}
Write-Host "=== Done ==="
