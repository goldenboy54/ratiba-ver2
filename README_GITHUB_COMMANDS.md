# GitHub Workflow for `ratiba-ver2`

This README documents the Git and GitHub commands used to publish the
Express/EJS timetable updates on the `developu` branch.

Repository:

```text
https://github.com/goldenboy54/ratiba-ver2
```

Branch used for these updates:

```text
developu
```

## 0. Authenticate GitHub CLI

Check whether GitHub CLI is authenticated:

```powershell
gh auth status
```

If authentication is missing, start the interactive login flow:

```powershell
gh auth login
```

Choose GitHub.com, HTTPS, and the browser-based authentication method when
prompted. Pull-request commands require an authenticated GitHub CLI session.

## 1. Check the repository location

```powershell
Get-Location
```

Shows the current PowerShell directory. Run Git commands from the repository
root:

```text
C:\Users\hekim\OneDrive\Desktop\express_system\ATC_RATIBA_DEVP\ratiba-ver2
```

## 2. Check the working tree

```powershell
git status --short
```

Shows modified, deleted, and untracked files. Review this before staging so
temporary files, credentials, logs, and generated artifacts are not uploaded.

## 3. Check the current branch

```powershell
git branch --show-current
```

Prints the branch currently checked out.

## 4. Create or switch to `developu`

If the branch does not yet exist locally:

```powershell
git switch -c developu
```

Creates the branch and switches to it.

If `developu` already exists locally:

```powershell
git switch developu
```

Switches to the existing local branch without creating a duplicate branch.

## 5. Confirm the GitHub remote

```powershell
git remote -v
```

Shows the fetch and push URLs. The expected remote is:

```text
origin  https://github.com/goldenboy54/ratiba-ver2.git
```

## 6. Get the latest remote branch information

```powershell
git fetch origin
```

Downloads remote branch and commit information without changing local files.

To compare the local branch with the remote branch:

```powershell
git log --oneline --decorate --graph --all -20
```

Displays the recent commit graph.

## 7. Stage the intended application changes

Stage tracked changes and the new application/documentation files explicitly:

```powershell
git add .gitignore app.js db.js `
  logics/collisionReportLogic.js `
  logics/subjectsLogic.js `
  logics/timetablesLogic.js `
  logics/tmasterLogic.js `
  models/collisionReportModel.js `
  models/manualTimetableModel.js `
  models/semesterCalendar.js `
  models/subjectsModel.js `
  models/tmasterModel.js `
  migrations/subjects_scheduling_features.sql `
  public/js/tmaster.js `
  routes/semesterSettingsRoutes.js `
  routes/timetables.js `
  routes/tmaster.js `
  views/partials/nav.ejs `
  views/semester-settings.ejs `
  views/subjects.ejs `
  views/timetables.ejs `
  README_TIMETABLE_GENERATION_AND_COLLISIONS.md `
  README_GITHUB_COMMANDS.md
```

The PowerShell backtick continues the command onto the next line.

Explicit staging is safer than `git add .` because it avoids accidentally
uploading `.snapshots`, `node_modules`, generated artifacts, uploads, logs, or
the local conversion workspace.

## 8. Review staged files

```powershell
git status --short
```

The files intended for the commit should start with `A` or `M` in the staged
column.

To inspect the staged content:

```powershell
git --no-pager diff --cached --stat
git --no-pager diff --cached
```

`--stat` gives a summary. The second command shows the complete staged diff.

## 9. Commit the changes

```powershell
git commit -m "Update Express timetable generation and collision handling" -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Creates a local commit containing the staged Express/EJS changes, database
calendar integration, collision handling, subject scheduling fields, and
technical documentation.

To inspect the new commit:

```powershell
git show --stat --oneline HEAD
```

## 10. Push `developu` to GitHub

```powershell
git push -u origin developu
```

Uploads the local `developu` branch to GitHub and sets
`origin/developu` as its upstream branch. After the first push, future pushes
can use:

```powershell
git push
```

### If GitHub rejects the push

This repository currently protects `developu` with the rule:

```text
Changes must be made through a pull request.
```

That means a direct push to `origin/developu` is expected to be rejected.
Use a source branch and open a pull request into `developu` instead:

```powershell
git switch -c timetable-generation-updates
```

Creates a separate source branch from the current commit.

```powershell
git push -u origin timetable-generation-updates
```

Publishes the source branch without modifying the protected `developu` branch.

```powershell
gh pr create `
  --repo goldenboy54/ratiba-ver2 `
  --base developu `
  --head timetable-generation-updates `
  --title "Update Express timetable generation and collision handling" `
  --body "Adds database-driven semester calendars, automatic and manual timetable generation updates, collision-report co-teaching handling, subject scheduling constraints, and technical documentation."
```

Creates the pull request that must be reviewed and merged into `developu`.

After the pull request is merged:

```powershell
git switch developu
git pull --ff-only origin developu
```

Updates the local `developu` branch to the reviewed GitHub version.

## 11. Verify the remote branch

```powershell
git ls-remote --heads origin developu
```

Confirms that GitHub has a `developu` branch and prints its commit SHA.

Using GitHub CLI:

```powershell
gh repo view goldenboy54/ratiba-ver2 --web
```

Opens the repository page in the browser.

To inspect the remote branch from the CLI:

```powershell
gh api repos/goldenboy54/ratiba-ver2/branches/developu
```

Returns branch metadata and the current commit SHA.

## 12. Create a pull request, if required

```powershell
gh pr create `
  --repo goldenboy54/ratiba-ver2 `
  --base main `
  --head developu `
  --title "Update Express timetable generation and collision handling" `
  --body "Adds database-driven semester calendars, updated automatic and manual timetable generation, collision-report co-teaching handling, subject venue/slot constraints, password-protected timetable cleanup, and technical documentation."
```

Creates a pull request from `developu` into `main`.

To list pull requests:

```powershell
gh pr list --repo goldenboy54/ratiba-ver2
```

To inspect a pull request:

```powershell
gh pr view <PR_NUMBER> --repo goldenboy54/ratiba-ver2
```

Replace `<PR_NUMBER>` with the actual pull request number.

## 13. Useful post-push checks

```powershell
git status --short
```

Confirms whether local changes remain.

```powershell
git log --oneline --decorate -5
```

Confirms the new commit is at the local branch tip.

```powershell
git diff origin/developu..developu
```

Shows differences between the remote tracking branch and the local branch.
Normally this should be empty after a successful push.

## 14. Important safety rules

- Do not commit `.env`, database passwords, API keys, or session secrets.
- Do not use `git add .` until temporary and generated folders are confirmed
  ignored.
- Do not use `git reset --hard` to solve a staging problem without explicit
  approval.
- Do not force-push `developu` unless the branch history is intentionally being
  replaced.
- Review `git diff --cached` before committing.
- Run the targeted syntax checks and database verification before pushing.
