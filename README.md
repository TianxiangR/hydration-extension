# React Hydration Inspector

A Chrome DevTools extension for detecting and debugging React hydration mismatches in server-side rendered (SSR) applications.

## 🎯 What It Does

React Hydration Inspector monitors your React applications in real-time and automatically detects hydration mismatches—when the server-rendered HTML differs from what React expects during client-side hydration. These mismatches can cause:

- Silent rendering bugs
- Accessibility issues
- Performance problems
- Unexpected UI behavior

This extension captures both the initial SSR HTML and post-hydration DOM, compares them, and presents a beautiful side-by-side diff to help you quickly identify and fix issues.

## ✨ Features

- **🔍 Real-Time Detection**: Automatically detects React hydration mismatches as they occur
- **📊 Visual Diff Viewer**: Side-by-side comparison with syntax highlighting
- **📝 Error History**: Persistent storage of all hydration errors with timestamps
- **🔎 Search & Filter**: Find specific errors by URL or content
- **💾 Export**: Download full HTML snapshots for deeper analysis
- **📋 Copy Snippets**: Quick copy of formatted HTML sections
- **⚡ Zero Performance Impact**: Minimal overhead on your application
- **🎨 Beautiful UI**: Clean, modern interface integrated into Chrome DevTools

## 📦 Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store listing](#) (coming soon)
2. Click "Add to Chrome"
3. Open Chrome DevTools (F12 or right-click → Inspect)
4. Look for the "Hydration" tab

### Manual Installation (Development)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/hydration-extension.git
   cd hydration-extension
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Build the extension:
   ```bash
   yarn build
   ```

4. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

## 🚀 Usage

### Basic Usage

1. **Open DevTools** on any React SSR application
2. Navigate to the **"Hydration"** tab
3. Reload the page
4. The extension will automatically:
   - Detect if React is present
   - Monitor the hydration process
   - Alert you of any mismatches

### Understanding the Interface

#### Current Page Status Tab
- Shows live hydration status for the current page
- Displays "✓ No hydration issues detected" for clean hydrations
- Shows detailed diff comparison when mismatches occur
- Includes formatted HTML snippets with copy/download options

#### Existing Errors Tab
- Lists all historical hydration errors across your browsing session
- Persistent storage (survives page reloads)
- Search by URL or HTML content
- Click any error to view full details
- Delete individual errors or clear all

### Reading the Diff

The extension shows three views:

1. **Code Diff**: Line-by-line comparison with `+` (added) and `-` (removed) indicators
2. **Side-by-Side Comparison**: Live preview of SSR HTML vs. hydrated HTML in iframes
3. **Full HTML Downloads**: Export complete HTML for external analysis

## 🏗️ Architecture

### Extension Components

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Content   │◄────►│  Background │◄────►│  DevTools   │
│   Script    │      │   Service   │      │    Panel    │
└─────────────┘      └─────────────┘      └─────────────┘
       │                                          │
       ▼                                          ▼
┌─────────────┐                          ┌─────────────┐
│   Injected  │                          │    React    │
│    Script   │                          │   UI + Redux│
└─────────────┘                          └─────────────┘
```

- **Injected Script**: Hooks into React's internal APIs to detect hydration
- **Content Script**: Captures DOM snapshots and computes diffs
- **Background Service**: Manages connections and state synchronization
- **DevTools Panel**: React-based UI with Redux state management

### Key Technologies

- **React 19** + **React Redux** for UI
- **Redux Toolkit** for state management
- **Prettier** for HTML formatting
- **Diff** library for line-by-line comparison
- **TypeScript** for type safety
- **Vite** for optimized builds
- **IndexedDB** for persistent storage

### Build System

The extension uses separate Vite configurations for optimal bundling:

- **Background script** (`vite.config.background.ts`): Service worker bundle
- **Content script** (`vite.config.content.ts`): Self-contained page script
- **Injected script** (`vite.config.inject.ts`): Minimal React hook
- **UI bundle** (`vite.config.ui.ts`): DevTools panel with code splitting

This approach ensures:
- No shared chunks between isolated scripts
- Optimal bundle sizes
- Fast loading times

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- Yarn 1.22+

### Setup

```bash
# Install dependencies
yarn install

# Build for development
yarn build

# Lint code
yarn lint

# Create distribution zip
yarn zip
```

### Project Structure

```
hydration-extension/
├── src/
│   ├── background/          # Background service worker
│   ├── content/             # Content script
│   ├── devtools/            # DevTools initialization
│   ├── injected/            # React hook injection
│   ├── ui/                  # React components
│   │   ├── Layout/          # Main layout
│   │   ├── SidePanel/       # Error list sidebar
│   │   ├── CurrentPageStatus/ # Live status view
│   │   ├── ExistingError/   # Historical error view
│   │   └── HydrationDiffViewer/ # Reusable diff component
│   ├── store/               # Redux store
│   ├── hooks/               # React hooks
│   ├── utils/               # Utilities
│   └── types/               # TypeScript types
├── public/                  # Static assets
├── dist/                    # Build output (git-ignored)
└── docs/                    # Documentation
```

### Key Files

- `src/utils/portConnection.ts` - Generic Chrome port connection manager
- `src/content/index.ts` - Main content script with hydration detection
- `src/background/index.ts` - Message relay and state management
- `src/store/` - Redux state for errors, UI, and storage
- `src/ui/` - React components for the DevTools panel

### Making Changes

1. **Modify source code** in `src/`
2. **Rebuild** with `yarn build`
3. **Reload extension** in `chrome://extensions/`
4. **Refresh DevTools** to see changes

For content script changes, you may need to reload the inspected page.

## 🧪 Testing

The extension has been tested with:

- ✅ Next.js (App Router & Pages Router)
- ✅ Remix
- ✅ Gatsby
- ✅ Custom React SSR setups

## 🔒 Privacy & Permissions

The extension requires the following permissions:

- **`activeTab`**: To inject detection scripts into the current page
- **`scripting`**: To run hydration detection code
- **`storage`**: To save error history locally (IndexedDB)
- **`sidePanel`** / **`devtools`**: To display the DevTools panel
- **`downloads`**: To export HTML files
- **Host permissions (`<all_urls>`)**: To work on any website you're developing

**Privacy commitment**: All data is stored locally. Nothing is sent to external servers.

## 📝 Remote Code Justification

This extension uses `new Function()` to inject a React DevTools hook into the page's JavaScript context. This is necessary because Chrome extensions run in an isolated environment and cannot directly access React's internal APIs.

**Important**: Only predefined, static code bundled within the extension is executed. No remote code, user input, or arbitrary code execution occurs. This is the same technique used by the official React DevTools.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🐛 Known Issues

- The extension only detects hydration mismatches, not other React errors
- Currently requires React 16.8+ (hooks support)
- Large HTML diffs may impact performance

## 🗺️ Roadmap

- [ ] Support for other frameworks (Vue, Svelte SSR)
- [ ] Performance metrics and timing information
- [ ] Integration with CI/CD for automated testing
- [ ] Export to various formats (JSON, CSV)
- [ ] Configurable ignore patterns

## 💬 Support

- 🐛 [Report a bug](https://github.com/yourusername/hydration-extension/issues)
- 💡 [Request a feature](https://github.com/yourusername/hydration-extension/issues)
- 📧 [Email support](mailto:support@example.com)

## 🙏 Acknowledgments

- Inspired by the official [React DevTools](https://github.com/facebook/react/tree/main/packages/react-devtools)
- Built with guidance from the [Chrome Extensions documentation](https://developer.chrome.com/docs/extensions/)

---

**Made with ❤️ for the React community**

