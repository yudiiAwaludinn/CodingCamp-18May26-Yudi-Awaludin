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
 * Validate a username value read from localStorage.
 * Returns the trimmed string if it is a string of 0–50 characters;
 * otherwise returns '' as the safe default.
 *
 * @param {*} v
 * @returns {string}
 */
function validateUsername(v) {
  if (typeof v !== 'string') return '';
  var trimmed = v.trim();
  return trimmed.length <= 50 ? trimmed : '';
}

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
  var seconds = String(date.getSeconds()).padStart(2, '0');
  return hours + ':' + minutes + ':' + seconds;
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
// Requirements: 1.1, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 6.1, 6.2, 6.3, 6.4
// ---------------------------------------------------------------------------
const GreetingModule = {
  /** @type {string} The current display name ('' if none set). */
  userName: '',
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
      var suffix = this.userName ? ', ' + this.userName + '!' : '';

      if (greetingEl) greetingEl.textContent = greeting + suffix;

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
   * Loads the saved user name, renders immediately, then schedules a
   * re-render every 60 seconds. Attaches listeners for the Name_Editor.
   *
   * Requirements: 2.1, 2.4, 2.8, 2.9
   */
  init() {
    this.userName = this.loadName();
    this.render();
    var self = this;
    setInterval(function () {
      self.render();
    }, 1000);

    // Name_Editor button listeners
    var editBtn   = document.getElementById('name-edit-btn');
    var saveBtn   = document.getElementById('name-save-btn');
    var cancelBtn = document.getElementById('name-cancel-btn');
    var nameInput = document.getElementById('name-input');

    if (editBtn) {
      editBtn.addEventListener('click', function () {
        self.openEditor();
      });
    }
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var input = document.getElementById('name-input');
        self.saveName(input ? input.value : '');
      });
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        self.closeEditor();
      });
    }
    if (nameInput) {
      // Clear validation message as the user types
      nameInput.addEventListener('input', function () {
        var validationEl = document.getElementById('name-validation');
        if (validationEl) validationEl.textContent = '';
      });
      // Enter to save, Escape to cancel
      nameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          self.saveName(nameInput.value);
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          self.closeEditor();
        }
      });
    }
  },

  // ── Name_Editor methods ───────────────────────────────────────────────────

  /**
   * Read the saved user name from localStorage.
   * Returns '' for any missing or invalid value; never throws.
   *
   * Requirements: 2.4, 6.1, 6.4
   * @returns {string}
   */
  loadName() {
    try {
      var raw = Storage.load('tld_username');
      if (raw === null) return '';
      return validateUsername(raw);
    } catch (e) {
      return '';
    }
  },

  /**
   * Validate and persist a new user name, then re-render the greeting.
   *
   * - If name.trim().length > 50: shows inline validation message and returns.
   * - If name.trim() is empty: clears tld_username from localStorage and sets
   *   this.userName = ''.
   * - Otherwise: saves tld_username and sets this.userName = trimmed name.
   * Always calls this.render() and this.closeEditor() on success.
   *
   * Requirements: 2.2, 2.3, 2.6, 2.7
   * @param {string} name
   */
  saveName(name) {
    var trimmed = (typeof name === 'string') ? name.trim() : '';
    var validationEl = document.getElementById('name-validation');

    if (name.length > 50 || trimmed.length > 50) {
      if (validationEl) validationEl.textContent = 'Name must be 50 characters or fewer.';
      return;
    }

    if (trimmed.length === 0) {
      // Clear the saved name
      localStorage.removeItem('tld_username');
      this.userName = '';
    } else {
      Storage.save('tld_username', trimmed);
      this.userName = trimmed;
    }

    this.render();
    this.closeEditor();
  },

  /**
   * Show the Name_Editor panel and move focus to the name input.
   *
   * Requirements: 2.1, 2.8
   */
  openEditor() {
    var editor = document.getElementById('name-editor');
    var input  = document.getElementById('name-input');
    if (editor) editor.removeAttribute('hidden');
    if (input) {
      input.value = this.userName;
      input.focus();
    }
  },

  /**
   * Hide the Name_Editor panel and clear any validation message.
   *
   * Requirements: 2.9
   */
  closeEditor() {
    var editor      = document.getElementById('name-editor');
    var validationEl = document.getElementById('name-validation');
    if (editor) editor.setAttribute('hidden', '');
    if (validationEl) validationEl.textContent = '';
  }
};

// ---------------------------------------------------------------------------
// TimerModule — state, pure helpers, and render
// Requirements: 3.1, 3.3, 4.5, 4.6, 4.7
// ---------------------------------------------------------------------------

/**
 * Validate a duration value read from localStorage.
 * Returns the integer value if it is a whole number in [1, 99];
 * otherwise returns 25 as the safe default.
 *
 * @param {*} v
 * @returns {number}
 */
function validateDuration(v) {
  var n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 99 ? n : 25;
}

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
  // sessionMinutes: configured session length in minutes (default 25)
  // remaining: seconds left in the current session
  // running:   true while the countdown interval is active
  // intervalId: handle returned by setInterval, or null when stopped
  sessionMinutes: 25,
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
   * Reset the timer to the current session duration.
   * Stops any active countdown, restores remaining to sessionMinutes * 60,
   * hides the end-of-session indicator, and updates the UI.
   *
   * Requirements: 4.4, 3.2
   */
  reset() {
    this.stop();
    this.remaining = this.sessionMinutes * 60;
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
   * Loads the saved session duration, renders the initial UI state,
   * and attaches click handlers to the Start, Stop, Reset, and Set buttons.
   * Also attaches input/keydown listeners to #duration-input.
   *
   * Requirements: 3.1, 3.4, 3.5, 4.1, 4.7
   */
  init() {
    this.sessionMinutes = this.loadDuration();
    this.remaining = this.sessionMinutes * 60;
    this.render();

    var btnStart = document.getElementById('timer-start');
    var btnStop  = document.getElementById('timer-stop');
    var btnReset = document.getElementById('timer-reset');
    var btnDurationSet = document.getElementById('duration-set-btn');
    var durationInput  = document.getElementById('duration-input');

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
    if (btnDurationSet) {
      btnDurationSet.addEventListener('click', function () {
        var input = document.getElementById('duration-input');
        TimerModule.applyDuration(input ? input.value : '');
      });
    }
    if (durationInput) {
      // Clear validation message as the user types
      durationInput.addEventListener('input', function () {
        var validationEl = document.getElementById('duration-validation');
        if (validationEl) validationEl.textContent = '';
      });
      // Enter key triggers applyDuration
      durationInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          TimerModule.applyDuration(durationInput.value);
        }
      });
    }
  },

  // ── Duration methods ──────────────────────────────────────────────────────

  /**
   * Read the saved session duration from localStorage.
   * Returns 25 for any missing or invalid value; never throws.
   *
   * Requirements: 3.4, 3.5, 6.1, 6.4
   * @returns {number}
   */
  loadDuration() {
    try {
      var raw = Storage.load('tld_duration');
      if (raw === null) return 25;
      return validateDuration(raw);
    } catch (e) {
      return 25;
    }
  },

  /**
   * Persist the given session duration to localStorage.
   *
   * Requirements: 3.3, 6.1
   * @param {number} minutes
   */
  saveDuration(minutes) {
    Storage.save('tld_duration', minutes);
  },

  /**
   * Stop any active countdown, set the session duration, and re-render.
   *
   * Requirements: 3.2, 3.8
   * @param {number} minutes  Integer in [1, 99]
   */
  setDuration(minutes) {
    this.stop();
    this.sessionMinutes = minutes;
    this.remaining = minutes * 60;
    this.render();
  },

  /**
   * Parse and validate raw input from the Duration_Input, then apply it.
   * Rejects non-integers, decimals, empty strings, and values outside [1, 99].
   * On rejection: sets #duration-validation text and returns without changing state.
   * On success: clears #duration-validation, calls setDuration and saveDuration.
   *
   * Requirements: 3.1, 3.2, 3.3, 3.6, 3.7
   * @param {string|number} raw
   */
  applyDuration(raw) {
    var validationEl = document.getElementById('duration-validation');
    var n = Number(raw);

    if (!Number.isInteger(n) || n < 1 || n > 99) {
      if (validationEl) {
        validationEl.textContent = 'Please enter a whole number between 1 and 99.';
      }
      return;
    }

    if (validationEl) validationEl.textContent = '';
    this.setDuration(n);
    this.saveDuration(n);
  }
};

// ---------------------------------------------------------------------------
// TaskModule — persistent to-do list
// Requirements: 5.1–5.5, 6.1–6.6, 7.1–7.5, 8.1–8.5, 9.1–9.4
// ---------------------------------------------------------------------------

/**
 * Validate a sort order value read from localStorage.
 * Returns the value unchanged if it is one of the three valid sort orders;
 * otherwise returns 'creation' as the safe default.
 *
 * @param {*} v
 * @returns {'creation'|'alpha'|'status'}
 */
function validateSort(v) {
  return ['creation', 'alpha', 'status'].includes(v) ? v : 'creation';
}

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

  /** @type {'creation'|'alpha'|'status'} The active sort order. */
  sortOrder: 'creation',

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

    var sorted = this.getSortedTasks();
    sorted.forEach(function (task) {
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

      // Clear inline duplicate message as the user types (requirement 4.7)
      editInput.addEventListener('input', function () {
        inlineMsg.textContent = '';
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
   * Check whether any task (other than the one with excludeId) has a
   * description that matches the given string after trimming and
   * lowercasing both sides.
   *
   * Requirements: 4.1, 4.5, 4.8
   *
   * @param {string} description
   * @param {string|null} excludeId  — id of the task being edited, or null when adding
   * @returns {boolean}
   */
  isDuplicate(description, excludeId) {
    var normalised = description.trim().toLowerCase();
    return this.tasks.some(function (t) {
      return t.id !== excludeId && t.description.trim().toLowerCase() === normalised;
    });
  },

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

    if (this.isDuplicate(description, null)) {
      if (validationEl) validationEl.textContent = 'A task with that description already exists.';
      return; // input field is NOT cleared
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

    if (this.isDuplicate(newDescription, id)) {
      if (inlineMsgEl) inlineMsgEl.textContent = 'A task with that description already exists.';
      return;
    }

    var task = this.tasks.find(function (t) { return t.id === id; });
    if (task) {
      task.description = newDescription.trim();
      this.saveTasks();
      this.renderList();
    }
  },

  // ── Sort methods ──────────────────────────────────────────────────────────

  /**
   * Read the saved sort order from localStorage.
   * Returns 'creation' for any missing or invalid value; never throws.
   *
   * Requirements: 5.3, 5.4, 5.5, 6.1, 6.4
   * @returns {'creation'|'alpha'|'status'}
   */
  loadSort() {
    try {
      var raw = Storage.load('tld_sort');
      if (raw === null) return 'creation';
      return validateSort(raw);
    } catch (e) {
      return 'creation';
    }
  },

  /**
   * Persist the given sort order to localStorage.
   *
   * Requirements: 5.3, 6.1
   * @param {'creation'|'alpha'|'status'} order
   */
  saveSort(order) {
    Storage.save('tld_sort', order);
  },

  /**
   * Return a sorted copy of this.tasks according to this.sortOrder.
   *
   * - 'creation': original insertion order ([...this.tasks])
   * - 'alpha': ascending case-insensitive lexicographic order by description
   * - 'status': incomplete tasks first (creation order within group),
   *             then complete tasks (creation order within group)
   *
   * Requirements: 5.1, 5.2, 5.6, 5.7
   * @returns {Array<{ id: string, description: string, completed: boolean }>}
   */
  getSortedTasks() {
    var copy = this.tasks.slice();
    if (this.sortOrder === 'alpha') {
      copy.sort(function (a, b) {
        return a.description.toLowerCase().localeCompare(b.description.toLowerCase());
      });
    } else if (this.sortOrder === 'status') {
      copy.sort(function (a, b) {
        // Incomplete (false) before complete (true); stable within each group
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      });
    }
    // 'creation' — return the copy in original insertion order (no sort needed)
    return copy;
  },

  /**
   * Update the visual active state of the sort buttons.
   * Adds 'sort-btn--active' to the button whose data-sort matches
   * this.sortOrder; removes it from all others.
   *
   * Requirements: 5.8
   */
  updateSortUI() {
    document.querySelectorAll('.sort-btn').forEach(function (btn) {
      if (btn.dataset.sort === TaskModule.sortOrder) {
        btn.classList.add('sort-btn--active');
      } else {
        btn.classList.remove('sort-btn--active');
      }
    });
  },

  // ── Initialisation ────────────────────────────────────────────────────────

  /**
   * Initialise the TaskModule.
   * Loads persisted tasks, renders the list, attaches event listeners.
   */
  init() {
    this.loadTasks();
    this.sortOrder = this.loadSort();
    this.renderList();
    this.updateSortUI();

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

    // Attach sort button listeners
    document.querySelectorAll('.sort-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        TaskModule.sortOrder = btn.dataset.sort;
        TaskModule.saveSort(TaskModule.sortOrder);
        TaskModule.renderList();
        TaskModule.updateSortUI();
      });
    });
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
// ThemeModule — light / dark theme toggle
// Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 6.1, 6.2, 6.3, 6.4
// ---------------------------------------------------------------------------

/**
 * Validate a theme value read from localStorage.
 * Returns the value unchanged if it is 'dark' or 'light';
 * otherwise returns 'dark' as the safe default.
 *
 * @param {*} v
 * @returns {'dark'|'light'}
 */
function validateTheme(v) {
  return (v === 'dark' || v === 'light') ? v : 'dark';
}

const ThemeModule = {
  /** @type {'dark'|'light'} */
  current: 'dark',

  /**
   * Read the saved theme from localStorage.
   * Returns 'dark' for any missing or invalid value; never throws.
   *
   * @returns {'dark'|'light'}
   */
  load() {
    try {
      var raw = Storage.load('tld_theme');
      return validateTheme(raw);
    } catch (e) {
      return 'dark';
    }
  },

  /**
   * Apply the given theme to the document and update the toggle button.
   * Sets data-theme on <html>; updates #theme-toggle aria-label and text.
   *
   * @param {'dark'|'light'} theme
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      if (theme === 'dark') {
        btn.setAttribute('aria-label', 'Switch to Light Mode');
        btn.setAttribute('title', 'Switch to Light Mode');
        btn.textContent = '🌙';
      } else {
        btn.setAttribute('aria-label', 'Switch to Dark Mode');
        btn.setAttribute('title', 'Switch to Dark Mode');
        btn.textContent = '☀️';
      }
    }
  },

  /**
   * Persist the current theme to localStorage via Storage.save.
   */
  save() {
    Storage.save('tld_theme', this.current);
  },

  /**
   * Toggle between 'dark' and 'light', then apply and save.
   */
  toggle() {
    this.current = this.current === 'dark' ? 'light' : 'dark';
    this.apply(this.current);
    this.save();
  },

  /**
   * Initialise the ThemeModule.
   * Loads the saved theme, applies it immediately (before any other module
   * renders) to prevent FOUC, then attaches a click listener to #theme-toggle.
   */
  init() {
    this.current = this.load();
    this.apply(this.current);

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function () {
        ThemeModule.toggle();
      });
    }
  }
};

// ---------------------------------------------------------------------------
// DOMContentLoaded — bootstrap all modules
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  ThemeModule.init(); // MUST be first to prevent FOUC
  GreetingModule.init();
  TimerModule.init();
  TaskModule.init();
  LinkModule.init();
});
