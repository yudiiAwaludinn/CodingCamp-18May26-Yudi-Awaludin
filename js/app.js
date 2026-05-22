/* Todo-Life Dashboard — app.js */

// ---------------------------------------------------------------------------
// Notify utility
// Displays dismissible toast notifications at the top of the viewport.
// Must be declared before Storage so Storage.save can call Notify.error.
// Requirements: 7.5, 8.4, 10.8, 12.4, 14.5
// ---------------------------------------------------------------------------
const Notify = (function () {
  /**
   * Internal helper — creates and shows a toast with the given ARIA role.
   * @param {string} message
   * @param {'alert'|'status'} role
   */
  function show(message, role) {
    var toast = document.createElement('div');
    toast.setAttribute('role', role);
    toast.className = 'toast toast--' + (role === 'alert' ? 'error' : 'info');
    toast.style.cssText = [
      'position:fixed',
      'top:1rem',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:9999',
      'background:' + (role === 'alert' ? '#b91c1c' : '#1d4ed8'),
      'color:#fff',
      'padding:0.75rem 1.25rem',
      'border-radius:0.375rem',
      'box-shadow:0 4px 12px rgba(0,0,0,0.25)',
      'display:flex',
      'align-items:center',
      'gap:0.75rem',
      'max-width:90vw',
      'font-size:0.9375rem',
      'line-height:1.4'
    ].join(';');

    var text = document.createElement('span');
    text.textContent = message;

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Dismiss notification');
    closeBtn.style.cssText = [
      'background:transparent',
      'border:none',
      'color:inherit',
      'cursor:pointer',
      'font-size:1rem',
      'line-height:1',
      'padding:0',
      'flex-shrink:0'
    ].join(';');

    toast.appendChild(text);
    toast.appendChild(closeBtn);

    // Stack toasts by offsetting each one below the previous
    var existing = document.querySelectorAll('.toast');
    var offset = 1; // rem base
    existing.forEach(function (el) {
      offset += el.offsetHeight / 16 + 0.5;
    });
    toast.style.top = offset + 'rem';

    document.body.appendChild(toast);

    function dismiss() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }

    var timerId = setTimeout(dismiss, 4000);

    closeBtn.addEventListener('click', function () {
      clearTimeout(timerId);
      dismiss();
    });

    // Escape key on a focused toast dismisses it
    toast.setAttribute('tabindex', '-1');
    toast.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        clearTimeout(timerId);
        dismiss();
      }
    });
  }

  return {
    /**
     * Show an error toast (role="alert").
     * @param {string} message
     */
    error: function (message) {
      show(message, 'alert');
    },

    /**
     * Show an informational toast (role="status").
     * @param {string} message
     */
    info: function (message) {
      show(message, 'status');
    }
  };
}());

// ---------------------------------------------------------------------------
// Storage utility
// Wraps localStorage with JSON serialisation and graceful error handling.
// Requirements: 9.3, 9.4, 12.3, 12.5, 14.5
// ---------------------------------------------------------------------------
const Storage = {
  /**
   * Serialise `data` to JSON and write it to localStorage under `key`.
   * @param {string} key
   * @param {*} data
   * @returns {boolean} true on success, false on failure
   */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      Notify.error('Could not save data. Storage may be full or unavailable.');
      return false;
    }
  },

  /**
   * Read and JSON-parse the value stored under `key`.
   * @param {string} key
   * @returns {*} parsed value, or null if the key is absent or parsing fails
   */
  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
};

// ---------------------------------------------------------------------------
// GreetingModule — pure helper functions
// Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4
// ---------------------------------------------------------------------------

/**
 * Return a time-of-day greeting string based on the given hour (0–23).
 *
 * Mapping:
 *   05–11 → "Good Morning"
 *   12–17 → "Good Afternoon"
 *   18–21 → "Good Evening"
 *   22–23, 00–04 → "Good Night"
 *
 * @param {number} hour  Integer in [0, 23]
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5 && hour <= 11) {
    return 'Good Morning';
  }
  if (hour >= 12 && hour <= 17) {
    return 'Good Afternoon';
  }
  if (hour >= 18 && hour <= 21) {
    return 'Good Evening';
  }
  // Covers 22–23 and 0–4
  return 'Good Night';
}

/**
 * Format a Date object as a zero-padded "HH:MM" string using the device's
 * local timezone.
 *
 * @param {Date} date
 * @returns {string}  e.g. "09:05" or "23:47"
 */
function formatTime(date) {
  var hours   = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  return hours + ':' + minutes;
}

/**
 * Format a Date object as a human-readable date string containing the
 * weekday name, numeric day, month name, and four-digit year.
 *
 * Output example: "Monday, 26 May 2025"
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  var weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];
  var months = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];

  var weekday = weekdays[date.getDay()];
  var day     = date.getDate();
  var month   = months[date.getMonth()];
  var year    = date.getFullYear();

  return weekday + ', ' + day + ' ' + month + ' ' + year;
}

// ---------------------------------------------------------------------------
// GreetingModule — render loop
// Requirements: 1.1, 1.3, 1.4, 2.5, 2.6
// ---------------------------------------------------------------------------
const GreetingModule = {
  /**
   * Read the current time, update #greeting-text, #clock-time, #clock-date.
   * Wraps new Date() in try/catch; falls back to placeholder strings on error.
   */
  render() {
    var greetingEl = document.getElementById('greeting-text');
    var clockTimeEl = document.getElementById('clock-time');
    var clockDateEl = document.getElementById('clock-date');

    try {
      var now = new Date();
      var timeStr = formatTime(now);
      var dateStr = formatDate(now);
      var greeting = getGreeting(now.getHours());

      if (greetingEl) greetingEl.textContent = greeting;

      if (clockTimeEl) {
        // ISO datetime attribute for the <time> element (HH:MM)
        clockTimeEl.setAttribute('datetime', timeStr);
        clockTimeEl.textContent = timeStr;
      }

      if (clockDateEl) {
        // ISO date attribute for the <time> element (YYYY-MM-DD)
        var isoDate = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');
        clockDateEl.setAttribute('datetime', isoDate);
        clockDateEl.textContent = dateStr;
      }
    } catch (e) {
      if (greetingEl) greetingEl.textContent = '';
      if (clockTimeEl) clockTimeEl.textContent = '--:--';
      if (clockDateEl) clockDateEl.textContent = '--';
    }
  },

  /**
   * Initialise the GreetingModule.
   * Renders immediately, then schedules a re-render every 60 seconds.
   */
  init() {
    this.render();
    var self = this;
    setInterval(function () {
      self.render();
    }, 60000);
  }
};

// ---------------------------------------------------------------------------
// TimerModule — state, pure helpers, and render
// Requirements: 3.1, 3.3, 4.5, 4.6, 4.7
// ---------------------------------------------------------------------------

/**
 * Format a total number of seconds as a zero-padded "MM:SS" string.
 *
 * @param {number} seconds  Integer in [0, 1500]
 * @returns {string}  e.g. "25:00", "04:59", "00:00"
 */
function formatTimer(seconds) {
  var mm = Math.floor(seconds / 60);
  var ss = seconds % 60;
  return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

const TimerModule = {
  // Internal state
  // remaining: seconds left in the current session (1500 = 25 min)
  // running:   true while the countdown interval is active
  // intervalId: handle returned by setInterval, or null when stopped
  remaining: 1500,
  running: false,
  intervalId: null,

  /**
   * Update the timer UI to reflect the current internal state.
   *
   * - Sets #timer-display text to formatTimer(remaining).
   * - Disables #timer-start while running; enables it otherwise.
   * - Disables #timer-stop while NOT running; enables it otherwise.
   * - Shows #timer-indicator (removes `hidden`) when remaining === 0;
   *   hides it (adds `hidden`) otherwise.
   *
   * Requirements: 3.1, 3.3, 4.5, 4.6, 4.7
   */
  render() {
    var display    = document.getElementById('timer-display');
    var btnStart   = document.getElementById('timer-start');
    var btnStop    = document.getElementById('timer-stop');
    var indicator  = document.getElementById('timer-indicator');

    if (display)   display.textContent    = formatTimer(this.remaining);
    if (btnStart)  btnStart.disabled      = this.running;
    if (btnStop)   btnStop.disabled       = !this.running;
    if (indicator) indicator.hidden       = this.remaining !== 0;
  },

  /**
   * Start the countdown.
   * Sets running = true, starts a 1-second interval that calls tick(),
   * and updates the UI.
   *
   * Requirements: 3.2, 4.2
   */
  start() {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(function () {
      TimerModule.tick();
    }, 1000);
    this.render();
  },

  /**
   * Stop (pause) the countdown.
   * Clears the interval, sets running = false, and updates the UI.
   *
   * Requirements: 4.3
   */
  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running = false;
    this.render();
  },

  /**
   * Reset the timer to the initial 25-minute state.
   * Stops any active countdown, restores remaining to 1500,
   * hides the end-of-session indicator, and updates the UI.
   *
   * Requirements: 4.4
   */
  reset() {
    this.stop();
    this.remaining = 1500;
    var indicator = document.getElementById('timer-indicator');
    if (indicator) indicator.hidden = true;
    this.render();
  },

  /**
   * Called every second while the timer is running.
   * Decrements remaining, updates the UI, and triggers onComplete()
   * when the countdown reaches zero.
   *
   * Requirements: 3.2, 3.3
   */
  tick() {
    this.remaining -= 1;
    this.render();
    if (this.remaining === 0) {
      this.onComplete();
    }
  },

  /**
   * Called when the countdown reaches 00:00.
   * Clears the interval, marks the timer as stopped, shows the
   * end-of-session indicator, and plays a short audible beep using
   * the Web Audio API (~440 Hz, ~0.5 s).
   *
   * AudioContext creation is wrapped in try/catch so that browsers
   * without Web Audio API support silently skip the beep.
   *
   * Requirements: 3.4, 3.5
   */
  onComplete() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.running = false;

    var indicator = document.getElementById('timer-indicator');
    if (indicator) indicator.hidden = false;

    // Play a short beep using the Web Audio API.
    // Falls back silently if the API is unavailable.
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        var ctx = new AudioCtx();
        var oscillator = ctx.createOscillator();
        var gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, ctx.currentTime);

        // Fade out over 0.5 s to avoid a harsh click at the end
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Web Audio API unavailable or blocked — skip the beep silently
    }
  },

  /**
   * Initialise the TimerModule.
   * Renders the initial UI state and attaches click handlers to the
   * Start, Stop, and Reset buttons.
   *
   * Requirements: 4.1, 4.7
   */
  init() {
    this.render();

    var btnStart = document.getElementById('timer-start');
    var btnStop  = document.getElementById('timer-stop');
    var btnReset = document.getElementById('timer-reset');

    if (btnStart) {
      btnStart.addEventListener('click', function () {
        TimerModule.start();
      });
    }
    if (btnStop) {
      btnStop.addEventListener('click', function () {
        TimerModule.stop();
      });
    }
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        TimerModule.reset();
      });
    }
  }
};

// ---------------------------------------------------------------------------
// TaskModule — persistent to-do list
// Requirements: 5.1–5.5, 6.1–6.6, 7.1–7.5, 8.1–8.5, 9.1–9.4
// ---------------------------------------------------------------------------

/**
 * Validate a task description string.
 * Returns { valid: false, message: '...' } for empty/whitespace-only strings
 * and strings over 500 characters; returns { valid: true } otherwise.
 *
 * @param {string} str
 * @returns {{ valid: boolean, message?: string }}
 */
function validateDescription(str) {
  if (!str || str.trim().length === 0) {
    return { valid: false, message: 'Task description cannot be empty.' };
  }
  if (str.trim().length > 500) {
    return { valid: false, message: 'Task description must be 500 characters or fewer.' };
  }
  return { valid: true };
}

const TaskModule = {
  /** @type {Array<{ id: string, description: string, completed: boolean }>} */
  tasks: [],

  // ── Persistence ──────────────────────────────────────────────────────────

  /** Load tasks from localStorage; fall back to [] on any error. */
  loadTasks() {
    var result = Storage.load('tld_tasks');
    if (Array.isArray(result)) {
      this.tasks = result;
    } else {
      if (result !== null) {
        // Data existed but wasn't a valid array — notify and reset
        Notify.info('Task data was unreadable and has been reset.');
      }
      this.tasks = [];
    }
  },

  /** Persist the current tasks array to localStorage. */
  saveTasks() {
    Storage.save('tld_tasks', this.tasks);
  },

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Re-render the full task list.
   * Clears #task-list, appends a <li> for each task, shows/hides #task-empty.
   */
  renderList() {
    var listEl  = document.getElementById('task-list');
    var emptyEl = document.getElementById('task-empty');
    if (!listEl) return;

    // Clear existing items
    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    this.tasks.forEach(function (task) {
      listEl.appendChild(TaskModule.renderTask(task, false));
    });

    if (emptyEl) {
      emptyEl.hidden = this.tasks.length > 0;
    }
  },

  /**
   * Build and return a <li> element for a single task.
   * When editMode is true the description span is replaced with an input.
   *
   * @param {{ id: string, description: string, completed: boolean }} task
   * @param {boolean} editMode
   * @returns {HTMLLIElement}
   */
  renderTask(task, editMode) {
    var li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
    li.dataset.id = task.id;

    // ── Checkbox ──────────────────────────────────────────────────────────
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', 'Mark "' + task.description + '" as ' + (task.completed ? 'incomplete' : 'complete'));
    checkbox.addEventListener('change', function () {
      TaskModule.toggleTask(task.id);
    });

    li.appendChild(checkbox);

    if (editMode) {
      // ── Edit mode ─────────────────────────────────────────────────────
      var editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = task.description;
      editInput.className = 'task-edit-input';
      editInput.setAttribute('aria-label', 'Edit task description');
      editInput.maxLength = 500;

      var inlineMsg = document.createElement('span');
      inlineMsg.className = 'task-inline-msg';
      inlineMsg.setAttribute('role', 'alert');

      var saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      saveBtn.className = 'task-btn task-btn--save';

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.className = 'task-btn task-btn--cancel';

      function doSave() {
        TaskModule.editTask(task.id, editInput.value, inlineMsg);
      }
      function doCancel() {
        TaskModule.renderList(); // re-render discards edit state
      }

      saveBtn.addEventListener('click', doSave);
      cancelBtn.addEventListener('click', doCancel);

      editInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); doSave(); }
        if (e.key === 'Escape') { e.preventDefault(); doCancel(); }
      });

      li.appendChild(editInput);
      li.appendChild(inlineMsg);
      li.appendChild(saveBtn);
      li.appendChild(cancelBtn);

      // Move focus to the edit input after the element is in the DOM
      setTimeout(function () { editInput.focus(); }, 0);

    } else {
      // ── Display mode ──────────────────────────────────────────────────
      var span = document.createElement('span');
      span.className = 'task-description' + (task.completed ? ' task-description--done' : '');
      span.textContent = task.description;

      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Edit';
      editBtn.className = 'task-btn task-btn--edit';
      editBtn.setAttribute('aria-label', 'Edit task: ' + task.description);
      editBtn.addEventListener('click', function () {
        // Replace this <li> with an edit-mode version in place
        var parent = li.parentNode;
        if (parent) {
          var editLi = TaskModule.renderTask(task, true);
          parent.replaceChild(editLi, li);
        }
      });

      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'task-btn task-btn--delete';
      deleteBtn.setAttribute('aria-label', 'Delete task: ' + task.description);
      deleteBtn.addEventListener('click', function () {
        TaskModule.deleteTask(task.id);
      });

      li.appendChild(span);
      li.appendChild(editBtn);
      li.appendChild(deleteBtn);
    }

    return li;
  },

  // ── CRUD operations ───────────────────────────────────────────────────────

  /**
   * Add a new task.
   * Validates description; on failure shows message in #task-validation.
   * On success appends task, saves, re-renders, clears input.
   *
   * @param {string} description
   */
  addTask(description) {
    var validationEl = document.getElementById('task-validation');
    var result = validateDescription(description);

    if (!result.valid) {
      if (validationEl) validationEl.textContent = result.message;
      return;
    }

    if (validationEl) validationEl.textContent = '';

    var id = Date.now() + '_' + Math.random();
    this.tasks.push({ id: id, description: description.trim(), completed: false });
    this.saveTasks();
    this.renderList();

    var inputEl = document.getElementById('task-input');
    if (inputEl) inputEl.value = '';
  },

  /**
   * Delete a task by id.
   * @param {string} id
   */
  deleteTask(id) {
    var idx = this.tasks.findIndex(function (t) { return t.id === id; });
    if (idx !== -1) {
      this.tasks.splice(idx, 1);
      this.saveTasks();
      this.renderList();
    }
  },

  /**
   * Toggle the completed state of a task by id.
   * @param {string} id
   */
  toggleTask(id) {
    var task = this.tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.completed = !task.completed;
      this.saveTasks();
      this.renderList();
    }
  },

  /**
   * Commit an in-progress edit.
   * Validates newDescription; on failure writes to inlineMsg element.
   * On success updates task, saves, re-renders.
   *
   * @param {string} id
   * @param {string} newDescription
   * @param {HTMLElement|null} inlineMsgEl  — span inside the edit <li>
   */
  editTask(id, newDescription, inlineMsgEl) {
    var result = validateDescription(newDescription);
    if (!result.valid) {
      if (inlineMsgEl) inlineMsgEl.textContent = result.message;
      return;
    }

    var task = this.tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.description = newDescription.trim();
      this.saveTasks();
      this.renderList();
    }
  },

  // ── Initialisation ────────────────────────────────────────────────────────

  /**
   * Initialise the TaskModule.
   * Loads persisted tasks, renders the list, attaches event listeners.
   */
  init() {
    this.loadTasks();
    this.renderList();

    var addBtn  = document.getElementById('task-add-btn');
    var inputEl = document.getElementById('task-input');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        TaskModule.addTask(inputEl ? inputEl.value : '');
      });
    }

    if (inputEl) {
      // Clear validation message as the user types
      inputEl.addEventListener('input', function () {
        var validationEl = document.getElementById('task-validation');
        if (validationEl) validationEl.textContent = '';
      });

      // Submit on Enter key
      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          TaskModule.addTask(inputEl.value);
        }
      });
    }
  }
};

// ---------------------------------------------------------------------------
// LinkModule — quick-access link panel
// Requirements: 10.1–10.8, 11.1–11.3, 12.1–12.5
// ---------------------------------------------------------------------------

/**
 * Validate a URL string.
 * Uses the URL constructor inside try/catch; rejects anything that throws
 * or whose protocol is not http: or https:.
 *
 * @param {string} str
 * @returns {{ valid: boolean }}
 */
function validateUrl(str) {
  if (!str || str.trim().length === 0) {
    return { valid: false };
  }
  try {
    var parsed = new URL(str.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false };
    }
    return { valid: true };
  } catch (e) {
    return { valid: false };
  }
}

/**
 * Validate a (label, url) pair for adding a Quick_Link.
 * Returns { valid: false, message: '...' } on any failure.
 *
 * @param {string} label
 * @param {string} url
 * @returns {{ valid: boolean, message?: string }}
 */
function validateLink(label, url) {
  if (!label || label.trim().length === 0) {
    return { valid: false, message: 'Link label cannot be empty.' };
  }
  if (label.trim().length > 100) {
    return { valid: false, message: 'Link label must be 100 characters or fewer.' };
  }
  if (!url || url.trim().length === 0) {
    return { valid: false, message: 'Link URL cannot be empty.' };
  }
  if (url.trim().length > 2048) {
    return { valid: false, message: 'Link URL must be 2048 characters or fewer.' };
  }
  if (!validateUrl(url).valid) {
    return { valid: false, message: 'URL must start with http:// or https://' };
  }
  return { valid: true };
}

const LinkModule = {
  /** @type {Array<{ id: string, label: string, url: string }>} */
  links: [],

  // ── Persistence ──────────────────────────────────────────────────────────

  /** Load links from localStorage; fall back to [] on any error. */
  loadLinks() {
    var result = Storage.load('tld_links');
    if (Array.isArray(result)) {
      this.links = result;
    } else {
      if (result !== null) {
        Notify.info('Link data was unreadable and has been reset.');
      }
      this.links = [];
    }
  },

  /** Persist the current links array to localStorage. */
  saveLinks() {
    Storage.save('tld_links', this.links);
  },

  // ── Rendering ─────────────────────────────────────────────────────────────

  /**
   * Re-render the full link list.
   * Clears #link-list and appends a wrapper div for each link.
   */
  renderLinks() {
    var listEl = document.getElementById('link-list');
    if (!listEl) return;

    while (listEl.firstChild) {
      listEl.removeChild(listEl.firstChild);
    }

    this.links.forEach(function (link) {
      listEl.appendChild(LinkModule.renderLink(link));
    });
  },

  /**
   * Build and return a wrapper <div> for a single Quick_Link.
   * Contains an open button (label or URL as text) and a Delete button.
   *
   * @param {{ id: string, label: string, url: string }} link
   * @returns {HTMLDivElement}
   */
  renderLink(link) {
    var wrapper = document.createElement('div');
    wrapper.className = 'link-item';
    wrapper.dataset.id = link.id;

    // Open button — displays label, falls back to URL if label is empty
    var openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'link-btn link-btn--open';
    openBtn.textContent = link.label || link.url;
    openBtn.dataset.url = link.url;
    openBtn.dataset.id  = link.id;
    openBtn.setAttribute('aria-label', 'Open ' + (link.label || link.url) + ' in new tab');

    // Inline error span (hidden until needed)
    var inlineErr = document.createElement('span');
    inlineErr.className = 'link-inline-err';
    inlineErr.setAttribute('role', 'alert');

    openBtn.addEventListener('click', function () {
      LinkModule.openLink(link.url, inlineErr);
    });

    // Delete button
    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'link-btn link-btn--delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.id = link.id;
    deleteBtn.setAttribute('aria-label', 'Delete link: ' + (link.label || link.url));

    deleteBtn.addEventListener('click', function () {
      LinkModule.deleteLink(link.id);
    });

    wrapper.appendChild(openBtn);
    wrapper.appendChild(inlineErr);
    wrapper.appendChild(deleteBtn);

    return wrapper;
  },

  // ── CRUD & navigation ─────────────────────────────────────────────────────

  /**
   * Add a new Quick_Link.
   * Validates via validateLink; on failure shows message in #link-validation.
   * On success appends link, saves, re-renders, clears inputs.
   *
   * @param {string} label
   * @param {string} url
   */
  addLink(label, url) {
    var validationEl = document.getElementById('link-validation');
    var result = validateLink(label, url);

    if (!result.valid) {
      if (validationEl) validationEl.textContent = result.message;
      return;
    }

    if (validationEl) validationEl.textContent = '';

    var id = Date.now() + '_' + Math.random();
    this.links.push({ id: id, label: label.trim(), url: url.trim() });
    this.saveLinks();
    this.renderLinks();

    var labelInput = document.getElementById('link-label-input');
    var urlInput   = document.getElementById('link-url-input');
    if (labelInput) labelInput.value = '';
    if (urlInput)   urlInput.value   = '';
  },

  /**
   * Delete a Quick_Link by id.
   * @param {string} id
   */
  deleteLink(id) {
    var idx = this.links.findIndex(function (l) { return l.id === id; });
    if (idx !== -1) {
      this.links.splice(idx, 1);
      this.saveLinks();
      this.renderLinks();
    }
  },

  /**
   * Open a URL in a new tab.
   * Re-validates at click time; shows inline error on failure.
   *
   * @param {string} url
   * @param {HTMLElement|null} inlineErrEl  — span adjacent to the open button
   */
  openLink(url, inlineErrEl) {
    if (!validateUrl(url).valid) {
      if (inlineErrEl) {
        inlineErrEl.textContent = 'This URL is invalid and cannot be opened.';
      }
      return;
    }
    if (inlineErrEl) inlineErrEl.textContent = '';
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // ── Initialisation ────────────────────────────────────────────────────────

  /**
   * Initialise the LinkModule.
   * Loads persisted links, renders the list, attaches event listeners.
   */
  init() {
    this.loadLinks();
    this.renderLinks();

    var addBtn    = document.getElementById('link-add-btn');
    var labelInput = document.getElementById('link-label-input');
    var urlInput   = document.getElementById('link-url-input');

    if (addBtn) {
      addBtn.addEventListener('click', function () {
        LinkModule.addLink(
          labelInput ? labelInput.value : '',
          urlInput   ? urlInput.value   : ''
        );
      });
    }

    // Clear validation message as the user types in either field
    function clearValidation() {
      var validationEl = document.getElementById('link-validation');
      if (validationEl) validationEl.textContent = '';
    }
    if (labelInput) labelInput.addEventListener('input', clearValidation);
    if (urlInput)   urlInput.addEventListener('input', clearValidation);
  }
};

// ---------------------------------------------------------------------------
// DOMContentLoaded — bootstrap all modules
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  GreetingModule.init();
  TimerModule.init();
  TaskModule.init();
  LinkModule.init();
});
