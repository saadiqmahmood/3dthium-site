# 🚀 Biome Setup for 3dthium

## Why Biome?

**Biome** is a fast, all-in-one toolchain for web projects:
- ⚡ **100x faster than ESLint** (written in Rust)
- 🎨 **Formatter + Linter** in one tool (replaces ESLint + Prettier)
- 🔧 **Zero config** needed (works out of the box)
- 📦 **Single dependency** (not multiple tools)
- 🎯 **Better error messages**

---

## What It Replaces

### Before:
```json
{
  "devDependencies": {
    "eslint": "^9",
    "eslint-config-next": "15.3.3",
    "prettier": "...",
    "prettier-plugin-tailwindcss": "..."
  }
}
```

### After:
```json
{
  "devDependencies": {
    "@biomejs/biome": "latest"
  }
}
```

**One tool instead of 4+!**

---

## Installation

```bash
# Install Biome
npm install --save-dev --save-exact @biomejs/biome

# Initialize config
npx @biomejs/biome init
```

---

## Configuration

Biome will create `biome.json` with sensible defaults. You can customize it:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": [
      "node_modules",
      ".next",
      "out",
      "build",
      "dist",
      ".vercel",
      "*.config.js",
      "*.config.mjs"
    ]
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off",
        "useImportType": "off"
      },
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "es5"
    }
  },
  "overrides": [
    {
      "include": ["*.tsx", "*.ts"],
      "linter": {
        "rules": {
          "correctness": {
            "useExhaustiveDependencies": "warn"
          }
        }
      }
    }
  ]
}
```

---

## NPM Scripts

Update your `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check --write .",
    "ci": "biome ci ."
  }
}
```

---

## Usage

### Check Everything (Lint + Format)
```bash
npm run check
```

### Lint Only
```bash
npm run lint         # Check for issues
npm run lint:fix     # Fix issues
```

### Format Only
```bash
npm run format       # Format all files
```

### CI/CD
```bash
npm run ci           # Run in CI (no fixes, just check)
```

---

## VS Code Integration

Install the Biome extension:
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search for "Biome"
4. Install "Biome" by biomejs
5. Set as default formatter

**Settings.json:**
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Migration from ESLint

### Remove Old Tools
```bash
npm uninstall eslint eslint-config-next @eslint/eslintrc
```

### Delete Config Files
```bash
rm -f eslint.config.mjs .eslintrc.json .prettierrc
```

### Run Biome
```bash
npm run check
```

---

## Benefits for Your Project

1. **Speed**
   - ESLint: ~5-10 seconds
   - Biome: ~0.5 seconds
   - **10-20x faster!**

2. **Simplicity**
   - One tool, one config file
   - No plugin conflicts
   - Clear error messages

3. **Auto-fix**
   - Format on save
   - Auto-import organization
   - Auto-fix linting issues

4. **Better DX**
   - Instant feedback
   - Clear, actionable errors
   - Great VS Code integration

---

## Example: Before vs After

### Before (ESLint)
```bash
npm run lint
# Takes 5-10 seconds
# Shows cryptic errors
# Doesn't format code
```

### After (Biome)
```bash
npm run check
# Takes <1 second
# Shows clear errors
# Formats + lints + fixes imports
```

---

## Ready to Switch?

I can set it up for you in 3 steps:
1. Install Biome
2. Create config
3. Remove ESLint
4. Update npm scripts

Want me to do it? 🚀

