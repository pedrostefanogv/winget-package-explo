# Winget Package Explorer

A modern web application for searching and exploring Windows Package Manager (winget) packages with live data from the official microsoft/winget-pkgs GitHub repository.

## 🚀 Features

- **Live GitHub API Integration**: Fetches real package data directly from microsoft/winget-pkgs
- **Real-time Search**: Search packages by name, ID, publisher, or description
- **Category Filtering**: Browse packages by category with interactive filter chips
- **Detailed Package View**: View comprehensive information including install commands, licenses, and metadata
- **Graceful Fallbacks**: Automatically falls back to sample data if GitHub API is unavailable
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with shadcn components and Tailwind CSS with a technical, developer-focused aesthetic

## 🛠️ Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **API**: GitHub REST API

## 📦 How It Works

The app fetches package manifests from the microsoft/winget-pkgs repository using the GitHub API:

1. **On Load**: Fetches up to 100 package manifests from the repository tree
2. **Parsing**: Extracts YAML manifest data (PackageIdentifier, PackageName, Publisher, etc.)
3. **Display**: Renders searchable, filterable package cards with full details
4. **Error Handling**: If API fails or rate limits are hit, gracefully falls back to mock data

## 🔧 Development

This Spark template comes pre-configured with all dependencies. Simply start editing:

- `src/App.tsx` - Main application component
- `src/lib/wingetApi.ts` - GitHub API integration logic
- `src/hooks/use-winget-packages.ts` - Custom hook for package data
- `src/components/` - Reusable UI components

## 📄 License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.
