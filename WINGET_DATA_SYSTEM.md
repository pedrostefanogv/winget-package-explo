# Winget Package Data System

## Overview

This application uses a GitHub Actions workflow to automatically fetch and process Windows Package Manager (winget) package data from the official `microsoft/winget-pkgs` repository. The data is pre-processed into a JSON file that includes package metadata and icons, providing faster load times and reduced API calls.

## How It Works

### 1. Data Collection (GitHub Actions)

The GitHub Action (`.github/workflows/fetch-winget-data.yml`) runs:
- **Weekly**: Every Sunday at midnight (UTC)
- **Manually**: Via workflow dispatch in GitHub Actions tab
- **On Push**: When the workflow file itself is updated

The workflow:
1. Checks out the repository
2. Sets up Node.js environment
3. Installs required dependencies (js-yaml, octokit)
4. Runs the data fetching script (`scripts/fetch-winget-data.js`)
5. Commits and pushes the generated `public/data/packages.json` file

### 2. Data Processing Script

The `scripts/fetch-winget-data.js` script:
- Connects to the GitHub API using an authenticated token
- Fetches up to 500 package manifests from `microsoft/winget-pkgs`
- Parses YAML manifest files (locale and installer files)
- Extracts package metadata:
  - Package ID, name, publisher, version
  - Description, homepage, license, tags
  - Category (derived from first tag)
  - Install command
- **Attempts to find package icons** from:
  - Microsoft Store images (for Store packages)
  - Clearbit Logo API (using package homepage domain)
- Generates a consolidated JSON file with all package data

### 3. Frontend Data Loading

The frontend application (`src/hooks/use-winget-packages.ts`) uses a **waterfall loading strategy**:

1. **Primary**: Load from pre-processed static data (`/data/packages.json`)
   - Fastest method
   - Works offline
   - Updated weekly via GitHub Actions

2. **Fallback #1**: Fetch directly from GitHub API
   - Used if static data is unavailable
   - Real-time data but slower
   - Subject to GitHub API rate limits

3. **Fallback #2**: Use mock data
   - Used if both previous methods fail
   - Ensures the app always has data to display
   - Clearly indicated to users

## Icon Sources

Package icons are sourced from:

1. **Microsoft Store**: For packages with `PackageFamilyName` in their installer manifest
2. **Clearbit Logo API**: Uses the package homepage domain to fetch company logos
3. **Fallback**: Phosphor Icons package icon if no image is available

## File Structure

```
.github/
  workflows/
    fetch-winget-data.yml          # GitHub Actions workflow

scripts/
  fetch-winget-data.js             # Data fetching and processing script

public/
  data/
    packages.json                  # Generated package data (committed to repo)

src/
  lib/
    staticDataApi.ts               # API for loading static JSON data
    wingetApi.ts                   # API for live GitHub fetching
    types.ts                       # TypeScript interfaces
  hooks/
    use-winget-packages.ts         # React hook with waterfall loading
  components/
    PackageCard.tsx                # Displays package with icon
    PackageDetail.tsx              # Shows detailed package info with icon
```

## Running Manually

### Fetch Data Locally

```bash
# Install dependencies
npm install js-yaml octokit

# Set GitHub token (optional, but increases rate limits)
export GITHUB_TOKEN=your_github_token_here

# Run the script
node scripts/fetch-winget-data.js
```

This will create/update `public/data/packages.json`.

### Trigger GitHub Action

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Fetch Winget Package Data** workflow
4. Click **Run workflow** button
5. Select the branch and click **Run workflow**

## Configuration

### Adjust Package Count

Edit `scripts/fetch-winget-data.js`:

```javascript
const MAX_PACKAGES = 500  // Change this number
```

### Change Schedule

Edit `.github/workflows/fetch-winget-data.yml`:

```yaml
schedule:
  - cron: '0 0 * * 0'  # Cron expression (current: weekly on Sunday at midnight)
```

Cron schedule examples:
- `'0 0 * * *'` - Daily at midnight
- `'0 0 * * 1'` - Weekly on Monday
- `'0 0 1 * *'` - Monthly on the 1st

## Benefits

✅ **Fast Load Times**: Pre-processed data loads instantly  
✅ **Reduced API Calls**: Minimizes GitHub API usage and rate limits  
✅ **Package Icons**: Visual identification of packages  
✅ **Automatic Updates**: Data refreshes weekly without manual intervention  
✅ **Offline Support**: Static data works without internet connection  
✅ **Graceful Degradation**: Multiple fallback strategies ensure reliability  

## Troubleshooting

### Action Fails to Commit

**Issue**: "Nothing to commit" or permission errors

**Solution**: 
- Ensure the workflow has `contents: write` permission (already configured)
- Check that data actually changed before committing

### Rate Limiting

**Issue**: GitHub API rate limit exceeded

**Solution**:
- The script includes 100ms delay between requests
- Authenticated requests have higher rate limits (5000/hour vs 60/hour)
- Reduce `MAX_PACKAGES` if needed

### Icons Not Loading

**Issue**: Package icons show fallback icon

**Reasons**:
- Package doesn't have a Microsoft Store listing
- Homepage domain not recognized by Clearbit
- CORS issues with external image sources

**Note**: This is expected behavior and the app gracefully falls back to the default icon.

## Future Enhancements

Potential improvements:
- Implement icon caching/proxying to avoid CORS issues
- Add search indexing for better search performance
- Include download counts and popularity metrics
- Add version history tracking
- Implement incremental updates instead of full refresh
