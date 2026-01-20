# Dark Mode Implementation

## Overview

The app implements a "Nordic Twilight" dark theme - deep fjord blues (not harsh black) with warm amber accents, matching the Scandinavian minimalist aesthetic of the light mode.

## Architecture

### Files

| File | Purpose |
|------|---------|
| `frontend/tailwind.config.ts` | Enables `darkMode: "class"` strategy |
| `frontend/src/components/ThemeProvider.tsx` | React context for theme state & persistence |
| `frontend/src/components/ThemeSwitcher.tsx` | Sun/Moon toggle UI component |
| `frontend/src/app/[locale]/layout.tsx` | Wraps app in ThemeProvider, anti-flash script |
| `frontend/src/app/globals.css` | Dark mode CSS variables & overrides |

### Theme Flow

```
1. Page Load
   └── Inline script in <head> reads localStorage
       └── Applies 'dark' class to <html> if needed (prevents flash)

2. React Hydration
   └── ThemeProvider initializes
       └── Reads localStorage for saved preference
       └── Listens to prefers-color-scheme media query
       └── Manages 'dark' class on <html>

3. User Interaction
   └── ThemeSwitcher calls setTheme()
       └── Updates localStorage
       └── Updates <html> class
       └── Re-renders with new resolvedTheme
```

## Color Mapping

| Element | Light | Dark |
|---------|-------|------|
| Page background | `#FAF9F6` (cream) | `#1a2332` (fjord-900) |
| Card surface | `#FFFFFF` (paper) | `#243447` (fjord-800) |
| Primary text | fjord-800 | `#e2e8f0` |
| Secondary text | stone | `#94a3b8` |
| Icons | fjord-500 | `#38bdf8` (bright sky blue) |
| Success icons | forest-500 | `#4ade80` (bright green) |
| Accent | amber | `#fbbf24` (bright amber) |
| Borders | fjord-100 | `rgba(148, 163, 184, 0.15)` |

## CSS Variables

Defined in `globals.css`:

```css
:root {
  --color-cream: #FAF9F6;
  --color-paper: #FFFFFF;
  --color-fjord: #2D4A5E;
  --color-forest: #3D5A47;
  --color-amber: #C4956A;
  --color-stone: #6B7280;
}

html.dark {
  --color-cream: #1a2332;
  --color-paper: #243447;
  --color-fjord: #94a3b8;
  --color-forest: #78A287;
  --color-amber: #d4a574;
  --color-stone: #9CA3AF;
}
```

## Key Implementation Details

### Preventing Flash of Wrong Theme (FOUC)

An inline script in `layout.tsx` runs before React hydrates:

```typescript
const themeScript = `
  (function() {
    const stored = localStorage.getItem('kvitteringshvelv-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || 'system';
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  })();
`;
```

The `<html>` element uses `suppressHydrationWarning` to prevent React warnings about the class mismatch.

### Tailwind Color Override Challenge

Tailwind compiles utility classes like `bg-paper` to hardcoded hex values (`#FFFFFF`), not CSS variables. To make dark mode work, we use CSS overrides with `!important`:

```css
html.dark .paper-card {
  background-color: #243447 !important;
  border: 1px solid rgba(148, 163, 184, 0.15) !important;
}

html.dark .text-fjord-800 {
  color: #e2e8f0 !important;
}
```

### Theme Persistence

- Storage key: `kvitteringshvelv-theme`
- Values: `"light"`, `"dark"`, or `"system"`
- Default: `"system"` (follows OS preference)

### System Preference

ThemeProvider listens to `prefers-color-scheme` changes:

```typescript
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
mediaQuery.addEventListener("change", handleChange);
```

## Adding Dark Mode to New Components

1. **Use existing utility classes** - They have dark overrides in `globals.css`
2. **For new patterns**, add Tailwind dark variants:
   ```jsx
   <div className="bg-white dark:bg-slate-800 text-fjord-700 dark:text-slate-200">
   ```
3. **For complex overrides**, add CSS rules:
   ```css
   html.dark .my-new-component {
     background-color: #243447 !important;
   }
   ```

## ThemeSwitcher Usage

```tsx
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// In your component:
<ThemeSwitcher />
```

## useTheme Hook

```tsx
import { useTheme } from "@/components/ThemeProvider";

function MyComponent() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // theme: "light" | "dark" | "system"
  // resolvedTheme: "light" | "dark" (actual applied theme)
  // setTheme: (theme) => void
}
```
