# Implementation Plan: Todo-Dashboard Challenge Features

## Overview

Implement five challenge features — Light/Dark Theme Toggle, Custom User Name in Greeting, Custom Pomodoro Timer Duration, Prevent Duplicate Tasks, and Sort Tasks — plus full localStorage persistence for all new preferences. All changes are confined to the three existing files: `index.html`, `css/styles.css`, and `js/app.js`. Property-based tests use **fast-check** via Vitest (devDependency only; the app itself remains dependency-free).

---

## Tasks

- [ ] 1. Set up test infrastructure and add HTML scaffolding for all new controls
  - [x] 1.1 Add all new HTML elements to `index.html`
    - Add `<button id="theme-toggle">` before the first `<section>` in `<body>`
    - Add `<button id="name-edit-btn">` and `<div id="name-editor" hidden>` (with `#name-input`, `#name-save-btn`, `#name-cancel-btn`, `#name-validation`) inside `#greeting-panel` after `#clock-date`
    - Add `<div id="duration-form">` (with `<label>`, `#duration-input`, `#duration-set-btn`, `#duration-validation`) inside `#timer-panel` after `#timer-controls`
    - Add `<div id="sort-controls" role="group">` with three `<button class="sort-btn">` elements (`data-sort="creation"`, `data-sort="alpha"`, `data-sort="status"`) inside `#task-panel` between `#task-form` and `#task-list`
    - _Requirements: 1.1, 2.1, 3.1, 5.1, 7.1_

  - [ ] 1.2 Install fast-check and Vitest as devDependencies and create `package.json`
    - Run `npm init -y` and `npm install --save-dev vitest@2.x fast-check@3.x`
    - Add `"test": "vitest --run"` script to `package.json`
    - Create `tests/challenge-features.test.js` with a placeholder smoke test
    - _Requirements: 7.2_

- [x] 2. Implement ThemeModule in `js/app.js`
  - [-] 2.1 Write `ThemeModule` with `load`, `apply`, `save`, `toggle`, and `init` methods
    - `load()`: reads `tld_theme` via `Storage.load`; validates with `validateTheme(v)`; returns `'dark'` for missing/invalid values; never throws
    - `apply(theme)`: calls `document.documentElement.setAttribute('data-theme', theme)`; updates `#theme-toggle` `aria-label` and text content to reflect the active theme and the action to switch it
    - `save()`: calls `Storage.save('tld_theme', this.current)`
    - `toggle()`: flips `this.current`, calls `apply` then `save`
    - `init()`: calls `load → apply` first (before any other module), then attaches `click` listener to `#theme-toggle`
    - Call `ThemeModule.init()` as the **first** statement inside `DOMContentLoaded` to prevent FOUC
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.2 Write property test — Property 1: Theme Toggle is an Involution
    - **Property 1: Theme Toggle is an Involution**
    - For any starting theme, toggling twice must restore the original value
    - Use `fc.constantFrom('dark', 'light')`
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test — Property 2: Theme Persistence Round-Trip
    - **Property 2: Theme Persistence Round-Trip**
    - `ThemeModule.load()` after `ThemeModule.save()` must return the same theme value
    - Use `fc.constantFrom('dark', 'light')`
    - **Validates: Requirements 1.4, 1.6**

  - [ ]* 2.4 Write property test — Property 3: Theme Toggle Label Reflects Active Theme
    - **Property 3: Theme Toggle Label Reflects Active Theme**
    - After `ThemeModule.apply(theme)`, the toggle's `aria-label` must reference switching to the *opposite* theme
    - Use `fc.constantFrom('dark', 'light')`
    - **Validates: Requirements 1.8**

- [x] 3. Add light-theme CSS overrides to `css/styles.css`
  - [x] 3.1 Add `[data-theme="light"]` CSS custom property overrides and `#theme-toggle` styles
    - Define `[data-theme="light"] { --color-bg: ...; --color-surface: ...; ... }` overrides that meet WCAG 2.1 AA (4.5:1 normal text, 3:1 large text) in the light theme
    - Add `transition: background-color 200ms ease, color 200ms ease` to `body` and all panel selectors so theme changes animate within 200 ms
    - Style `#theme-toggle` as a fixed/absolute top-right button; include `:focus-visible` outline
    - _Requirements: 1.3, 1.7, 7.3_

- [x] 4. Checkpoint — Theme feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Extend `GreetingModule` with `NameEditor` in `js/app.js`
  - [x] 5.1 Add `userName`, `loadName`, `saveName`, `openEditor`, and `closeEditor` to `GreetingModule`
    - `loadName()`: reads `tld_username` via `Storage.load`; validates with `validateUsername(v)`; returns `''` for missing/invalid
    - `saveName(name)`: trims input; if `name.trim().length > 50` sets `#name-validation` text and returns; if empty/whitespace clears `tld_username` from localStorage and sets `this.userName = ''`; otherwise writes `tld_username` and sets `this.userName`; calls `this.render()`
    - `openEditor()`: removes `hidden` from `#name-editor`; pre-fills `#name-input` with `this.userName`; moves focus to `#name-input`
    - `closeEditor()`: adds `hidden` to `#name-editor`; clears `#name-validation`
    - Update `GreetingModule.render()` to append `, [userName]!` suffix when `this.userName` is non-empty
    - Update `GreetingModule.init()` to call `this.loadName()` before first render; attach listeners to `#name-edit-btn`, `#name-save-btn`, `#name-cancel-btn`; attach `input` listener on `#name-input` to clear `#name-validation`; handle Enter/Escape keys in `#name-input`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 5.2 Write property test — Property 4: Greeting Format with Valid Name
    - **Property 4: Greeting Format with Valid Name**
    - For any valid name (1–50 non-whitespace chars), after `saveName(name)` the greeting text must match `"[Greeting], [name]!"`
    - Use `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)`
    - **Validates: Requirements 2.2**

  - [ ]* 5.3 Write property test — Property 5: Name Persistence Round-Trip
    - **Property 5: Name Persistence Round-Trip**
    - `loadName()` after `saveName(name)` must return the trimmed name
    - Use `fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0)`
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 5.4 Write property test — Property 6: Name Length Validation
    - **Property 6: Name Length Validation**
    - Any name longer than 50 characters must be rejected — `this.userName` and `tld_username` must remain unchanged
    - Use `fc.string({ minLength: 51, maxLength: 200 })`
    - **Validates: Requirements 2.7**

- [x] 6. Extend `TimerModule` with `DurationInput` in `js/app.js`
  - [x] 6.1 Add `sessionMinutes`, `loadDuration`, `saveDuration`, `setDuration`, and `applyDuration` to `TimerModule`
    - `loadDuration()`: reads `tld_duration` via `Storage.load`; validates with `validateDuration(v)`; returns `25` for missing/invalid
    - `saveDuration(minutes)`: calls `Storage.save('tld_duration', minutes)`
    - `setDuration(minutes)`: calls `this.stop()`; sets `this.sessionMinutes = minutes` and `this.remaining = minutes * 60`; calls `this.render()`
    - `applyDuration(raw)`: parses `raw` with `Number(raw)`; rejects if not `Number.isInteger(n) || n < 1 || n > 99` by setting `#duration-validation` text and returning; on valid input clears `#duration-validation`, calls `setDuration(n)` and `saveDuration(n)`
    - Update `TimerModule.reset()` to use `this.sessionMinutes * 60` instead of the hard-coded `1500`
    - Update `TimerModule.init()` to call `this.loadDuration()` before first render; attach listener to `#duration-set-btn`; attach `input` listener on `#duration-input` to clear `#duration-validation`; handle Enter key in `#duration-input`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 6.2 Write property test — Property 7: Duration Input Accepts All Valid Values
    - **Property 7: Duration Input Accepts All Valid Values**
    - For any integer `d` in [1, 99], `applyDuration(String(d))` must set `remaining = d * 60` and display `formatTimer(d * 60)`
    - Use `fc.integer({ min: 1, max: 99 })`
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.3 Write property test — Property 8: Duration Persistence Round-Trip
    - **Property 8: Duration Persistence Round-Trip**
    - `loadDuration()` after `saveDuration(d)` must return `d`
    - Use `fc.integer({ min: 1, max: 99 })`
    - **Validates: Requirements 3.3, 3.4**

  - [ ]* 6.4 Write property test — Property 9: Duration Input Rejects All Invalid Values
    - **Property 9: Duration Input Rejects All Invalid Values**
    - Any non-integer, decimal, empty, or out-of-range value must be rejected — `remaining` must be unchanged and `#duration-validation` must be non-empty
    - Use `fc.oneof(fc.string(), fc.float().filter(n => !Number.isInteger(n)), fc.constant(''), fc.integer({ min: 100, max: 9999 }), fc.integer({ min: -9999, max: 0 }))`
    - **Validates: Requirements 3.6, 3.7**

- [ ] 7. Checkpoint — Timer duration feature complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Add duplicate-task prevention to `TaskModule` in `js/app.js`
  - [x] 8.1 Add `isDuplicate` helper and update `addTask` and `editTask` in `TaskModule`
    - Add `isDuplicate(description, excludeId)`: returns `true` if any task (other than `excludeId`) has `task.description.trim().toLowerCase() === description.trim().toLowerCase()`
    - Update `addTask(description)`: after existing `validateDescription` check, call `this.isDuplicate(description, null)`; if true set `#task-validation` text to `'A task with that description already exists.'` and return without clearing the input field
    - Update `editTask(id, newDescription, inlineMsgEl)`: after existing `validateDescription` check, call `this.isDuplicate(newDescription, id)`; if true set `inlineMsgEl.textContent` and return without modifying the task
    - Add `input` event listener on the edit input inside `renderTask()` to clear `inlineMsg.textContent` on any keystroke (requirement 4.7)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 8.2 Write property test — Property 10: Duplicate Task Rejection (Add)
    - **Property 10: Duplicate Task Rejection (Add)**
    - For any non-empty task list, adding a case-insensitive trimmed match of any existing description must leave `TaskModule.tasks` unchanged (same length and contents)
    - Use `fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1 })`
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 8.3 Write property test — Property 11: Duplicate Task Rejection (Edit)
    - **Property 11: Duplicate Task Rejection (Edit)**
    - For any list with ≥ 2 tasks, editing task T to match another task's description must leave `T.description` unchanged
    - Use `fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 2 })`
    - **Validates: Requirements 4.5, 4.6**

  - [ ]* 8.4 Write property test — Property 12: Self-Edit is Not a Duplicate
    - **Property 12: Self-Edit is Not a Duplicate**
    - Saving a task with its own unchanged description must succeed — no validation message, description unchanged
    - Use `fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)`
    - **Validates: Requirements 4.8**

- [x] 9. Add sort controls to `TaskModule` in `js/app.js`
  - [x] 9.1 Add `sortOrder`, `loadSort`, `saveSort`, `getSortedTasks`, and `updateSortUI` to `TaskModule`; update `renderList`
    - `loadSort()`: reads `tld_sort` via `Storage.load`; validates with `validateSort(v)`; returns `'creation'` for missing/invalid/unreadable values; never throws
    - `saveSort(order)`: calls `Storage.save('tld_sort', order)`
    - `getSortedTasks()`: returns a sorted copy of `this.tasks` — `'creation'`: `[...this.tasks]`; `'alpha'`: sort by `description.toLowerCase()` using `localeCompare`; `'status'`: incomplete tasks first (creation order within group), then complete tasks (creation order within group)
    - `updateSortUI()`: iterates `.sort-btn` elements; adds `sort-btn--active` to the button whose `data-sort` matches `this.sortOrder`; removes it from all others
    - Update `renderList()` to call `this.getSortedTasks()` instead of `this.tasks` directly
    - Update `TaskModule.init()` to call `this.loadSort()` before first render; attach `click` listeners to each `.sort-btn` that set `this.sortOrder`, call `saveSort`, `renderList`, and `updateSortUI`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.2 Write property test — Property 13: Sort Order Correctness
    - **Property 13: Sort Order Correctness**
    - For any non-empty task list and any sort order, `getSortedTasks()` must return all tasks (same count, no additions/removals) in the correct order for that mode
    - Use `fc.array(taskArbitrary, { minLength: 1 })` × `fc.constantFrom('creation', 'alpha', 'status')`
    - **Validates: Requirements 5.2, 5.6, 5.7**

  - [ ]* 9.3 Write property test — Property 14: Sort Persistence Round-Trip
    - **Property 14: Sort Persistence Round-Trip**
    - `loadSort()` after `saveSort(order)` must return the same order value
    - Use `fc.constantFrom('creation', 'alpha', 'status')`
    - **Validates: Requirements 5.3, 5.4**

- [ ] 10. Checkpoint — Duplicate prevention and sort features complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Add preference validation helpers and wire all persistence in `js/app.js`
  - [x] 11.1 Add `validateTheme`, `validateUsername`, `validateDuration`, and `validateSort` pure functions
    - `validateTheme(v)`: returns `v` if `v === 'dark' || v === 'light'`; otherwise returns `'dark'`
    - `validateUsername(v)`: returns `''` if `typeof v !== 'string'`; trims `v`; returns trimmed value if `trimmed.length <= 50`; otherwise returns `''`
    - `validateDuration(v)`: converts to `Number`; returns `v` if `Number.isInteger(n) && n >= 1 && n <= 99`; otherwise returns `25`
    - `validateSort(v)`: returns `v` if `['creation', 'alpha', 'status'].includes(v)`; otherwise returns `'creation'`
    - Ensure all four load functions (`ThemeModule.load`, `GreetingModule.loadName`, `TimerModule.loadDuration`, `TaskModule.loadSort`) use these validators
    - _Requirements: 6.1, 6.4, 1.9, 3.5, 5.5_

  - [ ]* 11.2 Write property test — Property 15: Invalid Preference Values Fall Back to Defaults
    - **Property 15: Invalid Preference Values Fall Back to Defaults**
    - For any invalid value stored under `tld_theme`, `tld_username`, `tld_duration`, or `tld_sort`, the corresponding load function must return the default and must not throw
    - Use `fc.record({ theme: fc.string(), duration: fc.oneof(fc.string(), fc.float()), sort: fc.string(), username: fc.anything() })`
    - **Validates: Requirements 6.4, 1.9, 3.5, 5.5**

- [x] 12. Add CSS styles for all new controls in `css/styles.css`
  - [x] 12.1 Add styles for `#name-editor`, `#duration-form`, `#sort-controls`, and sort button active state
    - Style `#name-editor` as an inline flex row (input + Save + Cancel + validation span); hidden by default via `[hidden]`
    - Style `#duration-form` as an inline flex row (label + number input + Set button + validation span)
    - Style `#sort-controls` as a flex row of three `sort-btn` buttons; `sort-btn--active` uses `--color-accent` background with `--color-accent-text` foreground
    - Ensure all new controls are keyboard-focusable with `:focus-visible` outlines meeting WCAG 2.1 AA
    - Ensure no horizontal overflow at 320 px viewport width (flex-wrap where needed)
    - _Requirements: 1.7, 5.8, 7.3, 7.4_

- [x] 13. Final checkpoint — All features integrated and all tests pass
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all 15 property tests are optional sub-tasks.
- `ThemeModule.init()` **must** be the first call inside `DOMContentLoaded` to prevent a flash of the wrong theme (FOUC).
- The four new localStorage keys (`tld_theme`, `tld_username`, `tld_duration`, `tld_sort`) must not conflict with the existing `tld_tasks` and `tld_links` keys.
- All validation helpers (`validateTheme`, `validateUsername`, `validateDuration`, `validateSort`) must be declared before the modules that use them in `app.js`.
- Property tests run in Node.js via Vitest + fast-check; the production app files remain framework-free.
- Each property test file must include the comment tag: `// Feature: todo-dashboard-challenge-features, Property N: <property text>`
- The `reset()` method in `TimerModule` must be updated to use `this.sessionMinutes * 60` (not the hard-coded `1500`) as part of task 6.1.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1", "11.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "8.4", "9.1"] },
    { "id": 6, "tasks": ["9.2", "9.3", "11.2", "12.1"] }
  ]
}
```
