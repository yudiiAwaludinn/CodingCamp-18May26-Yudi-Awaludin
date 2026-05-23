# Design Document — Todo-Dashboard Challenge Features

## Overview

This document describes the technical design for five challenge features added to the existing **Todo-Life Dashboard** — a single-page productivity application built with plain HTML, CSS, and vanilla JavaScript. All changes are confined to the three existing files: `index.html`, `css/styles.css`, and `js/app.js`. No frameworks, build tools, or additional files are introduced.

### Features Covered

| # | Feature | localStorage Key | Default |
|---|---------|-----------------|---------|
| 1 | Light / Dark Mode Toggle | `tld_theme` | `"dark"` |
| 2 | Custom User Name in Greeting | `tld_username` | `""` |
| 3 | Custom Pomodoro Timer Duration | `tld_duration` | `25` |
| 4 | Prevent Duplicate Tasks | *(no new key)* | — |
| 5 | Sort Tasks | `tld_sort` | `"creation"` |

All four new preference keys (`tld_theme`, `tld_username`, `tld_duration`, `tld_sort`) are distinct from the existing keys `tld_tasks` and `tld_links`.

### Design Goals

- **Zero new files**: every addition lives inside the three existing files.
- **Backward compatibility**: existing task and link data in localStorage is untouched.
- **Graceful degradation**: localStorage failures produce a toast notification and fall back to in-memory defaults; no uncaught errors are thrown.
- **Accessibility**: all new controls are keyboard-operable and meet WCAG 2.1 AA contrast requirements in both themes.

---

## Architecture

The application follows the existing **module-per-panel** pattern already established in `app.js`. Each module is an IIFE or object literal with `init()`, `render()`, and persistence helpers. The five new features extend or add to these modules:

```
DOMContentLoaded
  ├── ThemeModule.init()          ← NEW (runs first to avoid FOUC)
  ├── GreetingModule.init()       ← EXTENDED (adds NameEditor)
  ├── TimerModule.init()          ← EXTENDED (adds DurationInput)
  ├── TaskModule.init()           ← EXTENDED (adds duplicate check + sort)
  └── LinkModule.init()           ← unchanged
```

**Initialisation order matters**: `ThemeModule.init()` must run before any panel renders so the correct CSS custom properties are in place on the first paint, preventing a flash of the wrong theme (FOUC).

### Data Flow

```
localStorage  ──read──►  Module.init()  ──apply──►  DOM
     ▲                                                │
     └──────────────────write──────────────────────────
```

Every preference is read once at init, applied to the DOM, and written back whenever the user changes it. In-memory state is the single source of truth during a session; localStorage is the persistence layer.

---

## Components and Interfaces

### 1. ThemeModule (new)

**Responsibility**: manage the active theme (`"dark"` | `"light"`), persist it, and apply it to the document.

**HTML additions** (`index.html`):
```html
<!-- Inside <body>, before the first <section> -->
<button
  id="theme-toggle"
  type="button"
  aria-label="Switch to Light Mode"
  title="Switch to Light Mode"
>🌙</button>
```

**CSS additions** (`styles.css`):
- A `[data-theme="light"]` selector on `<html>` overrides the dark-mode CSS custom properties defined in `:root`.
- The `#theme-toggle` button is positioned in the top-right corner of the viewport (fixed or absolute within the body grid).
- A `transition: background-color 200ms ease, color 200ms ease` on `body` and all panel elements ensures the colour change animates within the 200 ms requirement.

**JS interface** (`app.js`):
```js
const ThemeModule = {
  current: 'dark',          // 'dark' | 'light'
  apply(theme),             // sets data-theme on <html>, updates toggle label
  toggle(),                 // flips current, calls apply + save
  save(),                   // writes tld_theme to localStorage
  load(),                   // reads tld_theme; returns 'dark' on missing/invalid
  init()                    // load → apply → attach click listener
};
```

**Theme application mechanism**: `document.documentElement.setAttribute('data-theme', theme)`. The CSS file defines light-theme overrides under `[data-theme="light"] { --color-bg: ...; ... }`. This single attribute change triggers all colour transitions simultaneously.

---

### 2. NameEditor (extension of GreetingModule)

**Responsibility**: allow the user to set a display name that is appended to the greeting string.

**HTML additions** (`index.html`):
```html
<!-- Inside #greeting-panel, after #clock-date -->
<button id="name-edit-btn" type="button" aria-label="Set your name">✏️ Set Name</button>
<div id="name-editor" hidden>
  <input
    id="name-input"
    type="text"
    maxlength="50"
    placeholder="Your name…"
    aria-label="Your display name"
  />
  <button id="name-save-btn" type="button">Save</button>
  <button id="name-cancel-btn" type="button">Cancel</button>
  <span id="name-validation" role="alert"></span>
</div>
```

**JS interface** (added to `GreetingModule`):
```js
// New state
GreetingModule.userName = '';   // '' | string (1–50 chars)

// New methods
GreetingModule.loadName()       // reads tld_username; returns '' on missing
GreetingModule.saveName(name)   // validates, writes tld_username, calls render
GreetingModule.openEditor()     // shows #name-editor, focuses #name-input
GreetingModule.closeEditor()    // hides #name-editor
```

**Greeting format change** in `GreetingModule.render()`:
```js
var suffix = this.userName ? ', ' + this.userName + '!' : '';
greetingEl.textContent = greeting + suffix;
```

**Validation**: names longer than 50 characters are rejected with an inline message in `#name-validation`. Empty/whitespace-only saves clear the name and remove `tld_username` from localStorage.

---

### 3. DurationInput (extension of TimerModule)

**Responsibility**: allow the user to configure the Pomodoro session length (1–99 minutes).

**HTML additions** (`index.html`):
```html
<!-- Inside #timer-panel, after #timer-controls -->
<div id="duration-form">
  <label for="duration-input">Session (min):</label>
  <input
    id="duration-input"
    type="number"
    min="1"
    max="99"
    step="1"
    value="25"
    aria-label="Session duration in minutes"
  />
  <button id="duration-set-btn" type="button">Set</button>
  <span id="duration-validation" role="alert"></span>
</div>
```

**JS interface** (added to `TimerModule`):
```js
// New state
TimerModule.sessionMinutes = 25;   // integer in [1, 99]

// New methods
TimerModule.loadDuration()         // reads tld_duration; returns 25 on missing/invalid
TimerModule.saveDuration(minutes)  // validates, writes tld_duration
TimerModule.setDuration(minutes)   // stops timer, sets remaining = minutes * 60, renders
TimerModule.applyDuration(raw)     // parses raw input, validates, calls setDuration + saveDuration
```

**Validation**: non-integer, decimal, empty, or out-of-range (< 1 or > 99) values are rejected with an inline message in `#duration-validation`. Valid values stop any active countdown and reset the display to `MM:00`.

**Reset button update**: `TimerModule.reset()` is updated to reset to `this.sessionMinutes * 60` instead of the hard-coded `1500`.

---

### 4. Duplicate Task Prevention (extension of TaskModule)

**Responsibility**: reject add and edit operations whose description (case-insensitive, trimmed) matches an existing task.

**No HTML changes required** — the existing `#task-validation` span and the edit-mode `task-inline-msg` span are reused.

**JS changes** (inside `TaskModule`):

New helper:
```js
TaskModule.isDuplicate(description, excludeId)
// Returns true if any task (other than excludeId) has a trimmed,
// case-insensitive description equal to description.trim().toLowerCase()
```

`addTask()` change:
```js
if (this.isDuplicate(description, null)) {
  validationEl.textContent = 'A task with that description already exists.';
  return; // input field is NOT cleared
}
```

`editTask()` change:
```js
if (this.isDuplicate(newDescription, id)) {
  inlineMsgEl.textContent = 'A task with that description already exists.';
  return;
}
```

The existing `input` event listener on `#task-input` already clears `#task-validation` on any keystroke, satisfying requirement 4.4. A similar listener is added to the edit input inside `renderTask()` to clear the inline message on keystroke (requirement 4.7).

---

### 5. Sort Tasks (extension of TaskModule)

**Responsibility**: render the task list in one of three orders and persist the user's choice.

**HTML additions** (`index.html`):
```html
<!-- Inside #task-panel, between #task-form and #task-list -->
<div id="sort-controls" role="group" aria-label="Sort tasks by">
  <button class="sort-btn sort-btn--active" data-sort="creation" type="button">
    Creation
  </button>
  <button class="sort-btn" data-sort="alpha" type="button">A→Z</button>
  <button class="sort-btn" data-sort="status" type="button">Status</button>
</div>
```

**JS interface** (added to `TaskModule`):
```js
// New state
TaskModule.sortOrder = 'creation';   // 'creation' | 'alpha' | 'status'

// New methods
TaskModule.loadSort()                // reads tld_sort; returns 'creation' on missing/invalid
TaskModule.saveSort(order)           // writes tld_sort
TaskModule.getSortedTasks()          // returns a sorted copy of this.tasks
TaskModule.updateSortUI()            // adds/removes sort-btn--active class
```

**Sort implementations** inside `getSortedTasks()`:
- `creation`: return `[...this.tasks]` (original insertion order).
- `alpha`: sort copy by `description.toLowerCase()` using `localeCompare`.
- `status`: sort copy — incomplete tasks first (preserving creation order within each group), then complete tasks.

**`renderList()` change**: calls `this.getSortedTasks()` instead of `this.tasks` directly when building the `<li>` elements.

**Sort button active state**: the button matching `this.sortOrder` receives the class `sort-btn--active`; the others do not. This is updated in `updateSortUI()` which is called after every sort change and after every render.

---

## Data Models

### localStorage Key Registry

| Key | Type | Valid Values | Default |
|-----|------|-------------|---------|
| `tld_tasks` | JSON array | `[{ id, description, completed }]` | `[]` |
| `tld_links` | JSON array | `[{ id, label, url }]` | `[]` |
| `tld_theme` | JSON string | `"dark"` \| `"light"` | `"dark"` |
| `tld_username` | JSON string | `""` or 1–50 char string | `""` |
| `tld_duration` | JSON number | integer in [1, 99] | `25` |
| `tld_sort` | JSON string | `"creation"` \| `"alpha"` \| `"status"` | `"creation"` |

### Validation Rules (read-time)

When loading a preference from localStorage, the value is validated before use. If invalid, the default is applied silently:

```js
// tld_theme
function validateTheme(v) {
  return (v === 'dark' || v === 'light') ? v : 'dark';
}

// tld_username
function validateUsername(v) {
  if (typeof v !== 'string') return '';
  var trimmed = v.trim();
  return trimmed.length <= 50 ? trimmed : '';
}

// tld_duration
function validateDuration(v) {
  var n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : 25;
}

// tld_sort
function validateSort(v) {
  return ['creation', 'alpha', 'status'].includes(v) ? v : 'creation';
}
```

### Task Object Shape (unchanged)

```js
{
  id: string,           // Date.now() + '_' + Math.random()
  description: string,  // trimmed, 1–500 chars
  completed: boolean
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Theme Toggle is an Involution

*For any* active theme value (`"dark"` or `"light"`), activating the Theme_Toggle once should produce the opposite theme, and activating it a second time should restore the original theme.

**Validates: Requirements 1.2**

---

### Property 2: Theme Persistence Round-Trip

*For any* valid theme value (`"dark"` or `"light"`) stored in `tld_theme` in localStorage, calling `ThemeModule.load()` should return that exact value, and `ThemeModule.apply()` should set `document.documentElement.dataset.theme` to that value.

**Validates: Requirements 1.4, 1.6**

---

### Property 3: Theme Toggle Label Reflects Active Theme

*For any* active theme, the Theme_Toggle's `aria-label` and visible text should indicate the current theme and the action that will switch it (i.e., when `"dark"` is active the label references switching to light, and vice versa).

**Validates: Requirements 1.8**

---

### Property 4: Greeting Format with Valid Name

*For any* non-empty, non-whitespace-only string `name` of length ≤ 50 characters, after calling `GreetingModule.saveName(name)`, the greeting text rendered by `GreetingModule.render()` should match the pattern `"[Greeting], [name]!"` where `[Greeting]` is the time-of-day greeting.

**Validates: Requirements 2.2**

---

### Property 5: Name Persistence Round-Trip

*For any* valid name string (1–50 non-whitespace characters) stored in `tld_username` in localStorage, calling `GreetingModule.loadName()` should return that exact trimmed string, and the subsequent greeting render should include it.

**Validates: Requirements 2.3, 2.4**

---

### Property 6: Name Length Validation

*For any* string whose length exceeds 50 characters, attempting to save it via `GreetingModule.saveName()` should be rejected — the greeting should remain unchanged and `tld_username` in localStorage should not be updated to the invalid value.

**Validates: Requirements 2.7**

---

### Property 7: Duration Input Accepts All Valid Values

*For any* integer `d` in the range [1, 99], calling `TimerModule.applyDuration(String(d))` should result in `TimerModule.remaining` equalling `d * 60` and the timer display showing `formatTimer(d * 60)`.

**Validates: Requirements 3.1, 3.2**

---

### Property 8: Duration Persistence Round-Trip

*For any* valid duration integer `d` in [1, 99] stored in `tld_duration` in localStorage, calling `TimerModule.loadDuration()` should return `d`, and the timer display after `init()` should show `d` minutes in MM:SS format.

**Validates: Requirements 3.3, 3.4**

---

### Property 9: Duration Input Rejects All Invalid Values

*For any* value that is not a whole-number integer in [1, 99] (including decimals, strings, empty string, 0, 100, negative numbers), calling `TimerModule.applyDuration()` with that value should be rejected — `TimerModule.remaining` should be unchanged and a validation message should be displayed.

**Validates: Requirements 3.6, 3.7**

---

### Property 10: Duplicate Task Rejection (Add)

*For any* task list containing at least one task, and *for any* string that is a case-insensitive, trimmed match of any existing task's description, calling `TaskModule.addTask()` with that string should leave `TaskModule.tasks` unchanged (same length and same contents) and display a validation message.

**Validates: Requirements 4.1, 4.2**

---

### Property 11: Duplicate Task Rejection (Edit)

*For any* task list containing at least two tasks, and *for any* task `T` being edited, if the new description is a case-insensitive, trimmed match of any *other* task's description, calling `TaskModule.editTask()` should leave `T.description` unchanged and display an inline validation message.

**Validates: Requirements 4.5, 4.6**

---

### Property 12: Self-Edit is Not a Duplicate

*For any* task `T` in the task list, calling `TaskModule.editTask(T.id, T.description, ...)` (saving the same description unchanged) should succeed — `T.description` should remain the same and no validation message should be shown.

**Validates: Requirements 4.8**

---

### Property 13: Sort Order Correctness

*For any* non-empty task list and *for any* sort order (`"creation"`, `"alpha"`, `"status"`), `TaskModule.getSortedTasks()` should return all tasks (same count, no tasks added or removed) in the correct order for that sort mode:
- `"creation"`: same order as the underlying `tasks` array.
- `"alpha"`: ascending case-insensitive lexicographic order by description.
- `"status"`: all incomplete tasks before all complete tasks, each sub-group in creation order.

**Validates: Requirements 5.2, 5.6, 5.7**

---

### Property 14: Sort Persistence Round-Trip

*For any* valid sort order value stored in `tld_sort` in localStorage, calling `TaskModule.loadSort()` should return that exact value, and the task list rendered after `init()` should be in that sort order.

**Validates: Requirements 5.3, 5.4**

---

### Property 15: Invalid Preference Values Fall Back to Defaults

*For any* invalid value stored under any of the four preference keys (`tld_theme`, `tld_username`, `tld_duration`, `tld_sort`), the corresponding load function should return the default value for that preference and should not throw an error.

**Validates: Requirements 6.4, 1.9, 3.5, 5.5**

---

## Error Handling

### localStorage Unavailability

The existing `Storage.save()` and `Storage.load()` utilities already wrap all localStorage operations in `try/catch`. All new preference writes go through `Storage.save(key, value)` and all reads go through `Storage.load(key)`. No new error-handling infrastructure is needed.

On a failed write, `Storage.save()` calls `Notify.error(...)` and returns `false`. The calling module retains the in-memory value and continues operating normally for the current session.

On a failed read, `Storage.load()` returns `null`. Each module's load function treats `null` as "no saved value" and applies the default.

### Input Validation Errors

All user-facing validation errors are displayed as inline messages in dedicated `role="alert"` spans adjacent to the relevant input. This ensures screen readers announce the error without requiring focus to move. Toast notifications are reserved for storage failures only.

### Validation Message Lifecycle

| Trigger | Message appears | Message clears |
|---------|----------------|----------------|
| Duplicate add attempt | `#task-validation` | User types in `#task-input` |
| Duplicate edit attempt | `.task-inline-msg` in edit row | User types in edit input |
| Invalid name length | `#name-validation` | User modifies name input |
| Invalid duration | `#duration-validation` | User modifies duration input |

### Theme Flash Prevention

`ThemeModule.init()` is called as the **first** statement inside `DOMContentLoaded`. Because `app.js` is loaded with `defer`, the DOM is ready but no layout has been painted yet. Applying `data-theme` before any module renders ensures the correct CSS custom properties are active on the first paint.

---

## Testing Strategy

### Dual Testing Approach

Testing uses two complementary layers:

1. **Unit / example-based tests** — verify specific scenarios, edge cases, and error conditions with concrete inputs.
2. **Property-based tests** — verify universal properties across many generated inputs using a PBT library.

### Property-Based Testing Library

For vanilla JavaScript, **[fast-check](https://github.com/dubzzz/fast-check)** is the recommended PBT library. It runs in Node.js (via a test runner such as Vitest or Jest) and requires no build tooling beyond a `package.json` devDependency.

Each property test must:
- Run a **minimum of 100 iterations** (fast-check default is 100; increase with `{ numRuns: 200 }` for critical properties).
- Include a comment tag in the format: `// Feature: todo-dashboard-challenge-features, Property N: <property text>`

### Property Test Mapping

| Property | Test description | fast-check arbitraries |
|----------|-----------------|----------------------|
| P1 — Theme toggle involution | Toggle twice returns to original | `fc.constantFrom('dark', 'light')` |
| P2 — Theme persistence round-trip | load(save(theme)) === theme | `fc.constantFrom('dark', 'light')` |
| P3 — Toggle label reflects theme | Label text matches active theme | `fc.constantFrom('dark', 'light')` |
| P4 — Greeting format with valid name | Greeting includes name in correct format | `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)` |
| P5 — Name persistence round-trip | loadName(saveName(name)) === name | same as P4 |
| P6 — Name length validation | Names > 50 chars are rejected | `fc.string({ minLength: 51, maxLength: 200 })` |
| P7 — Duration accepts valid values | applyDuration(d) sets remaining = d*60 | `fc.integer({ min: 1, max: 99 })` |
| P8 — Duration persistence round-trip | loadDuration(saveDuration(d)) === d | `fc.integer({ min: 1, max: 99 })` |
| P9 — Duration rejects invalid values | Invalid inputs leave remaining unchanged | `fc.oneof(fc.string(), fc.float().filter(n => !Number.isInteger(n)), fc.constant(''), fc.integer({ min: 100, max: 9999 }), fc.integer({ min: -9999, max: 0 }))` |
| P10 — Duplicate add rejection | Adding duplicate leaves list unchanged | `fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1 })` |
| P11 — Duplicate edit rejection | Editing to duplicate leaves task unchanged | `fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2 })` |
| P12 — Self-edit is not duplicate | Saving same description succeeds | `fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)` |
| P13 — Sort order correctness | getSortedTasks() returns correct order | `fc.array(taskArbitrary, { minLength: 1 })` × `fc.constantFrom('creation', 'alpha', 'status')` |
| P14 — Sort persistence round-trip | loadSort(saveSort(order)) === order | `fc.constantFrom('creation', 'alpha', 'status')` |
| P15 — Invalid preferences fall back | Invalid values return defaults | `fc.record({ theme: fc.string(), duration: fc.oneof(fc.string(), fc.float()), sort: fc.string(), username: fc.anything() })` |

### Unit / Example Tests

In addition to property tests, the following specific scenarios should be covered by example-based unit tests:

- **Theme**: default to `"dark"` when localStorage is empty; toggle button is present in DOM with correct `aria-label`.
- **Name**: greeting without name suffix when no name is saved; greeting reverts when name is cleared; focus moves to name input when editor opens.
- **Duration**: timer defaults to 25:00 on first load; running timer stops when new duration is confirmed; duration input remains visible while timer is counting down.
- **Duplicate tasks**: input field retains text after duplicate rejection; validation message clears on next keystroke; edit-mode message clears on next keystroke.
- **Sort**: sort control renders with three options; active sort option has `sort-btn--active` class; list defaults to creation order when localStorage is empty or contains an invalid sort value.

### Accessibility Smoke Tests

The following should be verified manually or with an automated accessibility checker (e.g., axe-core):

- All new controls are reachable and operable via keyboard alone (Tab, Enter, Space, Escape).
- All new `role="alert"` spans are announced by screen readers when their content changes.
- Both light and dark themes pass WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text).
- No new uncaught JavaScript errors appear in the browser console in Chrome, Firefox, Edge, and Safari.
