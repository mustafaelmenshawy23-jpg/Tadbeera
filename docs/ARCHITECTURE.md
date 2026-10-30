# Tadbeera application architecture

## Current baseline
The Android app runs the React/Vite interface inside Capacitor. The main screen implementation is currently concentrated in `src/App.tsx` (a large component), while seed data, calculations, device services, and a small number of components already live in separate folders.

## Target structure

```text
src/
  app/          # app-wide navigation, providers, configuration
  components/   # shared UI primitives
  features/
    kitchen/    # recipes, ingredients, meal planning
    finance/    # budgets, expenses, reports
    shopping/   # shopping lists and purchase flow
    inventory/  # pantry, fridge, freezer, expiry dates
    household/  # household profile, chores, reminders
    savings/    # saving goals and insights
  data/         # seed data and pure domain calculations
  services/     # Capacitor/device integrations and persistence adapters
  hooks/        # reusable React hooks
```

## Incremental migration rules
1. Keep existing tab IDs stable until routing and persisted state are migrated deliberately.
2. Extract one feature at a time; do not perform a large all-at-once rewrite of the current screen.
3. Move pure calculations before moving UI, and add tests around calculations where practical.
4. Feature modules own their screens and feature-specific state; shared components stay presentation-only.
5. Access persistence through a repository/service boundary so later local-first storage does not couple screens to a database.
6. Keep the app usable offline; optional cloud sync must be layered on top of local repositories and never be required to open core screens.

## First navigation refactor
Primary navigation type definitions now live in `src/app/navigation.ts`. The current screen rendering remains in `src/App.tsx` for this first low-risk step. The next extraction should move one self-contained feature (starting with saved content or shopping) after its state and persistence dependencies are mapped.
