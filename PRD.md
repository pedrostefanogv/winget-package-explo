# Planning Guide

A web application that allows users to search, browse, and view detailed information about Windows Package Manager (winget) application packages. Data is automatically fetched and processed weekly via GitHub Actions from the microsoft/winget-pkgs repository, including package icons for visual identification.

**Experience Qualities**:
1. **Efficient** - Users should be able to quickly search and find package information without friction
2. **Informative** - Package details should be presented clearly with all relevant metadata visible at a glance
3. **Technical** - The design should appeal to developers and system administrators who use winget regularly

**Complexity Level**: Light Application (multiple features with basic state)
- This is a search and display application with filtering capabilities, package detail views, and automated data processing. A GitHub Actions workflow pre-processes package data weekly from microsoft/winget-pkgs, including package icons. The frontend loads this optimized data with graceful fallbacks to live API or mock data.

## Essential Features

### Package Search
- **Functionality**: Search winget packages by name, ID, or publisher using real-time filtering with multi-language support
- **Purpose**: Enable quick discovery of packages without requiring command-line access in user's preferred language
- **Trigger**: User types into the search input field
- **Progression**: User enters search term → Results filter in real-time → User sees matching packages → User clicks package for details
- **Success criteria**: Search results update within 100ms and accurately match package names, IDs, and publishers

### Multi-Language Support
- **Functionality**: Switch between Portuguese (Brazil), English (USA), Spanish, French, and German interface languages with persistent preference and automatic browser language detection
- **Purpose**: Make the application accessible to international users across multiple languages, with Portuguese as the default for Brazilian developers
- **Trigger**: User clicks language selector in header or loads app for first time (auto-detects browser language)
- **Progression**: User clicks language selector → Dropdown shows 5 available languages with flags → User selects language → All UI text updates instantly → Preference saved for future visits
- **Success criteria**: All interface text translates instantly across 5 languages, user preference persists across sessions via KV storage, browser language auto-detected on first visit, no page reload required

### Package List View
- **Functionality**: Display a scrollable list of winget packages with key metadata (name, ID, publisher, version) and package icons
- **Purpose**: Provide an overview of winget packages with visual identification through icons
- **Trigger**: App loads and fetches pre-processed data from static JSON file
- **Progression**: App initializes → Load static data → Packages render with icons → User scrolls to browse
- **Success criteria**: List displays packages with icons, smooth scrolling, clear visual hierarchy, and graceful fallback to API or mock data if static data unavailable

### Package Detail View
- **Functionality**: Show comprehensive information about a selected package including description, versions, license, homepage, install commands, and package icon
- **Purpose**: Provide all metadata a user needs to understand and install a package with visual confirmation via icon
- **Trigger**: User clicks on a package card from the list
- **Progression**: User clicks package → Detail panel/modal opens → Full metadata displays with icon → User can copy install command
- **Success criteria**: All relevant package manifest fields are displayed with icon (when available) and copy-to-clipboard functionality for install commands

### Category/Publisher Filtering
- **Functionality**: Filter packages by category tags or publisher name from live GitHub data
- **Purpose**: Help users narrow down results when browsing for specific types of applications
- **Trigger**: User selects a category chip or publisher filter
- **Progression**: User clicks filter → List updates to show only matching packages → User can clear filter to reset
- **Success criteria**: Filters apply immediately and can be combined with search queries

### Automated Data Processing
- **Functionality**: GitHub Actions workflow that runs weekly to fetch, process, and store package data with icons from microsoft/winget-pkgs
- **Purpose**: Provide optimized, up-to-date package data without relying on real-time API calls, including visual identification through icons
- **Trigger**: Automated weekly schedule (Sundays at midnight UTC), manual workflow dispatch, or workflow file updates
- **Progression**: Workflow triggers → Fetch manifests from GitHub → Parse YAML → Extract metadata and icons → Generate JSON → Commit to repository
- **Success criteria**: Successfully processes 500+ packages weekly with metadata and icon URLs, commits updated JSON file, completes within GitHub Actions time limits

## Edge Case Handling

- **Language Not Set**: Auto-detect browser language (supports Portuguese, English, Spanish, French, German) and fall back to Portuguese (Brazil) if no match
- **No Search Results**: Display a helpful empty state with suggestions to try different search terms or clear filters (translated)
- **Package Without Description**: Show a placeholder message indicating description is unavailable in the manifest (translated)
- **Package Without Icon**: Display a default package icon when no icon URL is available or image fails to load
- **Long Package Names/IDs**: Truncate with ellipsis and show full text on hover with tooltip
- **Missing Package Metadata**: Gracefully handle missing fields by showing "Not specified" or hiding the field entirely (translated)
- **Slow Network**: Show loading skeletons while data fetches to maintain perceived performance (translated loading text)
- **Static Data Unavailable**: Automatically fall back to live GitHub API, then mock data if necessary (translated alerts)
- **GitHub API Errors**: Display error alert with retry button, automatically fall back to mock data for demo purposes (translated)
- **Rate Limiting**: Handle GitHub API rate limits gracefully with informative error messages (translated)
- **Invalid YAML Manifests**: Skip packages with malformed manifests and continue processing others
- **CORS Issues with Icons**: Handle image loading errors and display fallback icon

## Design Direction

The design should evoke a sense of technical precision and developer-focused efficiency. Think command-line aesthetics meeting modern web UI - monospace accents for technical data, sharp edges, high contrast, and a color palette that references terminal themes. The interface should feel fast, focused, and purpose-built for developers.

## Color Selection

A technical, developer-focused palette inspired by modern terminal themes with high contrast and clear information hierarchy.

- **Primary Color**: Deep electric blue `oklch(0.45 0.19 252)` - represents technology and trust, used for interactive elements and primary actions
- **Secondary Colors**: 
  - Dark slate background `oklch(0.15 0.01 252)` - provides a sophisticated, low-eye-strain canvas
  - Muted gray `oklch(0.25 0.01 252)` - for cards and elevated surfaces
- **Accent Color**: Bright cyan `oklch(0.75 0.15 195)` - high-energy highlight for CTAs, active states, and important information
- **Foreground/Background Pairings**:
  - Background (Dark Slate #1c1d29): Light text `oklch(0.95 0.01 252)` - Ratio 13.2:1 ✓
  - Card (Muted Gray #2d2e3f): Light text `oklch(0.95 0.01 252)` - Ratio 10.8:1 ✓
  - Primary (Electric Blue #2d5bd6): White text `oklch(0.99 0 0)` - Ratio 6.1:1 ✓
  - Accent (Bright Cyan #4dd4e8): Dark text `oklch(0.15 0.01 252)` - Ratio 8.9:1 ✓

## Font Selection

Typography should convey technical precision while maintaining readability - a modern sans-serif for UI elements and monospace for package IDs, commands, and technical data.

- **Typographic Hierarchy**:
  - H1 (Page Title): Space Grotesk Bold/32px/tight letter spacing (-0.02em)
  - H2 (Package Name): Space Grotesk SemiBold/24px/normal letter spacing
  - H3 (Section Headers): Space Grotesk Medium/18px/normal letter spacing
  - Body Text: Space Grotesk Regular/15px/relaxed line height (1.6)
  - Technical Text (IDs, Commands): JetBrains Mono Regular/14px/normal line height (1.5)
  - Labels/Metadata: Space Grotesk Medium/13px/wide letter spacing (0.02em) uppercase

## Animations

Animations should feel snappy and responsive, reinforcing the technical efficiency of the tool. Use subtle micro-interactions for feedback and smooth transitions for state changes.

- Search results fade in with a subtle stagger effect (50ms delay between items)
- Filter chips animate in with a scale-up effect when applied
- Detail panels slide in from the right with a smooth easing curve
- Hover states on package cards include a subtle lift and glow effect
- Copy-to-clipboard button shows a success checkmark animation

## Component Selection

- **Components**:
  - `Input`: Search bar with icon, used with Phosphor MagnifyingGlass icon and clear button
  - `Card`: Package list items and detail panels with custom hover states and borders
  - `Badge`: Category tags and version indicators with rounded style
  - `Button`: Primary actions (copy command, open links) with solid primary variant
  - `ScrollArea`: Smooth scrolling for package list and detail content
  - `Dialog`: Full-screen package detail view on mobile, slide-in panel on desktop
  - `Skeleton`: Loading states for package cards during data fetch
  - `Separator`: Visual dividers between detail sections
  - `Tooltip`: Show full text for truncated package names/IDs

- **Customizations**:
  - Custom package card component with hover glow effect using pseudo-elements
  - Code block component for install commands with syntax highlighting
  - Filter chip component with dismiss button using Toggle or custom Badge
  - Empty state illustration component for no results
  - Language selector dropdown with flag emojis and localized language names

- **States**:
  - Search input: default border, focused with cyan glow ring, filled with clear button visible
  - Package cards: default with subtle border, hover with lift and cyan accent border, active/selected with persistent cyan border
  - Copy button: default with icon, hover with scale, clicked shows success checkmark for 2s
  - Filter chips: inactive gray, active with primary background, hover with scale effect

- **Icon Selection**:
  - MagnifyingGlass: Search input
  - Package: Package icon in cards
  - Copy: Copy to clipboard action
  - X: Clear search, dismiss filters
  - Download: Install action indicator
  - Globe: Homepage link
  - ArrowRight: Navigate to details
  - Check: Success state for copy action
  - FunnelSimple: Filter indicator
  - Translate: Language selector button

- **Spacing**:
  - Container padding: px-6 py-8 on desktop, px-4 py-6 on mobile
  - Card spacing: gap-4 between cards in list
  - Inner card padding: p-5 for package cards, p-6 for detail panels
  - Section spacing: space-y-6 for major sections, space-y-3 for related content
  - Filter chip gap: gap-2 for horizontal chip list

- **Mobile**:
  - Stack search and filters vertically on mobile (<768px)
  - Full-width package cards with reduced padding (p-4)
  - Detail view transitions to full-screen Dialog instead of side panel
  - Reduce font sizes by 1-2px across hierarchy on mobile
  - Single column layout with search at top, filters below, list fills remaining space
  - Touch-friendly tap targets (min 44px height for interactive elements)
