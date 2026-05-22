# Implementation Plan: Todo-Life Dashboard

## Overview

Implement a zero-dependency, single-page productivity dashboard using plain HTML, CSS, and vanilla JavaScript. All behavior lives in `js/app.js`, all styles in `css/styles.css`, and all markup in `index.html`. No build tools, no frameworks, no test files.

## Tasks

- [x] 1. Scaffold the three project files
  - [x] 1.1 Create `index.html` with semantic HTML structure
    - Add `<!DOCTYPE html>`, `<html lang="en">`, `<head>` with charset, viewport meta, and `<link rel="stylesheet" href="css/styles.css">`
    - Add `<body>` with four landmark sections: `#greeting-panel`, `#timer-panel`, ` #task-panel`, `#link-panel`
    - Inside `#greeting-panel`: add `<p id="greeting-text">`, `<time id="clock-time">`, `<time id="clock-date">`
    - Inside `#timer-panel`: add `<output id="timer-display">`, `<button id="timer-start">`, `<button id="timer-stop">`, `<button id="timer-reset">`, `<div id="timer-indicator" hidden>`
    - Inside `#task-panel`: add `<input id="task-input">`, `<button id="task-add-btn">`, `<span id="task-validation" role="alert">`, `<ul id="task-list">`, `<p id="task-empty">`
    - Inside `#link-panel`: add `<input id="link-label-input">`, `<input id="link-url-input">`, `<button id="link-add-btn">`, `<span id="link-validation" role="alert">`, `<div id="link-list">`
    - Add `<script src="js/app.js" defer></script>` before `</body>`
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 1.2 Create `css/styles.css` as an empty file with a top-level comment
    - File must exist at `css/styles.css` so the HTML `<link>` resolves without a 404
    - Add a single comment: `/* Todo-Life Dashboard styles */`
    - _Requirements: 13.2_

  - [x] 1.3 Create `js/app.js` as an empty file with a top-level comment
    - File must exist at `js/app.js` so the HTML `<script>` resolves without a 404
    - Add a single comment: `/* Todo-Life Dashboard — app.js */`
    - _Requirements: 13.3_

- [ ] 2. Implement Storage and Notify utilities in `js/app.js`
  - [x] 2.1 Implement the `Storage` utility object
    - Write `Storage.save(key, data)`: wraps `localStorage.setItem(key, JSON.stringify(data))` in try/catch; on catch calls `Notify.error(...)` and returns `false`; on success returns `true`
    - Write `Storage.load(key)`: wraps `localStorage.getItem(key)` and `JSON.parse` in try/catch; returns parsed value or `null` on any error
    - _Requirements: 9.3, 9.4, 12.3, 12.5, 14.5_

  - [ ] 2.2 Implement the `Notify` utility object
    - Write `Notify.error(message)`: creates a `<div role="alert">` toast, appends it to `<body>`, auto-dismisses after 4 000 ms, and provides a visible close button
    - Write `Notify.info(message)`: same structure but uses `role="status"`
    - Toasts must not block interaction with the rest of the page (use fixed positioning)
    - Escape key on a focused toast dismisses it
    - _Requirements: 7.5, 8.4, 10.8, 12.4, 14.5_

- [ ] 3. Implement GreetingModule in `js/app.js`
  - [x] 3.1 Implement pure helper functions for the greeting
    - Write `getGreeting(hour)`: returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–21, `"Good Night"` for 22–23 and 0–4
    - Write `formatTime(date)`: returns a zero-padded `"HH:MM"` string from a `Date` object
    - Write `formatDate(date)`: returns a string containing weekday name, numeric day, month name, and four-digit year (e.g., `"Monday, 26 May 2025"`)
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4_

  - [ ] 3.2 Implement `GreetingModule.init()` and the render loop
    - Write `GreetingModule.render()`: calls `new Date()` inside try/catch; on success updates `#greeting-text`, `#clock-time`, `#clock-date`; on catch sets `#clock-time` to `"--:--"` and `#clock-date` to `"--"`
    - Write `GreetingModule.init()`: calls `render()` immediately, then starts `setInterval(render, 60_000)`
    - Call `GreetingModule.init()` inside the `DOMContentLoaded` listener
    - _Requirements: 1.1, 1.3, 1.4, 2.5, 2.6_

- [x] 4. Implement TimerModule in `js/app.js`
  - [x] 4.1 Implement timer state, pure helpers, and render
    - Declare internal state: `{ remaining: 1500, running: false, intervalId: null }`
    - Write `formatTimer(seconds)`: returns zero-padded `"MM:SS"` string for any integer in [0, 1500]
    - Write `TimerModule.render()`: updates `#timer-display` with `formatTimer(remaining)`; sets `disabled` on `#timer-start` when running, on `#timer-stop` when not running; shows/hides `#timer-indicator` when `remaining === 0`
    - _Requirements: 3.1, 3.3, 4.5, 4.6, 4.7_

  - [x] 4.2 Implement timer controls and audio alert
    - Write `TimerModule.start()`: sets `running = true`, starts `setInterval(tick, 1000)`, calls `render()`
    - Write `TimerModule.stop()`: clears interval, sets `running = false`, calls `render()`
    - Write `TimerModule.reset()`: calls `stop()`, sets `remaining = 1500`, hides `#timer-indicator`, calls `render()`
    - Write `TimerModule.tick()`: decrements `remaining`; calls `render()`; if `remaining === 0` calls `onComplete()`
    - Write `TimerModule.onComplete()`: clears interval, sets `running = false`, shows `#timer-indicator`, plays a short beep using `AudioContext` (oscillator, ~440 Hz, ~0.5 s)
    - Attach click handlers for `#timer-start`, `#timer-stop`, `#timer-reset` to the respective methods
    - Write `TimerModule.init()`: calls `render()` and attaches event listeners; call it inside `DOMContentLoaded`
    - _Requirements: 3.2, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

- [x] 5. Checkpoint — verify scaffold and utilities
  - Open `index.html` in a browser and confirm: all four panels are visible, the clock shows the current time, the greeting matches the time of day, the timer shows `25:00`, Start is enabled, Stop is disabled.

- [ ] 6. Implement TaskModule in `js/app.js`
  - [ ] 6.1 Implement task data helpers and list rendering
    - Declare `tasks` array (initially `[]`)
    - Write `validateDescription(str)`: returns `{ valid: false, message: '...' }` for empty/whitespace-only strings and strings over 500 chars; returns `{ valid: true }` otherwise
    - Write `loadTasks()`: calls `Storage.load('tld_tasks')`; if result is a valid array assigns it to `tasks`; otherwise sets `tasks = []`
    - Write `saveTasks()`: calls `Storage.save('tld_tasks', tasks)`
    - Write `renderList()`: clears `#task-list`, iterates `tasks` and appends `renderTask(task)` for each; shows `#task-empty` when `tasks.length === 0`, hides it otherwise
    - Write `renderTask(task)`: returns a `<li>` with a checkbox (checked = `task.completed`), a `<span>` with strikethrough when completed, an Edit `<button>`, and a Delete `<button>`; each control carries the task `id` as a `data-id` attribute
    - _Requirements: 5.1, 5.4, 5.5, 7.1, 8.5, 9.1, 9.3, 9.4_

  - [ ] 6.2 Implement task CRUD operations
    - Write `addTask(description)`: validates; on failure shows message in `#task-validation`; on success generates `id = Date.now() + '_' + Math.random()`, pushes `{ id, description: description.trim(), completed: false }`, calls `saveTasks()`, calls `renderList()`, clears `#task-input` and `#task-validation`
    - Write `deleteTask(id)`: splices task from `tasks`, calls `saveTasks()`, calls `renderList()`
    - Write `toggleTask(id)`: flips `completed` on the matching task, calls `saveTasks()`, calls `renderList()`
    - Write `editTask(id, newDescription)`: validates; on failure shows inline message; on success updates `description`, calls `saveTasks()`, calls `renderList()`
    - Implement edit mode in `renderTask`: when Edit is clicked, replace the `<span>` with a pre-filled `<input>`, replace Edit/Delete buttons with Save/Cancel; Enter key triggers save, Escape key triggers cancel; focus moves to the edit input on activation
    - Attach `#task-add-btn` click and `#task-input` Enter-key handlers to `addTask`
    - Write `TaskModule.init()`: calls `loadTasks()`, calls `renderList()`, attaches event listeners; call it inside `DOMContentLoaded`
    - _Requirements: 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4_

- [ ] 7. Implement LinkModule in `js/app.js`
  - [ ] 7.1 Implement link data helpers and list rendering
    - Declare `links` array (initially `[]`)
    - Write `validateUrl(str)`: uses `new URL(str)` inside try/catch; returns `{ valid: false }` if it throws or if `protocol` is not `http:` or `https:`; returns `{ valid: true }` otherwise
    - Write `validateLink(label, url)`: returns `{ valid: false, message: '...' }` for empty/whitespace-only label, empty/whitespace-only URL, URL failing `validateUrl`, label over 100 chars, or URL over 2048 chars; returns `{ valid: true }` otherwise
    - Write `loadLinks()` / `saveLinks()`: same pattern as `loadTasks` / `saveTasks` using key `tld_links`
    - Write `renderLinks()`: clears `#link-list`, iterates `links` and appends `renderLink(link)` for each
    - Write `renderLink(link)`: returns a `<div>` containing a `<button>` whose text is `link.label || link.url` and a Delete `<button>`; the open button carries `data-url` and `data-id`; the delete button carries `data-id`
    - _Requirements: 10.1, 10.4, 10.7, 11.2, 12.1, 12.3, 12.5_

  - [ ] 7.2 Implement link CRUD and navigation
    - Write `addLink(label, url)`: validates via `validateLink`; on failure shows message in `#link-validation`; on success generates `id`, pushes `{ id, label: label.trim(), url: url.trim() }`, calls `saveLinks()`, calls `renderLinks()`, clears inputs and `#link-validation`
    - Write `deleteLink(id)`: splices from `links`, calls `saveLinks()`, calls `renderLinks()`
    - Write `openLink(url)`: re-validates via `validateUrl` at click time; on failure shows inline error adjacent to the button; on success calls `window.open(url, '_blank', 'noopener,noreferrer')`
    - Attach `#link-add-btn` click handler to `addLink`
    - Attach delegated click handler on `#link-list` to route open-button clicks to `openLink` and delete-button clicks to `deleteLink`
    - Write `LinkModule.init()`: calls `loadLinks()`, calls `renderLinks()`, attaches event listeners; call it inside `DOMContentLoaded`
    - _Requirements: 10.2, 10.3, 10.5, 10.6, 10.8, 11.1, 11.3, 12.2, 12.4_

- [ ] 8. Checkpoint — verify core functionality
  - Open `index.html` in a browser and confirm: tasks can be added, edited, completed, and deleted; links can be added and deleted; localStorage keys `tld_tasks` and `tld_links` appear in DevTools Application tab after each operation.

- [ ] 9. Apply CSS styling in `css/styles.css`
  - [ ] 9.1 Implement base reset, typography, and CSS custom properties
    - Add a CSS reset (`*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`)
    - Define CSS custom properties on `:root` for color palette, spacing scale, font sizes, and border-radius values
    - Set base `font-family`, `font-size`, `line-height`, and `color` on `body`
    - Ensure all text/background color pairs meet WCAG 2.1 AA contrast (≥4.5:1 for normal text, ≥3:1 for large text)
    - _Requirements: 13.4_

  - [ ] 9.2 Implement responsive layout grid
    - Style `body` or a `.dashboard` wrapper with CSS Grid or Flexbox to arrange the four panels
    - On narrow viewports (≤600 px): single-column stack
    - On medium viewports (601 px–1024 px): two-column grid
    - On wide viewports (≥1025 px): two-column or four-column grid
    - Ensure no horizontal scrollbar appears at 320 px viewport width
    - _Requirements: 13.1, 13.5_

  - [ ] 9.3 Style individual panels and components
    - Style `#greeting-panel`: large clock display, readable date, prominent greeting text
    - Style `#timer-panel`: large `#timer-display` (monospace font), clearly labeled control buttons, hidden-by-default `#timer-indicator` with a visible "Session complete" state
    - Style `#task-panel`: input + button row, task list items with checkbox, strikethrough for completed tasks, empty-state message, inline validation message
    - Style `#link-panel`: two-input add form, link button grid/flex layout, delete button per link, inline validation message
    - Style `.toast` (Notify): fixed top-center position, readable contrast, close button, z-index above all content
    - _Requirements: 13.1, 13.4_

  - [ ] 9.4 Implement focus styles and keyboard accessibility
    - Ensure all interactive elements (`button`, `input`, `a`) have a visible `:focus-visible` outline that meets WCAG 2.1 AA (3:1 contrast against adjacent colors)
    - Do not use `outline: none` without a replacement focus indicator
    - _Requirements: 13.4_

- [ ] 10. Implement error handling and edge cases in `js/app.js`
  - [ ] 10.1 Handle localStorage unavailability and quota errors
    - Verify `Storage.save` catch block calls `Notify.error` with a user-readable message when `localStorage.setItem` throws (quota exceeded, security error, private browsing)
    - Verify `Storage.load` catch block returns `null` silently (no uncaught error) when `localStorage.getItem` or `JSON.parse` throws
    - Verify each module initialises with an empty state when `Storage.load` returns `null`
    - _Requirements: 9.4, 12.5, 14.5_

  - [ ] 10.2 Handle corrupt localStorage data
    - In `loadTasks()`: after `Storage.load`, check `Array.isArray(result)`; if false, set `tasks = []` and call `Notify.info('Task data was unreadable and has been reset.')`
    - In `loadLinks()`: same pattern for `links`
    - _Requirements: 9.4, 12.5_

  - [ ] 10.3 Handle clock and timer edge cases
    - Verify `GreetingModule.render()` try/catch shows `"--:--"` / `"--"` on `Date` constructor failure
    - Verify `TimerModule.onComplete()` wraps `AudioContext` creation in try/catch; if Web Audio API is unavailable, silently skips the beep without throwing
    - _Requirements: 1.4, 3.4_

- [ ] 11. Cross-browser compatibility pass
  - [ ] 11.1 Audit `js/app.js` for cross-browser API usage
    - Replace any APIs not supported in current stable Chrome, Firefox, Edge, and Safari with compatible alternatives or add feature-detection guards
    - Ensure `AudioContext` usage includes a `window.AudioContext || window.webkitAudioContext` fallback
    - Ensure `window.open` uses `'noopener,noreferrer'` in the `windowFeatures` argument
    - Verify `localStorage`, `JSON`, `Date`, `setInterval`, `clearInterval`, `URL` constructor are used without polyfills (all supported in target browsers)
    - _Requirements: 14.1_

  - [ ] 11.2 Audit `css/styles.css` for cross-browser compatibility
    - Replace any CSS properties not supported in current stable Chrome, Firefox, Edge, and Safari with compatible alternatives or vendor-prefixed fallbacks
    - Verify CSS Grid and/or Flexbox layout renders correctly across all four target browsers
    - Verify `:focus-visible` has a fallback for browsers that do not support it (use `:focus` as a fallback selector)
    - _Requirements: 14.1_

- [ ] 12. Final checkpoint — full integration review
  - Open `index.html` in Chrome, Firefox, Edge, and Safari (or use browser DevTools device emulation for Safari)
  - Confirm at 320 px, 768 px, and 1440 px viewport widths: no horizontal scroll, all panels visible and usable
  - Confirm WCAG 2.1 AA contrast by inspecting color pairs with a contrast checker tool
  - Confirm all four panels operate correctly end-to-end: greeting updates, timer counts down and beeps, tasks persist across page reload, links open in new tabs
  - Confirm no uncaught JavaScript errors appear in the browser console

## Notes

- Only three files are produced: `index.html`, `css/styles.css`, `js/app.js`
- No package.json, no node_modules, no test files, no build configuration
- All module code lives inside `js/app.js`; modules are plain objects or IIFEs, not ES modules (avoids CORS issues when opening `index.html` directly from the filesystem)
- Tasks reference specific requirements for traceability
- Checkpoints (tasks 5, 8, 12) are manual browser verification steps — no automated test runner required

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "4.2"] },
    { "id": 4, "tasks": ["6.1", "7.1"] },
    { "id": 5, "tasks": ["6.2", "7.2"] },
    { "id": 6, "tasks": ["9.1"] },
    { "id": 7, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 8, "tasks": ["10.1", "10.2", "10.3"] },
    { "id": 9, "tasks": ["11.1", "11.2"] }
  ]
}
```
