# Requirements Document

## Introduction

This document specifies five challenge features to be added to the existing Todo-Life Dashboard — a single-page productivity web application built with plain HTML, CSS, and vanilla JavaScript. The features extend the existing dashboard with a light/dark theme toggle, a personalised greeting with a user-configurable name, a configurable Pomodoro timer duration, duplicate-task prevention, and task sorting. All new preferences are persisted via the browser's `localStorage` API. No backend, no frameworks, and no build tools are introduced; all changes are confined to the three existing files: `index.html`, `css/styles.css`, and `js/app.js`.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Theme**: The active colour scheme applied to the Dashboard — either `light` or `dark`.
- **Theme_Toggle**: The UI control that switches between the light and dark Theme.
- **User_Name**: The optional display name entered by the user, shown inside the greeting string.
- **Greeting_Panel**: The existing UI section that displays the current time, date, and time-of-day greeting.
- **Name_Editor**: The UI mechanism that allows the user to set or change the User_Name.
- **Timer**: The existing countdown focus timer component.
- **Session_Duration**: The configurable length of a Pomodoro session, expressed in whole minutes.
- **Duration_Input**: The UI control that allows the user to set the Session_Duration.
- **Task**: A single to-do item managed by the existing Task_List component.
- **Task_List**: The existing UI section that displays, adds, edits, and deletes Tasks.
- **Sort_Order**: The active ordering rule applied to the Task_List display — one of `creation` (default), `alpha` (A→Z), or `status` (incomplete first).
- **Sort_Control**: The UI control that allows the user to select the Sort_Order.
- **Local_Storage**: The browser's `localStorage` API used for all client-side data persistence.

---

## Requirements

### Requirement 1: Light and Dark Mode Toggle

**User Story:** As a user, I want to switch between a light and a dark colour theme, so that I can use the Dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle control that is visible on every page load and is focusable and activatable via the Enter or Space key without a pointer device.
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL switch the active Theme from `dark` to `light` or from `light` to `dark`.
3. WHEN the Theme changes, THE Dashboard SHALL apply the new colour scheme to all panels, text, inputs, and buttons within 200 milliseconds, without a full page reload.
4. WHEN the Dashboard page loads, THE Dashboard SHALL read the previously saved Theme from Local_Storage and apply it within one animation frame of the initial render, so that no flash of the wrong theme is visible to the user.
5. IF no Theme has been saved in Local_Storage, THEN THE Dashboard SHALL default to the `dark` Theme on first load.
6. WHEN the Theme changes, THE Dashboard SHALL persist the new Theme value to Local_Storage within 300 milliseconds; IF the Local_Storage write fails, THEN THE Dashboard SHALL display a user-visible error notification and retain the new Theme in memory for the current session.
7. THE Dashboard SHALL maintain WCAG 2.1 AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text) in both the `light` and `dark` Themes.
8. THE Theme_Toggle SHALL display a visible label or icon that indicates the currently active Theme and the action that will be taken when activated (e.g., "Switch to Light Mode" when dark is active); WHEN the Theme changes, THE Theme_Toggle label or icon SHALL update to reflect the new active Theme.
9. IF Local_Storage is unavailable on page load, THEN THE Dashboard SHALL apply the `dark` Theme as the default and SHALL NOT throw an uncaught error.

---

### Requirement 2: Custom User Name in Greeting

**User Story:** As a user, I want to set my name so that the greeting reads "Good Morning, Yudi!" instead of just "Good Morning", so that the Dashboard feels personally addressed to me.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL provide a Name_Editor control; WHEN the user activates the Name_Editor control, THE Greeting_Panel SHALL display an input field pre-filled with the current User_Name (or empty if none is saved).
2. WHEN the user saves a non-empty, non-whitespace-only User_Name (up to 50 characters) via the Name_Editor, THE Greeting_Panel SHALL display the greeting in the format "[Greeting], [User_Name]!" (e.g., "Good Morning, Yudi!").
3. WHEN the user saves a User_Name, THE Greeting_Panel SHALL persist the User_Name to Local_Storage within 300 milliseconds; IF the Local_Storage write fails, THEN THE Greeting_Panel SHALL display a user-visible error notification and retain the User_Name in memory for the current session; THE Greeting_Panel SHALL NOT display an error notification when the Local_Storage write succeeds.
4. WHEN the Dashboard page loads, THE Greeting_Panel SHALL read the previously saved User_Name from Local_Storage and include it in the greeting within 1 second of the initial render.
5. IF no User_Name has been saved in Local_Storage, THEN THE Greeting_Panel SHALL display the greeting without a name suffix (e.g., "Good Morning").
6. WHEN the user clears the User_Name field and saves an empty value, THE Greeting_Panel SHALL remove the name suffix from the greeting and delete the User_Name entry from Local_Storage.
7. IF the user attempts to save a User_Name exceeding 50 characters, THEN THE Name_Editor SHALL reject the input and display an inline validation message indicating the 50-character limit.
8. WHEN the user activates the Name_Editor, THE Greeting_Panel SHALL move keyboard focus to the name input field so the user can type without requiring a pointer device.
9. WHEN the Name_Editor input field is visible, THE Name_Editor SHALL be operable entirely via keyboard (Tab to reach, type to enter, Enter to save, Escape to cancel) without requiring a pointer device.

---

### Requirement 3: Custom Pomodoro Timer Duration

**User Story:** As a user, I want to configure the Pomodoro session length beyond the fixed 25 minutes, so that I can adapt the timer to my preferred focus intervals.

#### Acceptance Criteria

1. THE Timer SHALL provide a Duration_Input that allows the user to set the Session_Duration to any whole number of minutes between 1 and 99 (inclusive).
2. WHEN the user confirms a valid Session_Duration via the Duration_Input, THE Timer SHALL update the Session_Duration, stop any active countdown, and reset the timer display to the new Session_Duration in MM:SS format (e.g., confirming 45 minutes displays "45:00").
3. WHEN the user confirms a valid Session_Duration, THE Timer SHALL persist the new Session_Duration to Local_Storage within 300 milliseconds; IF the Local_Storage write fails, THEN THE Timer SHALL display a user-visible error notification and retain the new Session_Duration in memory for the current session.
4. WHEN the Dashboard page loads, THE Timer SHALL read the previously saved Session_Duration from Local_Storage and initialise the timer display to that duration.
5. IF no Session_Duration has been saved in Local_Storage, THEN THE Timer SHALL default to 25 minutes on page load.
6. IF the user enters a Session_Duration outside the range of 1 to 99 minutes (e.g., 0 or 100), THEN THE Duration_Input SHALL reject the input and display an inline validation message indicating the valid range of 1 to 99 minutes.
7. IF the user enters a non-numeric value, a decimal number, or an empty value in the Duration_Input, THEN THE Duration_Input SHALL reject the input and display an inline validation message indicating that a whole number between 1 and 99 is required.
8. WHEN the user confirms a valid Session_Duration while the Timer is counting down, THE Timer SHALL stop the active countdown and reset the timer display to the new Session_Duration.
9. WHILE the Timer is counting down, THE Duration_Input SHALL remain visible and accessible so the user can enter a new duration at any time.

---

### Requirement 4: Prevent Duplicate Tasks

**User Story:** As a user, I want the Task_List to reject duplicate task descriptions, so that I do not accidentally add the same task twice.

#### Acceptance Criteria

1. WHEN the user attempts to add a Task whose description matches an existing Task description (case-insensitive, after trimming leading and trailing whitespace), THE Task_List SHALL reject the submission and leave the task list unchanged.
2. WHEN a duplicate Task submission is rejected, THE Task_List SHALL display an inline validation message directly below the task input field, indicating that a task with that description already exists.
3. WHEN a duplicate Task submission is rejected, THE Task_List SHALL leave the task input field populated with the submitted text so the user can modify it; THE Task_List SHALL NOT attempt to preserve cursor position or text selection state.
4. WHEN the user modifies the content of the task input field after a duplicate rejection, THE Task_List SHALL clear the duplicate-task validation message.
5. WHEN the user edits an existing Task and confirms a description that matches any other existing Task description (case-insensitive, after trimming), THE Task_List SHALL reject the update and leave the task unchanged.
6. WHEN the user edits an existing Task and confirms a duplicate description, THE Task_List SHALL display an inline validation message inside the edit row indicating that a task with that description already exists.
7. WHEN the user modifies the content of the edit input field after a duplicate rejection in edit mode, THE Task_List SHALL clear the duplicate-task validation message in the edit row.
8. WHEN the user edits an existing Task and confirms the same description as the task being edited (unchanged), THE Task_List SHALL accept the save and return to display mode (a task is not a duplicate of itself).

---

### Requirement 5: Sort Tasks

**User Story:** As a user, I want to sort my task list in different orders, so that I can view my tasks in the way that is most useful to me at any given time.

#### Acceptance Criteria

1. THE Task_List SHALL provide a Sort_Control that allows the user to select one of the following Sort_Orders: `creation` (original insertion order, default), `alpha` (alphabetical A→Z by description, case-insensitive), or `status` (incomplete tasks first, then complete tasks, each sub-group in creation order).
2. WHEN the user selects a Sort_Order via the Sort_Control, THE Task_List SHALL re-render the task list in the selected order within 200 milliseconds.
3. WHEN the user selects a Sort_Order, THE Task_List SHALL persist the selected Sort_Order to Local_Storage within 300 milliseconds; IF the Local_Storage write fails, THEN THE Task_List SHALL display a user-visible error notification and retain the selected Sort_Order in memory for the current session.
4. WHEN the Dashboard page loads, THE Task_List SHALL read the previously saved Sort_Order from Local_Storage and render the task list in that order within 300 milliseconds of the initial render.
5. IF no Sort_Order has been saved in Local_Storage, or IF the Sort_Order value read from Local_Storage is not one of the valid values (`creation`, `alpha`, `status`), or IF the Local_Storage read fails, THEN THE Task_List SHALL default to the `creation` Sort_Order on page load and SHALL NOT throw an uncaught error.
6. WHEN a new Task is added, THE Task_List SHALL insert the new Task at the end of the underlying creation-order array and then re-render the list in the currently active Sort_Order.
7. WHEN a Task is deleted or its completion state changes, THE Task_List SHALL re-render the list in the currently active Sort_Order.
8. THE Sort_Control SHALL visually distinguish the currently active Sort_Order from the inactive Sort_Orders at all times (e.g., via a selected, highlighted, or checked state on the active option).

---

### Requirement 6: Persistence of All New Preferences

**User Story:** As a user, I want all my new preferences (theme, name, timer duration, sort order) to be saved automatically, so that my settings are restored every time I open the Dashboard.

#### Acceptance Criteria

1. THE Dashboard SHALL store each new preference under a distinct Local_Storage key using the following registry: `tld_theme` (valid values: `"dark"` or `"light"`, default `"dark"`), `tld_username` (valid value: a string of 0–50 characters, default `""`), `tld_duration` (valid value: an integer in [1, 99], default `25`), `tld_sort` (valid values: `"creation"`, `"alpha"`, or `"status"`, default `"creation"`); none of these keys SHALL conflict with the existing keys `tld_tasks` or `tld_links`; THE Dashboard SHALL enforce these valid value ranges when writing to and reading from Local_Storage, rejecting out-of-range values and applying the corresponding default.
2. WHEN the Dashboard page loads, THE Dashboard SHALL restore all saved preferences — Theme, User_Name, Session_Duration, and Sort_Order — and apply them to the UI before any panel is rendered, so that each panel renders in its correct saved state on the first paint.
3. IF Local_Storage is unavailable or a write operation fails for any new preference, THEN THE Dashboard SHALL display a user-visible error notification and continue operating with the in-memory preference value for the current session.
4. IF a saved preference value in Local_Storage is missing or cannot be parsed as a valid value for that preference (e.g., `tld_duration` contains `"abc"` or `tld_theme` contains `"blue"`), THEN THE Dashboard SHALL apply the default value for that preference and SHALL NOT throw an uncaught error.
5. THE Dashboard SHALL operate without a backend server, relying solely on static files and the Local_Storage API for all preference persistence.

---

### Requirement 7: Implementation Constraints

**User Story:** As a developer, I want all new features to be implemented within the existing three-file structure using only vanilla web technologies, so that the project remains dependency-free and easy to maintain.

#### Acceptance Criteria

1. THE Dashboard SHALL implement all five challenge features exclusively within the three existing files: `index.html`, `css/styles.css`, and `js/app.js`; no additional files, modules, or external scripts SHALL be introduced.
2. THE Dashboard SHALL implement all new behaviour using only vanilla HTML, CSS, and JavaScript with no frameworks, libraries, build tools, or package managers.
3. THE Dashboard SHALL remain usable at viewport widths from 320px to 1920px after all five features are added, where "usable" means: no horizontal scrollbar is present, all controls are visible and reachable via keyboard, and no content is clipped or overlapping.
4. THE Dashboard SHALL render with all features operable and with no uncaught JavaScript errors in the current stable releases of Chrome, Firefox, Edge, and Safari; "operable" means every control responds to user interaction and produces the expected state change described in Requirements 1–6.
5. WHEN the user interacts with any control — including Theme_Toggle, Name_Editor, Duration_Input, Sort_Control, task completion toggles, and task/link delete controls — THE Dashboard SHALL reflect the change as a visual DOM update within 100 milliseconds.
