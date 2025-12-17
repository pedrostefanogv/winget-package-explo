# Running GitHub Actions

## Automated Data Fetching Workflow

The `fetch-winget-data.yml` workflow automatically fetches and processes winget package data from microsoft/winget-pkgs.

### Automatic Execution

The workflow runs automatically:

- **Every Sunday at 00:00 UTC** (weekly schedule)
- **When the workflow file is updated** (on push to main branch)

### Manual Execution

To trigger the workflow manually:

1. Go to your repository on GitHub
2. Click the **Actions** tab at the top
3. In the left sidebar, select **Fetch Winget Package Data**
4. Click the **Run workflow** button (on the right)
5. Select the branch (usually `main`)
6. Click the green **Run workflow** button

### Monitoring Workflow Execution

1. Go to the **Actions** tab
2. Click on the workflow run you want to monitor
3. Click on the **fetch-and-process** job to see logs
4. Expand steps to view detailed output

### What the Workflow Does

1. ✅ Checks out the repository
2. ✅ Sets up Node.js 20
3. ✅ Installs required npm packages (`js-yaml`, `octokit`)
4. ✅ Runs the data fetching script
5. ✅ Commits and pushes updated `public/data/packages.json`

### Troubleshooting

#### Workflow Fails with "Nothing to commit"

This is normal! It means the data hasn't changed since the last run.

#### Workflow Fails with "Permission denied"

Make sure:
- The workflow has `contents: write` permission (already configured)
- Your repository settings allow workflows to write to the repository

Go to: **Settings → Actions → General → Workflow permissions** and ensure "Read and write permissions" is selected.

#### Workflow Fails with "Rate limit exceeded"

The script uses the `GITHUB_TOKEN` automatically provided by GitHub Actions, which has higher rate limits. If you still hit rate limits:

1. Reduce `MAX_PACKAGES` in `scripts/fetch-winget-data.js`
2. Increase delays between API calls in the script

#### Data Isn't Updated on the Website

After the workflow completes:

1. The `packages.json` file should be updated in the repository
2. If deployed, trigger a redeploy of your application
3. Clear browser cache if needed

### Changing the Schedule

To change when the workflow runs automatically, edit `.github/workflows/fetch-winget-data.yml`:

```yaml
on:
  schedule:
    - cron: '0 0 * * 0'  # Modify this line
```

Cron examples:
- `'0 0 * * *'` - Every day at midnight UTC
- `'0 0 * * 1'` - Every Monday at midnight UTC
- `'0 0 1 * *'` - First day of every month at midnight UTC
- `'0 */6 * * *'` - Every 6 hours
- `'0 12 * * 1-5'` - Every weekday at noon UTC

Use [crontab.guru](https://crontab.guru/) to help build cron expressions.
