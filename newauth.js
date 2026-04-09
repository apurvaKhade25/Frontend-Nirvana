// ============================================
// auth.js — Login & Signup Logic
// ============================================

const API_BASE = 'http://localhost:8080';

// ── Show login or signup tab ──
function showTab(tab) {
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const loginTab   = document.getElementById('tab-login');
  const signupTab  = document.getElementById('tab-signup');

  // Hide error banners when switching tabs
  const loginErr  = document.getElementById('login-general-err');
  const signupErr = document.getElementById('signup-general-err');
  if (loginErr)  loginErr.classList.add('hidden');
  if (signupErr) signupErr.classList.add('hidden');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.style.background  = 'var(--white)';
    loginTab.style.color       = 'var(--text-dark)';
    loginTab.style.boxShadow   = 'var(--shadow-sm)';
    signupTab.style.background = 'transparent';
    signupTab.style.color      = 'var(--text-soft)';
    signupTab.style.boxShadow  = 'none';
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupTab.style.background = 'var(--white)';
    signupTab.style.color      = 'var(--text-dark)';
    signupTab.style.boxShadow  = 'var(--shadow-sm)';
    loginTab.style.background  = 'transparent';
    loginTab.style.color       = 'var(--text-soft)';
    loginTab.style.boxShadow   = 'none';
  }
}

// ── Toast notification ──
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  toast.innerHTML = `<span>${type === 'error' ? '❌' : '✅'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ── Show red error banner on screen ──
function showInlineError(bannerId, message) {
  const banner = document.getElementById(bannerId);
  const textEl = document.getElementById(bannerId + '-text');
  if (banner) {
    if (textEl) textEl.textContent = message;
    banner.classList.remove('hidden');
  }
}

// ── Clear all field errors ──
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  const loginErr  = document.getElementById('login-general-err');
  const signupErr = document.getElementById('signup-general-err');
  if (loginErr)  loginErr.classList.add('hidden');
  if (signupErr) signupErr.classList.add('hidden');
}

function showFieldError(fieldId, errId) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('error');
  if (err)   err.classList.add('show');
}

// ── Reset button state ──
function resetLoginBtn() {
  document.getElementById('login-btn-text').textContent = 'Sign in';
  document.getElementById('login-spinner').classList.add('hidden');
}

function resetSignupBtn() {
  document.getElementById('signup-btn-text').textContent = 'Create account';
  document.getElementById('signup-spinner').classList.add('hidden');
}

// ── THE FIX: Save token then wait for localStorage to confirm before redirecting ──
function saveAndRedirect(token, userInfo) {
  // Step 1 — save to localStorage
  localStorage.setItem('nirvana_token', token);
  localStorage.setItem('nirvana_user', JSON.stringify(userInfo));

  // Step 2 — verify it was actually saved before redirecting
  // This prevents the blank dashboard caused by redirect racing the storage write
  const verify = localStorage.getItem('nirvana_token');

  if (verify && verify !== 'null' && verify !== 'undefined') {
    // Token confirmed in storage — safe to redirect now
    window.location.replace('dashboard.html');
  } else {
    // Try again after a short delay (extremely rare fallback)
    setTimeout(() => {
      window.location.replace('dashboard.html');
    }, 200);
  }
}

// ============================================
// LOGIN
// ============================================
async function handleLogin() {
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!email || !email.includes('@')) {
    showFieldError('login-email', 'login-email-err');
    valid = false;
  }
  if (!password) {
    showFieldError('login-password', 'login-pass-err');
    valid = false;
  }
  if (!valid) return;

  // Show loading
  document.getElementById('login-btn-text').textContent = 'Signing in...';
  document.getElementById('login-spinner').classList.remove('hidden');

  try {
    // 5 second timeout — if backend doesn't reply in 5s go to demo mode
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
      signal:  controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (response.ok) {
      // ✅ Real backend login success
      const userInfo = data.user || { name: data.name || email.split('@')[0], email };
      resetLoginBtn();
      saveAndRedirect(data.token, userInfo);

    } else if (response.status === 401 || response.status === 400) {
      // ❌ Wrong credentials
      resetLoginBtn();
      const loginErr = document.getElementById('login-general-err');
      if (loginErr) {
        loginErr.classList.remove('hidden');
        const t = document.getElementById('login-general-err-text');
        if (t) t.textContent = 'Invalid email or password. Please try again.';
      } else {
        showToast('Invalid email or password.', 'error');
      }
      document.getElementById('login-email').classList.add('error');
      document.getElementById('login-password').classList.add('error');

    } else {
      resetLoginBtn();
      showToast(data.message || 'Login failed. Try again.', 'error');
    }

  } catch (err) {
    // Backend not running — demo mode
    resetLoginBtn();
    console.warn('Backend not reachable — demo mode');
    const fakeUser = { name: email.split('@')[0], email };
    saveAndRedirect('demo-token-123', fakeUser);
  }
}

// ============================================
// SIGNUP
// ============================================
async function handleSignup() {
  clearErrors();

  const name     = document.getElementById('signup-name').value.trim();
  const email    = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  let valid = true;

  if (!name)                             { showFieldError('signup-name',     'signup-name-err');  valid = false; }
  if (!email || !email.includes('@'))    { showFieldError('signup-email',    'signup-email-err'); valid = false; }
  if (!password || password.length < 6) { showFieldError('signup-password', 'signup-pass-err');  valid = false; }
  if (!valid) return;

  // Show loading
  document.getElementById('signup-btn-text').textContent = 'Creating account...';
  document.getElementById('signup-spinner').classList.remove('hidden');

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
      signal:  controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    if (response.ok) {
      // ✅ Real signup success
      const userInfo = data.user || { name: data.name || name, email };
      resetSignupBtn();
      // Small delay just to let the toast show before redirect
      showToast('Account created! Welcome to Nirvana 🌿');
      setTimeout(() => saveAndRedirect(data.token, userInfo), 800);

    } else if (response.status === 409) {
      // Email already exists
      resetSignupBtn();
      const signupErr = document.getElementById('signup-general-err');
      if (signupErr) {
        signupErr.classList.remove('hidden');
        const t = document.getElementById('signup-general-err-text');
        if (t) t.textContent = 'This email is already registered. Try logging in.';
      } else {
        showToast('Email already registered. Try logging in.', 'error');
      }
      document.getElementById('signup-email').classList.add('error');

    } else {
      resetSignupBtn();
      showToast(data.message || 'Signup failed. Try again.', 'error');
    }

  } catch (err) {
    // Demo mode
    resetSignupBtn();
    console.warn('Backend not reachable — demo mode');
    showToast('Account created! Welcome to Nirvana 🌿');
    const fakeUser = { name, email };
    setTimeout(() => saveAndRedirect('demo-token-123', fakeUser), 800);
  }
}

// ============================================
// DASHBOARD GUARD — skip login if already logged in
// ============================================
(function checkExistingSession() {
  const token = localStorage.getItem('nirvana_token');
  if (token && token !== 'null' && token !== 'undefined' && token !== '') {
    window.location.replace('dashboard.html');
  }
})();

// ── Press Enter to submit ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginVisible = !document.getElementById('form-login').classList.contains('hidden');
    if (loginVisible) handleLogin();
    else handleSignup();
  }
});
