const loginView = document.getElementById("loginView");
const mainView = document.getElementById("mainView");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const startNfcBtn = document.getElementById("startNfcBtn");
const statusEl = document.getElementById("status");
const currentUserName = document.getElementById("currentUserName");

const STORAGE_KEY = "mock.currentUser";

const state = {
  currentUser: null,
  currentToken: null,
};

function loadUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}

function updateStatus(message, isSuccess) {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  statusEl.classList.add(isSuccess ? "success" : "error");
}

function showLogin() {
  loginView.classList.remove("hidden");
  mainView.classList.add("hidden");
}

function showMain() {
  loginView.classList.add("hidden");
  mainView.classList.remove("hidden");
}

function handleInputChange() {
  loginBtn.disabled = usernameInput.value.trim() === "" || passwordInput.value.trim() === "";
}

function mockLogin() {
  state.currentUser = {
    userId: crypto.randomUUID(),
    userName: usernameInput.value.trim(),
  };
  saveUser(state.currentUser);
  currentUserName.textContent = state.currentUser.userName;
  updateStatus("Ready to start NFC binding.", true);
  showMain();
}

function mockLogout() {
  state.currentUser = null;
  clearUser();
  usernameInput.value = "";
  passwordInput.value = "";
  handleInputChange();
  showLogin();
}

function buildPayload() {
  return {
    type: "bind",
    token: state.currentToken,
    version: 1,
  };
}

async function startBinding() {
  state.currentToken = crypto.randomUUID();
  updateStatus("NFC session started. Ready to scan.", true);

  // Web NFC is only supported on some Android devices and Chrome-based browsers.
  if ("NDEFReader" in window) {
    try {
      const ndef = new NDEFReader();
      await ndef.write({
        records: [
          {
            recordType: "mime",
            mediaType: "application/json",
            data: JSON.stringify(buildPayload()),
          },
        ],
      });

      updateStatus("NFC write success!", true);
      state.currentToken = null;
      return;
    } catch (error) {
      updateStatus(`NFC write failed: ${error.message}`, false);
      state.currentToken = null;
      return;
    }
  }

  // Fallback: mock a successful write when Web NFC isn't available.
  setTimeout(() => {
    updateStatus(
      "Web NFC not available in this browser. Mock write completed (no tag needed).",
      true
    );
    state.currentToken = null;
  }, 600);
}

loginBtn.addEventListener("click", mockLogin);
logoutBtn.addEventListener("click", mockLogout);
startNfcBtn.addEventListener("click", startBinding);
usernameInput.addEventListener("input", handleInputChange);
passwordInput.addEventListener("input", handleInputChange);

// Initialize app state on load.
state.currentUser = loadUser();
if (state.currentUser) {
  currentUserName.textContent = state.currentUser.userName;
  showMain();
  updateStatus("Ready to start NFC binding.", true);
} else {
  showLogin();
}
