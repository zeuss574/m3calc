/**
 * Material 3 Expressive Calculator Application Controller
 * Handles user interactions, reactivity, dynamic theme palettes,
 * keyboard shortcuts, memory registers, history tape, and M3 ripple effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Instantiate calculation engine
  const engine = new CalculatorEngine();

  // ==========================================================================
  // DOM Elements
  // ==========================================================================
  const htmlEl = document.documentElement;
  const calculatorApp = document.querySelector('.calculator-app');
  const displayInput = document.getElementById('displayInput');
  const displayPreview = document.getElementById('displayPreview');
  const displayHistory = document.getElementById('displayHistory');
  const errorBanner = document.getElementById('errorBanner');
  const errorMessage = document.getElementById('errorMessage');
  const memoryStatus = document.getElementById('memoryStatus');

  // Layout mode switcher (Basic vs Full buttons)
  const viewBasicBtn = document.getElementById('viewBasicBtn');
  const viewFullBtn = document.getElementById('viewFullBtn');
  const layoutBadge = document.getElementById('layoutBadge');

  // Device Dark Mode inspection & theme selectors
  const deviceModalBackdrop = document.getElementById('deviceModalBackdrop');
  const closeDeviceModalBtn = document.getElementById('closeDeviceModalBtn');
  const syncDeviceBtn = document.getElementById('syncDeviceBtn');
  const toggleThemeModalBtn = document.getElementById('toggleThemeModalBtn');
  const deviceStatusValue = document.getElementById('deviceStatusValue');
  const activeAppModeText = document.getElementById('activeAppModeText');
  const deviceSyncState = document.getElementById('deviceSyncState');
  const openDeviceInspectorBtn = document.getElementById('openDeviceInspectorBtn');
  const dropdownAutoText = document.getElementById('dropdownAutoText');
  const themeModeOptions = document.querySelectorAll('.theme-mode-option');

  // Angle pills
  const degBtn = document.getElementById('degBtn');
  const radBtn = document.getElementById('radBtn');
  const gradBtn = document.getElementById('gradBtn');

  // Memory buttons
  const memClearBtn = document.getElementById('memClearBtn');
  const memRecallBtn = document.getElementById('memRecallBtn');

  // Inverse toggle
  const invBtn = document.getElementById('invBtn');
  const btnSin = document.getElementById('btnSin');
  const btnCos = document.getElementById('btnCos');
  const btnTan = document.getElementById('btnTan');
  const btnLn = document.getElementById('btnLn');
  const btnLog = document.getElementById('btnLog');
  const btnSqrt = document.getElementById('btnSqrt');

  // Header controls
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');
  const themePickerBtn = document.getElementById('themePickerBtn');
  const themeDropdown = document.getElementById('themeDropdown');
  const modeToggleBtn = document.getElementById('modeToggleBtn');
  const modeIcon = document.getElementById('modeIcon');
  const helpBtn = document.getElementById('helpBtn');
  const historyDrawerBtn = document.getElementById('historyDrawerBtn');
  const historyBadgeCount = document.getElementById('historyBadgeCount');

  // Drawers and Modals
  const drawerBackdrop = document.getElementById('drawerBackdrop');
  const historyDrawer = document.getElementById('historyDrawer');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyList = document.getElementById('historyList');

  const helpModalBackdrop = document.getElementById('helpModalBackdrop');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDoneBtn = document.getElementById('modalDoneBtn');

  const toastNotice = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  // Mobile toggle
  const mobileScientificToggle = document.getElementById('mobileScientificToggle');
  const scientificPanel = document.getElementById('scientificPanel');
  const scientificChevron = document.getElementById('scientificChevron');

  // ==========================================================================
  // Application State & System Device Query
  // ==========================================================================
  let expression = '0';
  let lastEvaluated = false;
  let isInverse = false;
  let history = [];
  let toastTimeout = null;

  // Media query for device dark mode
  const darkModeMediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  // Load persisted settings
  const savedTheme = localStorage.getItem('calc_color_palette') || 'violet';
  const savedThemeChoice = localStorage.getItem('calc_theme_choice') || 'auto';
  const savedLayout = localStorage.getItem('calc_layout_mode') || 'full';
  const savedAngle = localStorage.getItem('calc_angle_mode') || 'DEG';
  const savedSound = localStorage.getItem('calc_sound_enabled');
  const savedHistory = localStorage.getItem('calc_history');
  const savedMemory = localStorage.getItem('calc_memory');

  let themeModeChoice = savedThemeChoice;
  let calcLayoutMode = savedLayout;

  // Apply restored settings
  setPalette(savedTheme);
  setLayoutMode(calcLayoutMode, false);
  setThemeModeChoice(themeModeChoice);
  setAngleUnit(savedAngle);

  if (savedSound !== null) {
    const isSnd = savedSound === 'true';
    window.soundEngine.toggleSound(isSnd);
    updateSoundUI(isSnd);
  }

  if (savedHistory) {
    try {
      history = JSON.parse(savedHistory);
      updateHistoryUI();
    } catch {
      history = [];
    }
  }

  if (savedMemory) {
    const memVal = parseFloat(savedMemory);
    if (!isNaN(memVal) && memVal !== 0) {
      engine.memory = memVal;
      updateMemoryUI();
    }
  }

  // ==========================================================================
  // Display & UI Updating
  // ==========================================================================
  function updateDisplay() {
    displayInput.textContent = expression;

    // Adjust font size based on expression length
    const len = expression.length;
    displayInput.classList.remove('compact', 'ultra-compact');
    if (len > 18) {
      displayInput.classList.add('ultra-compact');
    } else if (len > 11) {
      displayInput.classList.add('compact');
    }

    // Hide error banner when modifying expression
    hideError();

    // Auto calculate live preview
    updatePreview();
  }

  function updatePreview() {
    if (lastEvaluated || expression === '0' || !expression.trim()) {
      displayPreview.textContent = '';
      return;
    }

    const preview = engine.tryEvaluatePreview(expression);
    if (preview !== null && isFinite(preview)) {
      displayPreview.textContent = `= ${engine.formatResult(preview)}`;
    } else {
      displayPreview.textContent = '';
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.add('show');
    window.soundEngine.playKey('backspace');
  }

  function hideError() {
    errorBanner.classList.remove('show');
  }

  function showToast(message, icon = 'check_circle') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastMsg.textContent = message;
    toastIcon.textContent = icon;
    toastNotice.classList.add('show');
    toastTimeout = setTimeout(() => {
      toastNotice.classList.remove('show');
    }, 2500);
  }

  // ==========================================================================
  // Angle Unit Management
  // ==========================================================================
  function setAngleUnit(mode) {
    engine.setAngleMode(mode);
    localStorage.setItem('calc_angle_mode', mode);

    [degBtn, radBtn, gradBtn].forEach(btn => {
      const match = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-checked', match ? 'true' : 'false');
    });

    updatePreview();
  }

  degBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    setAngleUnit('DEG');
  });
  radBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    setAngleUnit('RAD');
  });
  gradBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    setAngleUnit('GRAD');
  });

  // ==========================================================================
  // Memory Management
  // ==========================================================================
  function updateMemoryUI() {
    const hasMem = engine.memory !== 0;
    memClearBtn.disabled = !hasMem;
    memRecallBtn.disabled = !hasMem;
    if (hasMem) {
      memoryStatus.textContent = `M = ${engine.formatResult(engine.memory)}`;
      memoryStatus.classList.add('visible');
    } else {
      memoryStatus.classList.remove('visible');
    }
    localStorage.setItem('calc_memory', engine.memory.toString());
  }

  function getCurrentNumericValue() {
    try {
      return engine.evaluate(expression);
    } catch {
      return 0;
    }
  }

  document.querySelectorAll('.memory-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      window.soundEngine.playKey('function');
      const action = pill.dataset.action;

      switch (action) {
        case 'mc':
          engine.memory = 0;
          updateMemoryUI();
          showToast('Memory Cleared (MC)', 'delete');
          break;
        case 'mr':
          if (engine.memory !== 0) {
            insertText(engine.memory.toString());
          }
          break;
        case 'm-plus': {
          const val = getCurrentNumericValue();
          engine.memory += val;
          updateMemoryUI();
          showToast(`Added to Memory: +${engine.formatResult(val)}`);
          break;
        }
        case 'm-minus': {
          const val = getCurrentNumericValue();
          engine.memory -= val;
          updateMemoryUI();
          showToast(`Subtracted from Memory: -${engine.formatResult(val)}`);
          break;
        }
        case 'ms': {
          const val = getCurrentNumericValue();
          engine.memory = val;
          updateMemoryUI();
          showToast(`Stored in Memory: ${engine.formatResult(val)}`, 'save');
          break;
        }
      }
    });
  });

  // ==========================================================================
  // Inverse Functions (INV) Toggle
  // ==========================================================================
  function toggleInverse() {
    isInverse = !isInverse;
    invBtn.classList.toggle('inv-active', isInverse);

    if (isInverse) {
      btnSin.querySelector('.btn-text').innerHTML = 'sin<sup>-1</sup>';
      btnCos.querySelector('.btn-text').innerHTML = 'cos<sup>-1</sup>';
      btnTan.querySelector('.btn-text').innerHTML = 'tan<sup>-1</sup>';
      btnLn.querySelector('.btn-text').innerHTML = 'e<sup>x</sup>';
      btnLog.querySelector('.btn-text').innerHTML = '10<sup>x</sup>';
      btnSqrt.querySelector('.btn-text').innerHTML = 'x<sup>2</sup>';
    } else {
      btnSin.querySelector('.btn-text').textContent = 'sin';
      btnCos.querySelector('.btn-text').textContent = 'cos';
      btnTan.querySelector('.btn-text').textContent = 'tan';
      btnLn.querySelector('.btn-text').textContent = 'ln';
      btnLog.querySelector('.btn-text').textContent = 'log';
      btnSqrt.querySelector('.btn-text').textContent = '√';
    }
  }

  invBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    toggleInverse();
  });

  // ==========================================================================
  // Expression Modification & Actions
  // ==========================================================================
  function insertText(str) {
    const isOperator = ['+', '−', '×', '÷', '^', '%'].includes(str);

    if (lastEvaluated) {
      if (isOperator) {
        expression = 'Ans' + str;
      } else {
        expression = str;
      }
      lastEvaluated = false;
    } else {
      if (expression === '0') {
        if (str === '.') {
          expression = '0.';
        } else if (isOperator) {
          expression = '0' + str;
        } else {
          expression = str;
        }
      } else {
        expression += str;
      }
    }
    updateDisplay();
  }

  function handleBackspace() {
    window.soundEngine.playKey('backspace');
    if (lastEvaluated) {
      expression = '0';
      lastEvaluated = false;
      updateDisplay();
      return;
    }

    if (expression.length <= 1) {
      expression = '0';
    } else {
      // Check if ending with a function like 'sin(', 'sqrt(', 'asin(', etc.
      const funcMatch = expression.match(/(asin|acos|atan|sinh|cosh|tanh|sqrt|cbrt|abs|nPr|nCr|sin|cos|tan|log|ln|10\^)\($/);
      if (funcMatch) {
        expression = expression.slice(0, -funcMatch[0].length);
      } else if (expression.endsWith('Ans') || expression.endsWith('RND')) {
        expression = expression.slice(0, -3);
      } else {
        expression = expression.slice(0, -1);
      }
      if (!expression) expression = '0';
    }
    updateDisplay();
  }

  function handleClear() {
    window.soundEngine.playKey('clear');
    expression = '0';
    lastEvaluated = false;
    updateDisplay();
  }

  function handleAllClear() {
    window.soundEngine.playKey('clear');
    expression = '0';
    displayHistory.textContent = '';
    displayPreview.textContent = '';
    lastEvaluated = false;
    hideError();
    updateDisplay();
  }

  function handleEquals() {
    if (!expression || expression === '0') return;

    try {
      const rawExpr = expression;
      const res = engine.evaluate(rawExpr);

      window.soundEngine.playKey('equals');

      const formattedResult = engine.formatResult(res);

      // Save to History
      addHistoryItem(rawExpr, formattedResult);

      // Show in history line
      displayHistory.textContent = `${rawExpr} =`;

      // Set main display to result
      expression = formattedResult.replace(/,/g, '');
      lastEvaluated = true;
      displayPreview.textContent = '';
      updateDisplay();
    } catch (err) {
      showError(err.message || 'Syntax Error');
    }
  }

  function handleNegate() {
    window.soundEngine.playKey('function');
    if (expression === '0') return;

    // If whole expression is numeric, toggle sign
    if (/^-?\d+(\.\d+)?$/.test(expression)) {
      if (expression.startsWith('-')) {
        expression = expression.slice(1);
      } else {
        expression = '-' + expression;
      }
    } else {
      // Wrap in - ( ... )
      expression = `-(${expression})`;
    }
    updateDisplay();
  }

  function handleReciprocal() {
    window.soundEngine.playKey('function');
    if (expression === '0') {
      showError('Cannot divide by zero');
      return;
    }
    expression = `1/(${expression})`;
    updateDisplay();
  }

  // ==========================================================================
  // Button Click Handler & Ripple Injection
  // ==========================================================================
  document.querySelectorAll('.m3-btn').forEach(btn => {
    // Add dynamic ripple effect
    btn.addEventListener('pointerdown', (e) => {
      createRipple(e, btn);
    });

    btn.addEventListener('click', () => {
      // Audio feedback based on button role
      if (btn.classList.contains('m3-btn-number')) {
        window.soundEngine.playKey('number');
      } else if (btn.classList.contains('m3-btn-operator')) {
        window.soundEngine.playKey('operator');
      } else if (btn.classList.contains('m3-btn-scientific')) {
        window.soundEngine.playKey('function');
      }

      // Check actions
      const action = btn.dataset.action;
      if (action) {
        switch (action) {
          case 'equals': handleEquals(); break;
          case 'ac': handleAllClear(); break;
          case 'c': handleClear(); break;
          case 'backspace': handleBackspace(); break;
          case 'negate': handleNegate(); break;
          case 'reciprocal': handleReciprocal(); break;
        }
        return;
      }

      // Check text insertion (supports INV switch)
      let insertValue = btn.dataset.insert;
      if (isInverse && btn.dataset.invInsert) {
        insertValue = btn.dataset.invInsert;
      }

      if (insertValue) {
        insertText(insertValue);
      }
    });
  });

  // Material 3 Touch Ripple Generator
  function createRipple(event, button) {
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.classList.add('m3-ripple');

    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 550);
  }

  // ==========================================================================
  // History Tape Management
  // ==========================================================================
  function addHistoryItem(expr, result) {
    const item = {
      id: Date.now(),
      expr,
      result,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    history.unshift(item);
    if (history.length > 50) history.pop();

    localStorage.setItem('calc_history', JSON.stringify(history));
    updateHistoryUI();
  }

  function updateHistoryUI() {
    historyBadgeCount.textContent = history.length;
    historyBadgeCount.style.display = history.length > 0 ? 'flex' : 'none';

    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty-state">
          <span class="material-symbols-rounded history-empty-icon">history_toggle_off</span>
          <p>No calculation history yet.<br>Perform calculations to see them recorded here.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-id="${item.id}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-size: 0.72rem; color: var(--md-sys-color-outline); font-family: var(--font-family-mono);">${item.timestamp}</span>
          <button class="copy-item-btn icon-pill-btn" style="width: 28px; height: 28px;" title="Copy Result" data-copy="${item.result}">
            <span class="material-symbols-rounded" style="font-size: 16px;">content_copy</span>
          </button>
        </div>
        <div class="history-item-expr">${item.expr} =</div>
        <div class="history-item-result">${item.result}</div>
      </div>
    `).join('');

    // Clicking an item loads it back into calculator
    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.copy-item-btn')) return;
        const itemId = parseInt(el.dataset.id, 10);
        const found = history.find(h => h.id === itemId);
        if (found) {
          expression = found.result.replace(/,/g, '');
          displayHistory.textContent = `${found.expr} =`;
          lastEvaluated = true;
          updateDisplay();
          closeDrawer();
          showToast('Loaded from history');
        }
      });
    });

    // Copy buttons
    historyList.querySelectorAll('.copy-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const textToCopy = btn.dataset.copy.replace(/,/g, '');
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Copied to clipboard: ' + textToCopy);
        });
      });
    });
  }

  function openDrawer() {
    historyDrawer.classList.add('open');
    drawerBackdrop.classList.add('open');
    drawerBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    historyDrawer.classList.remove('open');
    drawerBackdrop.classList.remove('open');
    drawerBackdrop.setAttribute('aria-hidden', 'true');
  }

  historyDrawerBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    openDrawer();
  });

  closeDrawerBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    closeDrawer();
  });

  drawerBackdrop.addEventListener('click', closeDrawer);

  clearHistoryBtn.addEventListener('click', () => {
    if (history.length === 0) return;
    window.soundEngine.playKey('clear');
    history = [];
    localStorage.removeItem('calc_history');
    updateHistoryUI();
    showToast('History cleared', 'delete');
  });

  // ==========================================================================
  // Layout Switcher (Basic Keypad vs Full Scientific Keypad)
  // ==========================================================================
  function setLayoutMode(mode, showFeedback = true) {
    calcLayoutMode = mode;
    calculatorApp.setAttribute('data-calc-mode', mode);
    localStorage.setItem('calc_layout_mode', mode);

    const isBasic = mode === 'basic';
    viewBasicBtn.classList.toggle('active', isBasic);
    viewBasicBtn.setAttribute('aria-checked', isBasic ? 'true' : 'false');
    viewFullBtn.classList.toggle('active', !isBasic);
    viewFullBtn.setAttribute('aria-checked', !isBasic ? 'true' : 'false');

    if (layoutBadge) {
      layoutBadge.textContent = isBasic ? 'Basic' : 'Full';
    }

    if (showFeedback) {
      window.soundEngine.playKey('function');
      showToast(isBasic ? 'Switched to Basic Calculator Keypad' : 'Switched to Full Scientific Keypad', isBasic ? 'grid_view' : 'science');
    }
  }

  viewBasicBtn.addEventListener('click', () => {
    setLayoutMode('basic');
  });

  viewFullBtn.addEventListener('click', () => {
    setLayoutMode('full');
  });

  // ==========================================================================
  // Color Palette & Dark Mode Management (with Device Auto-Detection)
  // ==========================================================================
  function setPalette(palette) {
    htmlEl.setAttribute('data-color-palette', palette);
    localStorage.setItem('calc_color_palette', palette);

    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.palette === palette);
    });
  }

  function getDeviceDarkMode() {
    return Boolean(darkModeMediaQuery && darkModeMediaQuery.matches);
  }

  function updateDeviceDiagnosticsUI() {
    const isDeviceDark = getDeviceDarkMode();
    const effectiveAppMode = htmlEl.getAttribute('data-theme-mode') || 'light';

    // Circular dark mode button icon reflects active theme
    if (modeIcon) {
      modeIcon.textContent = effectiveAppMode === 'dark' ? 'dark_mode' : 'light_mode';
    }
    if (modeToggleBtn) {
      modeToggleBtn.classList.toggle('active', effectiveAppMode === 'dark');
      modeToggleBtn.title = `Theme: ${effectiveAppMode.toUpperCase()} (Device uses ${isDeviceDark ? 'DARK' : 'LIGHT'}) - Click to toggle`;
    }

    if (dropdownAutoText) {
      dropdownAutoText.textContent = isDeviceDark ? 'Auto (Device: Dark)' : 'Auto (Device: Light)';
    }

    // Modal elements
    if (deviceStatusValue) {
      deviceStatusValue.textContent = isDeviceDark ? 'Dark Mode (Active)' : 'Light Mode (Active)';
      deviceStatusValue.style.backgroundColor = isDeviceDark ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-secondary-container)';
      deviceStatusValue.style.color = isDeviceDark ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-secondary-container)';
    }
    if (activeAppModeText) {
      activeAppModeText.textContent = effectiveAppMode === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
    if (deviceSyncState) {
      deviceSyncState.textContent = themeModeChoice === 'auto' ? 'Auto (Synchronized with Device)' : 'Manual Override';
    }
  }

  function setThemeModeChoice(choice, notify = false) {
    themeModeChoice = choice;
    localStorage.setItem('calc_theme_choice', choice);

    let effectiveMode = 'light';
    const isDeviceDark = getDeviceDarkMode();
    if (choice === 'auto') {
      effectiveMode = isDeviceDark ? 'dark' : 'light';
    } else if (choice === 'dark') {
      effectiveMode = 'dark';
    } else {
      effectiveMode = 'light';
    }

    htmlEl.setAttribute('data-theme-mode', effectiveMode);

    themeModeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.themeChoice === choice);
    });

    updateDeviceDiagnosticsUI();

    if (notify) {
      const modeLabels = {
        auto: `Auto Sync (Device is ${isDeviceDark ? 'DARK' : 'LIGHT'})`,
        light: `Light Mode ${isDeviceDark ? '(Device is Dark)' : '(Matches Device)'}`,
        dark: `Dark Mode ${isDeviceDark ? '(Matches Device)' : '(Device is Light)'}`
      };
      showToast(`Theme: ${modeLabels[choice] || choice}`, effectiveMode === 'dark' ? 'dark_mode' : 'light_mode');
    }
  }

  // Device Dark Mode listener for real-time OS/browser changes
  if (darkModeMediaQuery) {
    darkModeMediaQuery.addEventListener('change', (e) => {
      updateDeviceDiagnosticsUI();
      if (themeModeChoice === 'auto') {
        const newMode = e.matches ? 'dark' : 'light';
        htmlEl.setAttribute('data-theme-mode', newMode);
        showToast(`Device switched to ${newMode.toUpperCase()} mode (Auto-applied)`, newMode === 'dark' ? 'dark_mode' : 'light_mode');
      }
    });
  }

  // Open & Close Device Inspector Modal
  function openDeviceModal() {
    updateDeviceDiagnosticsUI();
    deviceModalBackdrop.classList.add('open');
    deviceModalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeDeviceModal() {
    deviceModalBackdrop.classList.remove('open');
    deviceModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  if (openDeviceInspectorBtn) {
    openDeviceInspectorBtn.addEventListener('click', () => {
      window.soundEngine.playKey('function');
      themeDropdown.classList.remove('show');
      openDeviceModal();
    });
  }

  closeDeviceModalBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    closeDeviceModal();
  });

  deviceModalBackdrop.addEventListener('click', (e) => {
    if (e.target === deviceModalBackdrop) closeDeviceModal();
  });

  syncDeviceBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    setThemeModeChoice('auto', true);
    closeDeviceModal();
  });

  toggleThemeModalBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    const current = htmlEl.getAttribute('data-theme-mode') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setThemeModeChoice(next, true);
  });

  // Theme dropdown mode options
  themeModeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.id === 'openDeviceInspectorBtn') return;
      window.soundEngine.playKey('function');
      setThemeModeChoice(opt.dataset.themeChoice, true);
      themeDropdown.classList.remove('show');
    });
  });

  // Circular Dark Mode Toggle Button (Uniform 40x40 circle, same as others)
  modeToggleBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    const current = htmlEl.getAttribute('data-theme-mode') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    setThemeModeChoice(next, true);
  });

  themePickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.soundEngine.playKey('function');
    themeDropdown.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!themePickerBtn.contains(e.target) && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove('show');
    }
  });

  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      window.soundEngine.playKey('function');
      setPalette(opt.dataset.palette);
      themeDropdown.classList.remove('show');
      showToast(`Palette changed: ${opt.dataset.palette.toUpperCase()}`, 'palette');
    });
  });

  // Audio Toggle
  function updateSoundUI(enabled) {
    soundToggleBtn.classList.toggle('active', enabled);
    soundIcon.textContent = enabled ? 'volume_up' : 'volume_off';
  }

  soundToggleBtn.addEventListener('click', () => {
    const isNow = window.soundEngine.toggleSound();
    localStorage.setItem('calc_sound_enabled', isNow.toString());
    updateSoundUI(isNow);
    showToast(isNow ? 'Sound Effects Enabled' : 'Sound Effects Muted', isNow ? 'volume_up' : 'volume_off');
  });

  // Shortcuts Modal
  helpBtn.addEventListener('click', () => {
    window.soundEngine.playKey('function');
    helpModalBackdrop.classList.add('open');
    helpModalBackdrop.setAttribute('aria-hidden', 'false');
  });

  function closeModal() {
    helpModalBackdrop.classList.remove('open');
    helpModalBackdrop.setAttribute('aria-hidden', 'true');
  }

  closeModalBtn.addEventListener('click', closeModal);
  modalDoneBtn.addEventListener('click', closeModal);
  helpModalBackdrop.addEventListener('click', (e) => {
    if (e.target === helpModalBackdrop) closeModal();
  });

  // Mobile scientific panel expander
  if (mobileScientificToggle) {
    mobileScientificToggle.addEventListener('click', () => {
      window.soundEngine.playKey('function');
      const expanded = scientificPanel.classList.toggle('expanded');
      scientificChevron.textContent = expanded ? 'expand_less' : 'expand_more';
    });
  }

  // ==========================================================================
  // Comprehensive Keyboard Handling
  // ==========================================================================
  window.addEventListener('keydown', (e) => {
    // If modal or drawer open, handle escape
    if (e.key === 'Escape') {
      if (helpModalBackdrop.classList.contains('open')) {
        closeModal();
        return;
      }
      if (deviceModalBackdrop && deviceModalBackdrop.classList.contains('open')) {
        closeDeviceModal();
        return;
      }
      if (historyDrawer.classList.contains('open')) {
        closeDrawer();
        return;
      }
      handleAllClear();
      return;
    }

    // Ignore if typing in another input (if any)
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key >= '0' && e.key <= '9') {
      insertText(e.key);
      window.soundEngine.playKey('number');
    } else if (e.key === '.') {
      insertText('.');
      window.soundEngine.playKey('number');
    } else if (e.key === '+') {
      insertText('+');
      window.soundEngine.playKey('operator');
    } else if (e.key === '-') {
      insertText('−');
      window.soundEngine.playKey('operator');
    } else if (e.key === '*') {
      insertText('×');
      window.soundEngine.playKey('operator');
    } else if (e.key === '/') {
      e.preventDefault();
      insertText('÷');
      window.soundEngine.playKey('operator');
    } else if (e.key === '^') {
      insertText('^');
      window.soundEngine.playKey('operator');
    } else if (e.key === '%') {
      insertText('%');
      window.soundEngine.playKey('operator');
    } else if (e.key === '(' || e.key === ')') {
      insertText(e.key);
      window.soundEngine.playKey('function');
    } else if (e.key === '!') {
      insertText('!');
      window.soundEngine.playKey('function');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
      insertText('sqrt(');
      window.soundEngine.playKey('function');
    } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
      insertText('π');
      window.soundEngine.playKey('function');
    } else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) {
      insertText('e');
      window.soundEngine.playKey('function');
    } else if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
      if (historyDrawer.classList.contains('open')) closeDrawer();
      else openDrawer();
    } else if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
      modeToggleBtn.click();
    } else if (e.key.toLowerCase() === 'b' && !e.ctrlKey && !e.metaKey) {
      setLayoutMode('basic');
    } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
      setLayoutMode('full');
    } else if (e.key.toLowerCase() === 'a' && !e.ctrlKey && !e.metaKey) {
      setThemeModeChoice('auto', true);
    }
  });

  // Initial display setup
  updateDisplay();
});
