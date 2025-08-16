# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reload (Vite + Electron)
- `npm run build` - Build for production (TypeScript check + Vite build + Electron Builder)
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build (renderer only)

## Project Architecture

**FlowLearn** is an Electron-based desktop application that automates vocabulary collection and review using AI. It monitors clipboard activity, collects new words, generates prompts for AI tools, and manages a spaced repetition learning system.

### Core Components

#### Main Process (`electron/main.ts`)
- **Clipboard Monitoring**: Watches clipboard for new text content
- **Basket Management**: Collects words until threshold is reached
- **AI Result Parsing**: Extracts structured JSON from AI responses (supports both pure JSON and rich text with delimiters)
- **Spaced Repetition**: Implements FSRS algorithm for scheduling reviews
- **System Integration**: Manages tray icon, global hotkeys, notifications
- **Data Persistence**: Stores settings and vocabulary in JSON files in userData directory

#### Renderer Process (`src/`)
- **Main App** (`src/App.tsx`): Central hub managing state, navigation, and IPC communication
- **Features Architecture**: Modular feature-based organization in `src/features/`
  - `vocab/`: Vocabulary list, detail view, filters, search
  - `review/`: Spaced repetition flashcard interface
  - `settings/`: Application configuration UI
- **Internationalization**: Full i18n support (Chinese/English) using react-i18next

#### Key Data Structures
- **Word**: Core vocabulary entity with review status, FSRS fields, and analysis
- **Settings**: User preferences including AI prompts, filters, TTS configuration
- **CollectedItem**: Temporary basket items before AI processing

### Data Flow

1. **Collection**: Clipboard → Text filtering → Basket (in-memory)
2. **AI Integration**: Basket → Prompt generation → Clipboard → User copies AI response → JSON extraction → Database
3. **Review**: Database → FSRS scheduling → Flashcard interface → Review results → Update scheduling

### Technology Stack

- **Electron**: Desktop application framework
- **React + TypeScript**: Frontend development
- **Vite**: Build tool and dev server
- **i18next**: Internationalization
- **ESLint**: Code linting
- **electron-builder**: Application packaging

### File Organization

```
src/
├── features/           # Feature-based modules
│   ├── vocab/         # Vocabulary management
│   ├── review/        # Spaced repetition review
│   └── settings/      # Application settings
├── lib/               # Shared utilities (IPC, date helpers)
└── shared/            # Type definitions
```

### Development Notes

- **IPC Communication**: All main process communication goes through `src/lib/ipc.ts`
- **State Management**: React hooks + IPC, no external state management library
- **Styling**: CSS with CSS variables for theming
- **Path Aliases**: `@features`, `@lib`, `@shared` configured in vite.config.ts
- **Database**: Currently JSON files stored in userData directory (settings.json, vocab.json)

### Important Implementation Details

- **AI Response Parsing**: Supports two modes:
  - `json-only`: Expects pure JSON array response
  - `rich-summary`: Expects detailed text with `BEGIN_FLOWLEARN_JSON`/`END_FLOWLEARN_JSON` delimiters
- **FSRS Algorithm**: Custom implementation of Free Spaced Repetition Scheduler
- **Clipboard Filtering**: Configurable rules for word collection (min/max words, regex exclusions, multiline handling)
- **TTS Support**: Both local browser speech synthesis and Volcengine cloud TTS
- **Backup System**: Automatic daily backups with manual backup/restore functionality

### Build and Packaging

- **Output**: `dist/` (renderer), `dist-electron/` (main), `release/` (installers)
- **Platform Support**: Windows (NSIS), macOS (DMG), Linux (AppImage)
- **Icons**: Place in `public/` directory (icon.ico/icon.png for app, tray.* for system tray)