<#
  PowerShell helper to rewrite git history to remove Prisma artifacts.
  WARNING: Destructive. Run only with team coordination.
  Requires `git-filter-repo` (install with pip) and Git in PATH.
#>

param()

Write-Host "This will rewrite git history to remove 'prisma' directory."
$confirm = Read-Host "Type YES to continue"
if ($confirm -ne 'YES') { Write-Host "Aborting."; exit 0 }

git branch backup-before-prisma-remove
git filter-repo --path prisma --path-rename prisma:prisma_removed --invert-paths

Write-Host "History rewritten locally. Review before force-pushing: git push origin --all --force-with-lease"
