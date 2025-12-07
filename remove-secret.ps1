# Script to remove service-account-key.json from git history
# Run this script to clean your git history

Write-Host "Removing service-account-key.json from git history..." -ForegroundColor Yellow

# Remove from git tracking if it exists
git rm --cached service-account-key.json 2>$null

# Remove from all commits in history
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch service-account-key.json" --prune-empty --tag-name-filter cat -- --all

Write-Host "Cleaning up backup refs..." -ForegroundColor Yellow
git for-each-ref --format="%(refname)" refs/original/ | ForEach-Object { git update-ref -d $_ }

Write-Host "Running garbage collection..." -ForegroundColor Yellow
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host "Done! The file has been removed from git history." -ForegroundColor Green
Write-Host "You can now force push with: git push origin --force --all" -ForegroundColor Yellow
Write-Host "WARNING: This rewrites history. Make sure all team members are aware!" -ForegroundColor Red

