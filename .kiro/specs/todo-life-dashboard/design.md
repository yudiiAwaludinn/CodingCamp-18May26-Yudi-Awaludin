# Design Document: Todo-Life Dashboard

## Overview

The Todo-Life Dashboard is a single-page, client-side web application built with plain HTML, CSS, and vanilla JavaScript. It provides four integrated productivity components — a contextual greeting with live clock, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access link panel — all persisted via the browser's `localStorage` API with no backend required.

The application is delivered as three static files:

```
index.html        ← single HTML page, all markup
css/styles.css    ← all visual styles
js/app.js         ← all interactive behavior
```

No build tools, no frameworks, no external dependencies. The app runs directly in any modern browser by opening `index.html`.

### Design Goals

- **Zero dependencies**: no npm, no bundler, no CDN imports — fully self-contained.
- **Offline-first**: works without a network connection after initial file load.
- **Resilient persistence**: graceful degradation when `localStorage` is unavailable or full.
- **Accessible**: WCAG 2.1 AA contrast ratios, keyboard-navigable controls.
- **Responsive**: usable from 320 px to 1920 px viewport width.

---

## Architecture

The application follows a simple **module-per-component** pattern inside a single `js/app.js` file. Each component owns its own state, DOM references, and event handlers. A shared `Storage` utility wraps `localStorage` with error handling. A shared `Notify` utility handles user-visible error/info notifications.

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                        │
│  ┌──────────────┐  ┌──────────┐  ┌────────┐  ┌───────┐ │
│  │GreetingPanel │  │  Timer   │  │TaskList│  │Links  │ │
│  └──────┬───────┘  └────┬─────┘  └───┬────┘  └───┬───┘ │
│         │               │             │            │     │
│  ┌──────▼───────────────▼─────────────▼────────────▼───┐│
│  │                    js/app.js                         ││
│  │  GreetingModule | TimerModule | TaskModule | LinkMod ││
│  │                  Storage | Notify utilities          ││
│  └──────────────────────────────────────────────────────┘│
│                      css/styles.css                      │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

1. On `DOMContentLoaded`, each module initialises: reads its slice of `localStorage`, renders its initial DOM state, and attaches event listeners.
2. User interactions trigger module-local handler functions that update in-memory state, re-render the relevant DOM subtree, and call `Storage.save(key, data)`.
3. `Storage.save` serialises to JSON and writes to `localStorage`. On failure it calls `Notify.error(message)`.
4. The `GreetingModule` uses `setInterval` (60 s) to keep the clock and greeting current.
5. The `TimerModule` uses `setInterval` (1 s) while counting down; it clears the interval on stop/reset/completion.

### Module Boundaries

| Module | Responsibility | localStorage key |
|---|---|---|
| `GreetingModule` | Clock, date, contextual greeting | — (no persistence) |
| `TimerModule` | 25-min countdown, controls | — (no persistence) |
| `TaskModule` | Task CRUD, completion toggle | `tld_tasks` |
| `LinkModule` | Quick-link CRUD, navigation | `tld_links` |
| `Storage` | JSON serialise/deserialise, error wrapping | — |
| `Notify` | Toast/banner notifications | — |

---

## Components and Interfaces

### GreetingModule

**DOM targets** (IDs defined in `index.html`):
- `#greeting-text` — greeting string ("Good Morning", etc.)
- `#clock-time` — HH:MM display
- `#clock-date` — full date string

**Public interface:**
```js
GreetingModule.init()   // called once on DOMContentLoaded
```

**Internal logic:**
- `getGreeting(hour)` → string — pure function mapping hour (0–23) to greeting text.
- `formatTime(date)` → "HH:MM" string.
- `formatDate(date)` → "Weekday, DD Month YYYY" string.
- `render()` — updates the three DOM targets; wraps `new Date()` in try/catch; falls back to `"--:--"` on error.
- `setInterval(render, 60_000)` started in `init()`.

---

### TimerModule

**DOM targets:**
- `#timer-display` — MM:SS countdown
- `#timer-start`, `#timer-stop`, `#timer-reset` — control buttons
- `#timer-indicator` — end-of-session indicator (hidden until 00:00)

**Public interface:**
```js
TimerModule.init()
```

**Internal state:**
```js
{ remaining: 1500, running: false, intervalId: null }
```

**Internal logic:**
- `tick()` — decrements `remaining`; calls `render()`; if `remaining === 0` calls `onComplete()`.
- `onComplete()` — clears interval, shows `#timer-indicator`, plays `AudioContext` beep.
- `render()` — formats `remaining` as MM:SS, updates `#timer-display`, sets `disabled` on buttons per state.
- `start()`, `stop()`, `reset()` — mutate state, manage interval, call `render()`.

**Audio alert:** Uses the Web Audio API (`AudioContext`) to generate a short beep tone — no external audio file required.

---

### TaskModule

**DOM targets:**
- `#task-input` — new task text field
- `#task-add-btn` — Add button
- `#task-validation` — inline validation message area
- `#task-list` — `<ul>` container for task items
- `#task-empty` — empty-state message element

**Public interface:**
```js
TaskModule.init()
```

**Internal state:**
```js
tasks: Array<{ id: string, description: string, completed: boolean }>
```

`id` is a `Date.now() + Math.random()` string generated at creation time — used as a stable DOM key.

**Internal logic:**
- `loadTasks()` — reads `tld_tasks` from `Storage.load()`; falls back to `[]` on error.
- `saveTasks()` — calls `Storage.save('tld_tasks', tasks)`.
- `renderList()` — clears `#task-list`, re-renders all tasks; shows/hides `#task-empty`.
- `renderTask(task)` — returns a `<li>` element with checkbox, description span, Edit button, Delete button.
- `addTask(description)` — validates, pushes to `tasks`, calls `saveTasks()`, calls `renderList()`.
- `editTask(id, newDescription)` — validates, mutates task, calls `saveTasks()`, calls `renderList()`.
- `toggleTask(id)` — flips `completed`, calls `saveTasks()`, updates DOM in place.
- `deleteTask(id)` — splices from `tasks`, calls `saveTasks()`, calls `renderList()`.
- `validateDescription(str)` → `{ valid: boolean, message: string }`.

**Edit mode:** When Edit is clicked, `renderTask` is called in edit mode — the description span is replaced with an `<input>` pre-filled with the current description, and Save/Cancel buttons replace Edit/Delete. Escape key triggers cancel.

---

### LinkModule

**DOM targets:**
- `#link-label-input`, `#link-url-input` — add-form fields
- `#link-add-btn` — Add button
- `#link-validation` — inline validation message area
- `#link-list` — container for Quick_Link buttons

**Public interface:**
```js
LinkModule.init()
```

**Internal state:**
```js
links: Array<{ id: string, label: string, url: string }>
```

**Internal logic:**
- `loadLinks()` / `saveLinks()` — same pattern as TaskModule.
- `renderLinks()` — clears `#link-list`, re-renders all links.
- `renderLink(link)` — returns a wrapper `<div>` with a `<button>` (opens URL) and a Delete `<button>`.
- `addLink(label, url)` — validates label (non-empty, ≤100 chars) and URL (non-empty, http/https scheme, ≤2048 chars), pushes to `links`, saves, renders.
- `deleteLink(id)` — splices from `links`, saves, renders.
- `validateUrl(str)` → `{ valid: boolean, message: string }` — uses `new URL(str)` inside try/catch; checks `protocol` is `http:` or `https:`.
- `openLink(url)` — validates URL at activation time; calls `window.open(url, '_blank')` or shows inline error.

---

### Storage Utility

```js
const Storage = {
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      Notify.error('Could not save data. Storage may be full or unavailable.');
      return false;
    }
  },
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
};
```

---

### Notify Utility

Displays a dismissible toast notification at the top of the viewport.

```js
const Notify = {
  error(message) { /* creates/shows a toast with role="alert" */ },
  info(message)  { /* creates/shows a toast with role="status" */ }
};
```

Toasts auto-dismiss after 4 seconds and are keyboard-dismissible.

---

## Data Models

### Task

Stored in `localStorage` under key `tld_tasks` as a JSON array.

```json
[
  {
    "id": "1716000000000_0.123456",
    "description": "Buy groceries",
    "completed": false
  },
  {
    "id": "1716000001000_0.654321",
    "description": "Read chapter 3",
    "completed": true
  }
]
```

| Field | Type | Constraints |
|---|---|---|
| `id` | string | Unique, generated at creation, never mutated |
| `description` | string | 1–500 characters, non-whitespace-only |
| `completed` | boolean | `true` = done, `false` = pending |

**Serialisation contract:** `JSON.stringify` → `localStorage.setItem` → `localStorage.getItem` → `JSON.parse` produces an array with byte-for-byte identical `description` strings and identical `completed` booleans.

---

### Quick_Link

Stored in `localStorage` under key `tld_links` as a JSON array.

```json
[
  {
    "id": "1716000002000_0.111222",
    "label": "GitHub",
    "url": "https://github.com"
  },
  {
    "id": "1716000003000_0.333444",
    "label": "MDN Docs",
    "url": "https://developer.mozilla.org"
  }
]
```

| Field | Type | Constraints |
|---|---|---|
| `id` | string | Unique, generated at creation, never mutated |
| `label` | string | 1–100 characters |
| `url` | string | 1–2048 characters, must start with `http://` or `https://` |

**Serialisation contract:** Round-trip through `JSON.stringify`/`JSON.parse` produces byte-for-byte identical `label` and `url` strings.

---

### localStorage Key Registry

| Key | Owner | Value type |
|---|---|---|
| `tld_tasks` | TaskModule | `Task[]` JSON array |
| `tld_links` | LinkModule | `Quick_Link[]` JSON array |


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties are derived from the acceptance criteria. Each is universally quantified and suitable for property-based testing using a library such as [fast-check](https://github.com/dubzzz/fast-check) (JavaScript).

---

### Property 1: Time format is always valid HH:MM

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM` where HH is a zero-padded hour in [00–23] and MM is a zero-padded minute in [00–59].

**Validates: Requirements 1.1**

---

### Property 2: Date format always contains all required components

*For any* `Date` object, `formatDate(date)` SHALL return a string that contains a recognisable weekday name, a numeric day, a month name, and a four-digit year.

**Validates: Requirements 1.2**

---

### Property 3: Greeting is correct for every hour of the day

*For any* integer hour in [0–23], `getGreeting(hour)` SHALL return exactly:
- `"Good Morning"` when hour ∈ [5, 11]
- `"Good Afternoon"` when hour ∈ [12, 17]
- `"Good Evening"` when hour ∈ [18, 21]
- `"Good Night"` when hour ∈ [22, 23] or hour ∈ [0, 4]

No hour value in [0–23] shall produce any other string.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

---

### Property 4: Timer display is always valid MM:SS

*For any* integer `seconds` in [0, 1500], `formatTimer(seconds)` SHALL return a string matching the pattern `MM:SS` where MM is a zero-padded value in [00–25] and SS is a zero-padded value in [00–59].

**Validates: Requirements 3.3**

---

### Property 5: Timer button states are consistent with timer state

*For any* timer state (one of: `idle`, `running`, `paused`, `completed`), the enabled/disabled state of the Start, Stop, and Reset buttons SHALL satisfy:
- `idle`: Start enabled, Stop disabled, Reset enabled
- `running`: Start disabled, Stop enabled, Reset enabled
- `paused`: Start enabled, Stop disabled, Reset enabled
- `completed`: Start enabled, Stop disabled, Reset enabled

**Validates: Requirements 4.5, 4.6, 4.7**

---

### Property 6: Adding a valid task always grows the task list by exactly one

*For any* task list of length N and any valid task description (non-empty, non-whitespace-only, ≤500 characters), calling `addTask(description)` SHALL result in a task list of length N+1 with the new task appearing as the last element.

**Validates: Requirements 5.2**

---

### Property 7: Whitespace-only descriptions are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines, or any combination), `validateDescription(str)` SHALL return `{ valid: false }` and the task list SHALL remain unchanged.

This property covers both task creation (Requirement 5.4) and task editing (Requirement 6.5).

**Validates: Requirements 5.4, 6.5**

---

### Property 8: Editing a task with a valid description always updates it

*For any* existing task and any valid new description (non-empty, non-whitespace-only, ≤500 characters), calling `editTask(id, newDescription)` SHALL result in that task's `description` field being exactly equal to `newDescription`.

**Validates: Requirements 6.3**

---

### Property 9: Task completion toggle is a round-trip

*For any* task with any initial `completed` state, toggling the completion state twice SHALL restore the task to its original `completed` value. Formally: `toggle(toggle(task)).completed === task.completed`.

**Validates: Requirements 7.2, 7.3**

---

### Property 10: Task completion state is faithfully reflected in the rendered DOM

*For any* task with `completed: true`, the rendered list item SHALL have strikethrough styling applied to the description text. *For any* task with `completed: false`, the rendered list item SHALL NOT have strikethrough styling.

**Validates: Requirements 7.1**

---

### Property 11: Deleting a task always removes it from the list

*For any* task list containing a task with a given `id`, calling `deleteTask(id)` SHALL result in a task list that contains no task with that `id`, and the list length SHALL decrease by exactly one.

**Validates: Requirements 8.2**

---

### Property 12: Task serialization is a lossless round-trip

*For any* array of task objects (each with a `description` string and a `completed` boolean), calling `Storage.save('tld_tasks', tasks)` followed by `Storage.load('tld_tasks')` SHALL produce an array where every `description` is byte-for-byte identical to the original and every `completed` value is the identical boolean.

**Validates: Requirements 9.3**

---

### Property 13: Loading tasks renders every saved task

*For any* valid JSON array of tasks stored in `localStorage` under `tld_tasks`, calling `loadTasks()` SHALL render exactly that many task items in the DOM, with each task's description and completion state matching the stored values.

**Validates: Requirements 9.1**

---

### Property 14: Adding a valid link always grows the link list by exactly one

*For any* link list of length N and any valid (label, url) pair (non-empty label ≤100 chars, URL with http:// or https:// scheme ≤2048 chars), calling `addLink(label, url)` SHALL result in a link list of length N+1.

**Validates: Requirements 10.2**

---

### Property 15: Non-http/https URLs are always rejected

*For any* URL string whose scheme is not `http:` or `https:` (e.g., `ftp://`, `javascript:`, `data:`, bare strings), `validateUrl(str)` SHALL return `{ valid: false }`.

**Validates: Requirements 10.7**

---

### Property 16: Empty label or empty URL is always rejected

*For any* submission where the label is empty/whitespace-only OR the URL is empty/whitespace-only, `validateLink(label, url)` SHALL return `{ valid: false }` and the link list SHALL remain unchanged.

**Validates: Requirements 10.4**

---

### Property 17: Deleting a link always removes it from the list

*For any* link list containing a link with a given `id`, calling `deleteLink(id)` SHALL result in a link list that contains no link with that `id`, and the list length SHALL decrease by exactly one.

**Validates: Requirements 10.6**

---

### Property 18: Quick_Link display text falls back to URL when label is empty

*For any* Quick_Link where `label` is a non-empty string, the rendered button text SHALL equal `label`. *For any* Quick_Link where `label` is an empty string, the rendered button text SHALL equal `url`.

**Validates: Requirements 11.2**

---

### Property 19: Link serialization is a lossless round-trip

*For any* array of Quick_Link objects (each with a `label` string and a `url` string), calling `Storage.save('tld_links', links)` followed by `Storage.load('tld_links')` SHALL produce an array where every `label` and every `url` is byte-for-byte identical to the original.

**Validates: Requirements 12.2, 12.3**

---

### Property 20: Loading links renders every saved link

*For any* valid JSON array of Quick_Links stored in `localStorage` under `tld_links`, calling `loadLinks()` SHALL render exactly that many link buttons in the DOM, with each button's display text matching the stored label (or URL if label is empty).

**Validates: Requirements 12.1**

---

## Error Handling

### localStorage Unavailability

`localStorage` may be unavailable (private browsing mode, storage quota exceeded, browser policy). The `Storage` utility wraps all reads and writes in `try/catch`:

- **Read failure**: returns `null`; the calling module initialises with an empty state.
- **Write failure**: returns `false`; the calling module calls `Notify.error(...)` and continues operating with in-memory state only (degraded non-persistent mode).

No uncaught errors shall propagate from storage operations.

### Corrupt localStorage Data

If `localStorage.getItem` returns a non-null value that cannot be parsed as a valid JSON array, `Storage.load` returns `null`. The calling module treats `null` as "no data" and initialises with an empty state.

### System Clock Unavailability

`GreetingModule.render()` wraps `new Date()` in a `try/catch`. On failure, the clock display shows `"--:--"` and the date display shows `"--"`. The greeting defaults to an empty string or is omitted.

### Invalid URL at Activation

`LinkModule.openLink(url)` re-validates the URL at click time using `validateUrl`. If validation fails, it shows an inline error message adjacent to the link button and does not call `window.open`. This guards against data that may have been corrupted in storage after initial save.

### Inline Validation Messages

All inline validation messages are rendered as `<span>` elements with `role="alert"` so screen readers announce them immediately. They are cleared when the user modifies the relevant input field.

### Error Notification (Toast)

The `Notify` utility renders a `<div role="alert">` toast at the top of the viewport. Toasts:
- Auto-dismiss after 4 seconds.
- Are keyboard-dismissible (Escape key or a visible close button).
- Stack if multiple errors occur simultaneously.
- Do not block user interaction with the rest of the page.

---

## Testing Strategy

> **Note:** Per project constraints, no test files, test frameworks, or test configuration are included in the deliverable. The testing strategy below describes how the correctness properties and acceptance criteria *should* be verified if tests were to be written, and serves as a specification for manual verification and future automated testing.

### Recommended Property-Based Testing Library

**[fast-check](https://github.com/dubzzz/fast-check)** — a mature, well-maintained property-based testing library for JavaScript/TypeScript. It integrates with Jest, Vitest, Mocha, and other test runners.

### Dual Testing Approach

**Unit tests** (example-based) cover:
- Specific initial states (timer initialises at 25:00)
- Error handling paths (localStorage failure, corrupt data, clock unavailable)
- UI structural checks (required DOM elements exist)
- Specific state transitions (start → running, complete → re-enable Start)

**Property tests** cover the 20 correctness properties defined above. Each property test should run a minimum of **100 iterations** with randomly generated inputs.

### Property Test Tag Format

Each property test should be tagged with a comment referencing the design property:

```js
// Feature: todo-life-dashboard, Property 3: Greeting is correct for every hour of the day
fc.assert(fc.property(fc.integer({ min: 0, max: 23 }), (hour) => {
  // ...
}));
```

### Pure Functions to Test as Properties

The following functions are pure (no side effects) and directly testable:

| Function | Property | Inputs |
|---|---|---|
| `getGreeting(hour)` | Property 3 | `fc.integer({ min: 0, max: 23 })` |
| `formatTime(date)` | Property 1 | `fc.date()` |
| `formatDate(date)` | Property 2 | `fc.date()` |
| `formatTimer(seconds)` | Property 4 | `fc.integer({ min: 0, max: 1500 })` |
| `validateDescription(str)` | Property 7 | `fc.string()` filtered to whitespace-only |
| `validateUrl(str)` | Property 15, 16 | `fc.webUrl()`, `fc.string()` |

### State-Dependent Properties

Properties 5–20 involve state mutations. These should be tested by:
1. Setting up an initial state (empty or randomly populated).
2. Performing the operation under test.
3. Asserting the post-condition.

For persistence properties (12, 19), mock `localStorage` with an in-memory implementation to avoid browser dependency.

### Manual Verification Checklist

For requirements not covered by automated tests:

- [ ] Page renders within 2 seconds on a ≥10 Mbps connection (Req 14.2)
- [ ] DOM updates within 100ms of user interaction (Req 14.3)
- [ ] No layout breakage in Chrome, Firefox, Edge, Safari (Req 14.1)
- [ ] No horizontal scrolling at 320px viewport (Req 13.5)
- [ ] WCAG 2.1 AA contrast ratios verified with a contrast checker (Req 13.4)
- [ ] Keyboard navigation works for all controls (Req 11.1)
- [ ] Screen reader announces validation messages (inline `role="alert"`)
- [ ] Timer audio alert audible (Req 3.4)
- [ ] Greeting updates within 60 seconds of crossing a period boundary (Req 2.6)
