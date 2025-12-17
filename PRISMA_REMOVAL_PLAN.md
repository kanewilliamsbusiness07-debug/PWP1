# Prisma history cleanup (non-destructive plan)

Status: Draft — **do NOT run these steps without team approval**.

Overview
- The repository contains legacy Prisma artifacts (schema, migrations, seed files) that increase repository size and leak sensitive example DB URLs.
- Removing these from history can significantly shrink the repository, but it requires a history rewrite which is destructive to commit SHAs and will affect all collaborators.

Goals
- Remove legacy `prisma/` directory, `.prisma/*` artifacts and any large dev.db or exported SQL migration files from git history.
- Update .gitignore to avoid re-adding removed artifacts.
- Validate the rewritten history in a backup branch before force-pushing to `main`.

Non-destructive plan
1. Create a backup branch locally on the current repo and push it to remote:
   - git branch backup-before-prisma-remove
   - git push origin backup-before-prisma-remove

2. Run the migration in a throwaway clone or local copy only, and verify results there:
   - git clone --mirror <repo-url> repo-mirror.git
   - cd repo-mirror.git
   - git filter-repo --path prisma --invert-paths --path-glob '.prisma/*' --path-glob 'prisma/**/*.sql' --replace-refs delete-no-add
   - Or use the provided helper scripts: scripts/remove-prisma-history.sh / .ps1 (these wrap git-filter-repo and make backups)

3. Validate the new mirror:
   - Check the new repo size
   - Inspect recent commits for accidental removals
   - Run CI against the mirror in a disposable environment

4. Coordinate with all contributors:
   - Make an announcement to the team with the exact date/time and expected downtime (everyone must re-clone or rebase carefully)
   - Have a rollback plan using `backup-before-prisma-remove` branch

5. Push the cleaned history to remote (only after signoff):
   - git push --force --mirror origin

6. Post-cleanup steps for collaborators:
   - Each collaborator must re-clone the repository, or follow the documented steps to replace local branches safely.

Risks & notes
- This is destructive and will rewrite commits and PRs; do NOT proceed without team consensus.
- Ensure that all important tags/releases are backed up.
- If large files are due to other causes (e.g., generated artifacts), consider using `git filter-repo` options to only remove specific paths.

Contact & approvals
- Add the review/approval checklist here and request approvals from repository admins before execution.

