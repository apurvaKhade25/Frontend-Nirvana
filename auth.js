const API_BASE = "http://localhost:8080";

/* =========================
   🚀 LOGIN FUNCTION
========================= */
async function handleLogin() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const btnText = document.getElementById("login-btn-text");
  const spinner = document.getElementById("login-spinner");

  clearMessage();

  if (!email || !password) {
    showError("Please fill all fields");
    return;
  }

  btnText.textContent = "Signing in...";
  spinner.classList.remove("hidden");

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Invalid email or password ❌");
      return;
    }

    // ✅ SAVE
    localStorage.setItem("nirvana_token", data.token);
    localStorage.setItem("nirvana_user", JSON.stringify(data.user));

    showSuccess("Login successful ✅");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 800);

  } catch (err) {
    showError("Server error. Try again later.");
  } finally {
    btnText.textContent = "Sign in";
    spinner.classList.add("hidden");
  }
}

/* =========================
   📝 SIGNUP FUNCTION
========================= */
async function handleSignup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  const btnText = document.getElementById("signup-btn-text");
  const spinner = document.getElementById("signup-spinner");

  clearMessage();

  if (!name || !email || !password) {
    showError("Please fill all fields");
    return;
  }

  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }

  btnText.textContent = "Creating account...";
  spinner.classList.remove("hidden");

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Registration failed ❌");
      return;
    }

    showSuccess("Account created 🎉");

    setTimeout(() => {
      showTab('login');
    }, 800);

  } catch (err) {
    showError("Server error. Try again.");
  } finally {
    btnText.textContent = "Create account";
    spinner.classList.add("hidden");
  }
}

/* =========================
   ❌ ERROR
========================= */
function showError(msg) {
  const el = document.getElementById("error-msg");
  el.innerText = msg;
  el.style.display = "block";
  el.style.color = "#ff4d4f";
}

/* =========================
   ✅ SUCCESS
========================= */
function showSuccess(msg) {
  const el = document.getElementById("error-msg");
  el.innerText = msg;
  el.style.display = "block";
  el.style.color = "#16a34a";
}

/* =========================
   🧹 CLEAR MESSAGE
========================= */
function clearMessage() {
  const el = document.getElementById("error-msg");
  el.style.display = "none";
}

/* =========================
   🔐 CHECK LOGIN
========================= */
function checkAuth() {
  const token = localStorage.getItem("nirvana_token");
  if (!token) {
    window.location.href = "index.html";
  }
}

/* =========================
   🚪 LOGOUT
========================= */
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}