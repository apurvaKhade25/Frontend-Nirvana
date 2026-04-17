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

// ── Toast ──
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

// ── Inline error banner ──
function showInlineError(bannerId, message) {
  const banner = document.getElementById(bannerId);
  const textEl = document.getElementById(bannerId + '-text');
  if (banner) {
    if (textEl) textEl.textContent = message;
    banner.classList.remove('hidden');
  }
}

// ── Clear errors ──
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
  const loginErr  = document.getElementById('login-general-err');
  const signupErr = document.getElementById('signup-general-err');
  if (loginErr)  loginErr.classList.add('hidden');
  if (signupErr) signupErr.classList.add('hidden');
}

function showFieldError(fieldId, errId) {
  const f = document.getElementById(fieldId);
  const e = document.getElementById(errId);
  if (f) f.classList.add('error');
  if (e) e.classList.add('show');
}

function resetLoginBtn() {
  document.getElementById('login-btn-text').textContent = 'Sign in';
  document.getElementById('login-spinner').classList.add('hidden');
}

function resetSignupBtn() {
  document.getElementById('signup-btn-text').textContent = 'Create account';
  document.getElementById('signup-spinner').classList.add('hidden');
}

// ══════════════════════════════════════════
// KEY FUNCTION: Extract name from backend response
// Spring Boot can return name in many different places
// We check ALL of them so username never shows as "Friend"
// ══════════════════════════════════════════
function extractName(data, fallbackEmail, fallbackName) {
  // Check every possible location Spring Boot might put the name
  const name =
    // Direct on response object
    data.name       ||
    data.username   ||
    data.fullName   ||
    data.full_name  ||
    data.displayName||
    // Inside a nested user/account object
    (data.user     && (data.user.name || data.user.username || data.user.fullName || data.user.full_name)) ||
    (data.account  && (data.account.name || data.account.username)) ||
    (data.profile  && (data.profile.name || data.profile.username)) ||
    // Fall back to email prefix or the name typed at signup
    (fallbackEmail ? fallbackEmail.split('@')[0] : null) ||
    fallbackName   ||
    'User';

  return String(name).trim();
}

// ══════════════════════════════════════════
// Save token + user then redirect to dashboard
// Verifies localStorage write before redirecting
// ══════════════════════════════════════════
function saveAndRedirect(token, userInfo) {
  localStorage.setItem('nirvana_token', token);
  localStorage.setItem('nirvana_user', JSON.stringify(userInfo));

  // Verify write completed before redirecting
  const saved = localStorage.getItem('nirvana_token');
  if (saved && saved !== 'null' && saved !== 'undefined') {
    window.location.replace('dashboard.html');
  } else {
    setTimeout(() => window.location.replace('dashboard.html'), 300);
  }
}

// ════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════
async function handleLogin() {
  clearErrors();

  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!email || !email.includes('@')) { showFieldError('login-email',    'login-email-err'); valid = false; }
  if (!password)                       { showFieldError('login-password', 'login-pass-err');  valid = false; }
  if (!valid) return;

  document.getElementById('login-btn-text').textContent = 'Signing in...';
  document.getElementById('login-spinner').classList.remove('hidden');

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
      signal:  controller.signal
    });

    clearTimeout(timeout);

    // Log the full response so we can see what backend returns
    const data = await response.json();
    console.log('Login response from backend:', data);

    if (response.ok) {
      const userName = extractName(data, email, 'User');
      const userInfo = { name: userName, email: email };
      console.log('Saving user:', userInfo);
      resetLoginBtn();
      saveAndRedirect(data.token, userInfo);

    } else if (response.status === 401 || response.status === 400) {
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
    resetLoginBtn();
    console.warn('Backend not reachable — demo mode. Error:', err.message);
    const fakeUser = { name: email.split('@')[0], email };
    saveAndRedirect('demo-token-123', fakeUser);
  }
}

// ════════════════════════════════════════════
// SIGNUP
// ════════════════════════════════════════════
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
    console.log('Signup response from backend:', data);

    if (response.ok) {
      // Use the name the user typed if backend doesn't return it
      const userName = extractName(data, email, name);
      const userInfo = { name: userName, email: email };
      console.log('Saving user after signup:', userInfo);
      resetSignupBtn();
      showToast('Account created! Welcome to Nirvana 🌿');
      setTimeout(() => saveAndRedirect(data.token, userInfo), 800);

    } else if (response.status === 409) {
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
    resetSignupBtn();
    console.warn('Backend not reachable — demo mode. Error:', err.message);
    // In demo mode use the name they typed — never use "Friend"
    const fakeUser = { name: name, email: email };
    showToast('Account created! Welcome to Nirvana 🌿');
    setTimeout(() => saveAndRedirect('demo-token-123', fakeUser), 800);
  }
}

// ── Skip login if already logged in ──
(function checkExistingSession() {
  const token = localStorage.getItem('nirvana_token');
  if (token && token !== '' && token !== 'null' && token !== 'undefined') {
    window.location.replace('dashboard.html');
  }
})();

// ── Enter key submits ──
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginVisible = !document.getElementById('form-login').classList.contains('hidden');
    if (loginVisible) handleLogin();
    else handleSignup();
  }
});
