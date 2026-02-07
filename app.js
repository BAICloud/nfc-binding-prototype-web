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

const mockUsers = [
  { userId: "U1001", userName: "alice", password: "alice123", leftEar: "LE-A1-42", rightEar: "RE-A1-57" },
  { userId: "U1002", userName: "ben", password: "ben12345", leftEar: "LE-B2-18", rightEar: "RE-B2-90" },
  { userId: "U1003", userName: "coco", password: "coco888", leftEar: "LE-C3-07", rightEar: "RE-C3-61" },
  { userId: "U1004", userName: "danny", password: "danny321", leftEar: "LE-D4-55", rightEar: "RE-D4-08" },
  { userId: "U1005", userName: "emma", password: "emma456", leftEar: "LE-E5-33", rightEar: "RE-E5-12" },
  { userId: "U1006", userName: "frank", password: "frank007", leftEar: "LE-F6-84", rightEar: "RE-F6-27" },
  { userId: "U1007", userName: "grace", password: "grace999", leftEar: "LE-G7-19", rightEar: "RE-G7-73" },
  { userId: "U1008", userName: "harry", password: "harry321", leftEar: "LE-H8-62", rightEar: "RE-H8-44" },
  { userId: "U1009", userName: "irene", password: "irene111", leftEar: "LE-I9-11", rightEar: "RE-I9-26" },
  { userId: "U1010", userName: "jack", password: "jack222", leftEar: "LE-J10-59", rightEar: "RE-J10-05" },
  { userId: "U1011", userName: "kelly", password: "kelly333", leftEar: "LE-K11-47", rightEar: "RE-K11-68" },
  { userId: "U1012", userName: "leo", password: "leo444", leftEar: "LE-L12-22", rightEar: "RE-L12-38" },
  { userId: "U1013", userName: "mia", password: "mia555", leftEar: "LE-M13-96", rightEar: "RE-M13-14" },
  { userId: "U1014", userName: "nico", password: "nico666", leftEar: "LE-N14-09", rightEar: "RE-N14-82" },
  { userId: "U1015", userName: "olivia", password: "olivia777", leftEar: "LE-O15-66", rightEar: "RE-O15-41" },
  { userId: "U1016", userName: "peter", password: "peter888", leftEar: "LE-P16-28", rightEar: "RE-P16-93" },
  { userId: "U1017", userName: "queen", password: "queen999", leftEar: "LE-Q17-74", rightEar: "RE-Q17-20" },
  { userId: "U1018", userName: "rose", password: "rose000", leftEar: "LE-R18-63", rightEar: "RE-R18-36" },
  { userId: "U1019", userName: "sam", password: "sam111", leftEar: "LE-S19-52", rightEar: "RE-S19-77" },
  { userId: "U1020", userName: "tina", password: "tina222", leftEar: "LE-T20-31", rightEar: "RE-T20-49" },
];

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
  const userName = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const match = mockUsers.find(
    (user) => user.userName === userName && user.password === password
  );

  if (!match) {
    updateStatus("Login failed: username or password incorrect.", false);
    return;
  }

  state.currentUser = {
    userId: match.userId,
    userName: match.userName,
    leftEar: match.leftEar,
    rightEar: match.rightEar,
  };
  saveUser(state.currentUser);
  currentUserName.textContent = state.currentUser.userName;
  updateStatus("Ready to start NFC binding.", true);
  showMain();
  renderUserProfile();
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
    userId: state.currentUser?.userId ?? null,
    leftEar: state.currentUser?.leftEar ?? null,
    rightEar: state.currentUser?.rightEar ?? null,
  };
}

async function startBinding() {
  if (!state.currentUser) {
    updateStatus("Please login before starting NFC binding.", false);
    return;
  }
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

function renderUserProfile() {
  const userIdEl = document.getElementById("userId");
  const leftEarEl = document.getElementById("leftEar");
  const rightEarEl = document.getElementById("rightEar");

  if (!userIdEl || !leftEarEl || !rightEarEl) return;

  userIdEl.textContent = state.currentUser?.userId ?? "-";
  leftEarEl.textContent = state.currentUser?.leftEar ?? "-";
  rightEarEl.textContent = state.currentUser?.rightEar ?? "-";
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
  renderUserProfile();
} else {
  showLogin();
}
