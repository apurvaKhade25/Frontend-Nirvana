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

  document.getElementById('login-general-err').classList.add('hidden');
  document.getElementById('signup-general-err').classList.add('hidden');

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
  const toast = document.createElement('div');
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
  if (textEl) textEl.textContent = message;
  banner.classList.remove('hidden');
}

// ── Clear all errors ──
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  document.getElementById('login-general-err').classList.add('hidden');
  document.getElementById('signup-general-err').classList.add('hidden');
}

function showFieldError(fieldId, errId) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errId).classList.add('show');
}

// ── Reset button to normal state ──
function resetLoginBtn() {
  document.getElementById('login-btn-text').textContent = 'Sign in';
  document.getElementById('login-spinner').classList.add('hidden');
}

function resetSignupBtn() {
  document.getElementById('signup-btn-text').textContent = 'Create account';
  document.getElementById('signup-spinner').classList.add('hidden');
}

// ── Save user and go to dashboard ──
function loginSuccess(token, userInfo) {
  localStorage.setItem('nirvana_token', token);
  localStorage.setItem('nirvana_user', JSON.stringify(userInfo));
  window.location.href = 'dashboard.html';
}

// ============================================
// LOGIN
// ============================================
async function handleLogin() {
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  // Validate
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

  // Try backend with a 5 second timeout
  // If backend is not running, go straight to demo mode
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
      signal:  controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (response.ok) {
      // ✅ Real login success
      const userInfo = data.user || { name: email.split('@')[0], email };
      loginSuccess(data.token, userInfo);

    } else if (response.status === 401 || response.status === 400) {
      // ❌ Wrong credentials — show on screen
      resetLoginBtn();
      showInlineError('login-general-err', 'Invalid email or password. Please try again.');
      document.getElementById('login-email').classList.add('error');
      document.getElementById('login-password').classList.add('error');

    } else {
      // Other server error
      resetLoginBtn();
      showInlineError('login-general-err', data.message || 'Something went wrong. Please try again.');
    }

  } catch (err) {
    // Backend is not running OR timeout — use DEMO MODE
    // This lets you test the frontend without backend
    resetLoginBtn();
    console.warn('Backend not reachable — running in demo mode');
    const fakeUser = { name: email.split('@')[0], email };
    loginSuccess('demo-token-123', fakeUser);
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

  // Validate
  if (!name)                          { showFieldError('signup-name',     'signup-name-err');  valid = false; }
  if (!email || !email.includes('@')) { showFieldError('signup-email',    'signup-email-err'); valid = false; }
  if (!password || password.length < 6) { showFieldError('signup-password', 'signup-pass-err');  valid = false; }
  if (!valid) return;

  // Show loading
  document.getElementById('signup-btn-text').textContent = 'Creating account...';
  document.getElementById('signup-spinner').classList.remove('hidden');

  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
      signal:  controller.signal
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    if (response.ok) {
      // ✅ Real signup success
      const userInfo = data.user || { name, email };
      loginSuccess(data.token, userInfo);

    } else if (response.status === 409) {
      // Email already exists
      resetSignupBtn();
      showInlineError('signup-general-err', 'This email is already registered. Try logging in instead.');
      document.getElementById('signup-email').classList.add('error');

    } else {
      resetSignupBtn();
      showInlineError('signup-general-err', data.message || 'Something went wrong. Please try again.');
    }

  } catch (err) {
    // Demo mode
    resetSignupBtn();
    console.warn('Backend not reachable — running in demo mode');
    const fakeUser = { name, email };
    loginSuccess('demo-token-123', fakeUser);
  }
}

// ── Skip login page if already logged in ──
const existingToken = localStorage.getItem('nirvana_token');
if (existingToken && existingToken !== 'null' && existingToken !== 'undefined') {
  window.location.href = 'dashboard.html';
}

// ── Press Enter to submit ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginVisible = !document.getElementById('form-login').classList.contains('hidden');
    if (loginVisible) handleLogin();
    else handleSignup();
  }
});
</script>