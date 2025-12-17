# Winget Package Explorer

A modern web application for browsing and searching Windows Package Manager (winget) packages from the official microsoft/winget-pkgs repository.

## 🚀 Features

- 🔍 **Fast Search**: Real-time search across package names, IDs, publishers, and descriptions
- 🏷️ **Category Filtering**: Browse packages by category tags
- 🎨 **Package Icons**: Visual identification with automatically fetched package icons
- 📦 **Detailed Package Info**: View comprehensive metadata including descriptions, licenses, tags, and homepage links
- 📋 **One-Click Install**: Copy winget install commands to clipboard
- 🔄 **Automated Data Updates**: GitHub Actions workflow refreshes package data weekly
- ⚡ **Optimized Performance**: Pre-processed data for instant loading
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 19 with TypeScript
- **UI Components**: shadcn/ui v4 with Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Icons**: Phosphor Icons
- **Animation**: Framer Motion
- **Build Tool**: Vite
- **Data Processing**: Node.js script with Octokit (GitHub API)
- **Automation**: GitHub Actions

## 📦 How It Works

### Data Processing

This application uses an automated GitHub Actions workflow to:

1. Fetch package manifests from microsoft/winget-pkgs repository
2. Parse YAML manifest files for metadata
3. Extract package icons from Microsoft Store and Clearbit Logo API
4. Generate a consolidated JSON file with all package data
5. Automatically update the data weekly

The frontend loads this pre-processed data for optimal performance, with graceful fallbacks to:
- Live GitHub API fetching (if static data unavailable)
- Mock data (if both previous methods fail)

For detailed information, see [WINGET_DATA_SYSTEM.md](./WINGET_DATA_SYSTEM.md).

### GitHub Actions Workflow

The automated data fetching workflow runs:

- **Weekly**: Every Sunday at midnight (UTC)
- **Manually**: Via workflow dispatch in GitHub Actions tab
- **On Update**: When the workflow file is modified

## 🔧 Development

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

### Manual Data Refresh

To manually fetch and process winget package data:

```bash
# Install script dependencies
npm install js-yaml octokit

# Optional: Set GitHub token for higher rate limits
export GITHUB_TOKEN=your_github_token_here

# Run the data fetching script
node scripts/fetch-winget-data.js
```

This will update `public/data/packages.json`.

## 📁 Project Structure

```
.
├── .github/
│   └── workflows/
│       └── fetch-winget-data.yml    # Automated data fetching workflow
├── public/
│   └── data/
│       └── packages.json            # Pre-processed package data
├── scripts/
│   └── fetch-winget-data.js         # Data fetching and processing script
├── src/
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── PackageCard.tsx          # Package list item with icon
│   │   ├── PackageDetail.tsx        # Package detail view
│   │   └── EmptyState.tsx           # Empty search results state
│   ├── hooks/
│   │   └── use-winget-packages.ts   # Data loading hook
│   ├── lib/
│   │   ├── staticDataApi.ts         # Static JSON data loader
│   │   ├── wingetApi.ts             # Live GitHub API client
│   │   ├── types.ts                 # TypeScript interfaces
│   │   └── mockData.ts              # Fallback mock data
│   └── App.tsx                      # Main application component
└── WINGET_DATA_SYSTEM.md            # Detailed system documentation
```

## ⚙️ Configuration

### Adjust Package Count

Edit `scripts/fetch-winget-data.js`:

```javascript
const MAX_PACKAGES = 500  // Change this number
```

### Change Update Schedule

Edit `.github/workflows/fetch-winget-data.yml`:

```yaml
schedule:
  - cron: '0 0 * * 0'  # Current: weekly on Sunday
  # Examples:
  # '0 0 * * *'   - Daily at midnight
  # '0 0 * * 1'   - Weekly on Monday
  # '0 0 1 * *'   - Monthly on the 1st
```

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
