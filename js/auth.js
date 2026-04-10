// ============================================
// auth.js — Login & Signup Logic
// ============================================
(function cleanupInvalidTokens() {
  const token = localStorage.getItem('nirvana_token');
  if (token === 'demo-token-123' || token === null || token === 'undefined') {
    console.warn('🧹 Clearing invalid token...');
    localStorage.removeItem('nirvana_token');
    localStorage.removeItem('nirvana_user');
  }
})();
// ---- IMPORTANT: Change this when your friend gives you the backend URL ----
const API_BASE = 'http://localhost:8080';
// ---------------------------------------------------------------------------

// Show login or signup tab
function showTab(tab) {
  const loginForm  = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const loginTab   = document.getElementById('tab-login');
  const signupTab  = document.getElementById('tab-signup');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.style.background    = 'var(--white)';
    loginTab.style.color         = 'var(--text-dark)';
    loginTab.style.boxShadow     = 'var(--shadow-sm)';
    signupTab.style.background   = 'transparent';
    signupTab.style.color        = 'var(--text-soft)';
    signupTab.style.boxShadow    = 'none';
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupTab.style.background   = 'var(--white)';
    signupTab.style.color        = 'var(--text-dark)';
    signupTab.style.boxShadow    = 'var(--shadow-sm)';
    loginTab.style.background    = 'transparent';
    loginTab.style.color         = 'var(--text-soft)';
    loginTab.style.boxShadow     = 'none';
  }
}

// Show a toast notification
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : ''}`;
  const icon = type === 'error' ? '❌' : '✅';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Clear all errors
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.form-input').forEach(el => el.classList.remove('error'));
}

// Show an error on a field
function showError(fieldId, errId) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errId).classList.add('show');
}

// ---- LOGIN ----
async function handleLogin() {
  clearErrors();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  let valid = true;

  if (!email || !email.includes('@')) {
    showError('login-email', 'login-email-err');
    valid = false;
  }

  if (!password) {
    showError('login-password', 'login-pass-err');
    valid = false;
  }

  if (!valid) return;

  // Show spinner
  document.getElementById('login-btn-text').textContent = 'Signing in...';
  document.getElementById('login-spinner').classList.remove('hidden');

  try {

    console.log('🔐 Attempting login with:', { email });
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' ,'Accept': 'application/json'},
      body: JSON.stringify({ email, password })
    });
     console.log('📡 Response status:', response.status);
    const responseText = await response.text();
    console.log('📦 Raw response:', responseText.substring(0, 100) + '...');

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed as JSON:', data);
    } catch (e) {
      // Backend returned raw JWT token instead of JSON
      console.log('⚠️ Response is not JSON, treating as raw JWT token');
      if (response.ok && responseText.includes('.')) {
        // It's a JWT token
        data = { token: responseText };
      } else {
        throw new Error('Invalid response format');
      }
    }
    // const data = await response.json();

    if (response.ok) {
        console.log('✅ Login successful, saving token...');
      // Save the token and user info
      localStorage.setItem('nirvana_token', data.token);
      // localStorage.setItem('nirvana_user', JSON.stringify(data.user));
      localStorage.setItem('nirvana_user', JSON.stringify({
      email: email,
      username: data.user?.username || email.split('@')[0],         //username
      id: data.user?.id || null
      }));
      showToast('Welcome back! 🌿');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } else {
      showToast(data.message || 'Invalid email or password.', 'error');
    }

  } catch (err) {
    // This runs when backend is not connected yet
    // For now, save a fake token so you can test the UI
    console.error(err);
  //   showToast('Server error. Check backend connection.', 'error');
  //   console.warn('Backend not connected. Using demo mode.');
  //   const fakeUser = { name: 'Demo User', email: email };
  //   localStorage.setItem('nirvana_token', 'demo-token-123');
  //   localStorage.setItem('nirvana_user', JSON.stringify(fakeUser));
  //   showToast('Demo mode: logged in! 🌿');
  //   setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
  // } finally {
  //   document.getElementById('login-btn-text').textContent = 'Sign in';
  //   document.getElementById('login-spinner').classList.add('hidden');
  } finally {
    document.getElementById('login-btn-text').textContent = 'Sign in';
    document.getElementById('login-spinner').classList.add('hidden');
}
}

// ---- SIGNUP ----      edited 
async function handleSignup() {
  clearErrors();
  const username = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  let valid = true;

  if (!username) {
    showError('signup-name', 'signup-name-err');
    valid = false;
  }

  if (!email || !email.includes('@')) {
    showError('signup-email', 'signup-email-err');
    valid = false;
  }

  if (!password || password.length < 6) {
    showError('signup-password', 'signup-pass-err');
    valid = false;
  }

  if (!valid) return;

  document.getElementById('signup-btn-text').textContent = 'Creating account...';
  document.getElementById('signup-spinner').classList.remove('hidden');

  try {
    console.log('📝 Attempting registration:', { username, email, password: '***' });
    
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });

    console.log('📡 Response status:', response.status);
    const responseText = await response.text();
    console.log('📦 Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed response:', data);
    } catch (e) {
      if (response.ok && responseText.includes('.')) {
        data = { token: responseText };
      } else {
        throw new Error('Invalid response: ' + responseText);
      }
    }

    if (response.ok) {
  localStorage.setItem('nirvana_token', data.token);

  // ✅ Safe user object — same pattern as login, never stores null
  localStorage.setItem('nirvana_user', JSON.stringify({
    email: email,
    username: data.user?.username || username || email.split('@')[0],
    id: data.user?.id || null
  }));
  showToast('Account created! Welcome to Nirvana 🌿');
  setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    } else {
      console.error('❌ Registration failed:', data);
      showToast(data.message || 'Registration failed.', 'error');
    }

  } catch (err) {
    // ⚠️ NO DEMO MODE HERE - SHOW REAL ERROR!
    console.error('❌ Registration error:', err);
    showToast('Error: ' + err.message, 'error');
  } finally {
    document.getElementById('signup-btn-text').textContent = 'Create account';
    document.getElementById('signup-spinner').classList.add('hidden');
  }
}



// If user is already logged in, skip login page
(function checkExistingSession() {
  const token = localStorage.getItem('nirvana_token');
  
  // Only redirect if token exists AND is not a demo token
  if (token && token !== 'demo-token-123' && token.includes('.')) {
    console.log('✅ Valid token found, redirecting to dashboard...');
    window.location.href = 'dashboard.html';
  }
})();

// Allow pressing Enter to submit
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginVisible = !document.getElementById('form-login').classList.contains('hidden');
    if (loginVisible) handleLogin();
    else handleSignup();
  }
});