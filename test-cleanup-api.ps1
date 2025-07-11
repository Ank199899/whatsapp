# Test WhatsApp Cleanup API
Write-Host "🧹 Testing WhatsApp Cleanup API" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Test cleanup status endpoint
Write-Host "`n📊 Getting cleanup status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/whatsapp/cleanup-status" -Method GET -ContentType "application/json"
    Write-Host "✅ Status retrieved successfully:" -ForegroundColor Green
    Write-Host "   Active Sessions: $($statusResponse.activeSessions)" -ForegroundColor Cyan
    Write-Host "   Session Directories: $($statusResponse.sessionDirectories)" -ForegroundColor Cyan
    Write-Host "   Can Cleanup: $($statusResponse.canCleanup)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to get status: $($_.Exception.Message)" -ForegroundColor Red
}

# Test cleanup endpoint if there's something to clean
Write-Host "`n🧹 Testing cleanup endpoint..." -ForegroundColor Yellow
try {
    $cleanupResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/whatsapp/cleanup-all" -Method POST -ContentType "application/json"
    Write-Host "✅ Cleanup completed successfully:" -ForegroundColor Green
    Write-Host "   Message: $($cleanupResponse.message)" -ForegroundColor Cyan
    Write-Host "   Timestamp: $($cleanupResponse.timestamp)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This might be expected if authentication is required" -ForegroundColor Yellow
}

Write-Host "`n✅ API test completed!" -ForegroundColor Green
