// Initialize on page load
document.addEventListener('DOMContentLoaded', initAuth);

function initAuth() {
  // Check authentication state
  firebase.auth().onAuthStateChanged(user => {
    if (user && user.uid !== "guest") {
      window.location.href = "index.html";
    }
  });

  // Enter key handlers
  document.getElementById("email")?.addEventListener("keypress", e => {
    if (e.key === "Enter") signIn();
  });
  
  document.getElementById("password")?.addEventListener("keypress", e => {
    if (e.key === "Enter") signIn();
  });
}

async function signUp() {
  const email = sanitizeInput(document.getElementById("email").value);
  const password = document.getElementById("password").value;
  
  // Validation
  if (!validateEmail(email)) {
    return showMessage("Invalid email format", "error");
  }
  
  if (password.length < 6) {
    return showMessage("Password must be at least 6 characters", "error");
  }
  
  const btn = document.querySelector('button[onclick="signUp()"]');
  toggleButtonState(btn, true);
  
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    // Create user record in Firestore
    await firebase.firestore().collection("users").doc(userCredential.user.uid).set({ 
      premium: false,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showMessage("Registration successful! Redirecting...", "success");
    setTimeout(() => window.location.href = "pay.html", 1500);
  } catch (error) {
    handleAuthError(error, "signup");
  } finally {
    toggleButtonState(btn, false);
  }
}

async function signIn() {
  const email = sanitizeInput(document.getElementById("email").value);
  const password = document.getElementById("password").value;
  
  const btn = document.querySelector('button[onclick="signIn()"]');
  toggleButtonState(btn, true);
  
  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    
    // Get user data
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(userCredential.user.uid)
      .get();

    const userData = userDoc.data() || { premium: false };
    
    // Save data to localStorage
    localStorage.setItem('premiumUser', userData.premium);
    localStorage.setItem('userId', userCredential.user.uid);
    localStorage.setItem('userEmail', userData.email || email);
    
    showMessage("Login successful! Redirecting...", "success");
    setTimeout(() => window.location.href = "index.html", 1000);
  } catch (error) {
    handleAuthError(error, "signin");
  } finally {
    toggleButtonState(btn, false);
  }
}

function resetPassword() {
  let email = sanitizeInput(document.getElementById("email").value);
  
  if (!email) {
    email = prompt("Enter your email to reset password:");
    if (!email) return;
  }
  
  if (!validateEmail(email)) {
    return showMessage("Please enter a valid email", "error");
  }
  
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showMessage("Password reset email sent to your address!", "success");
    })
    .catch(error => {
      console.error("Reset error:", error);
      showMessage(`Error: ${error.message}`, "error");
    });
}

// Helper functions
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  if (!messageDiv) return;
  
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = "block";
  
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

function toggleButtonState(btn, isLoading) {
  if (!btn) return;
  
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

function handleAuthError(error, context) {
  const errorMap = {
    'signup': {
      'auth/email-already-in-use': "Email already in use",
      'auth/invalid-email': "Invalid email format",
      'auth/weak-password': "Password is too weak",
      'default': "Registration error"
    },
    'signin': {
      'auth/user-not-found': "User not found",
      'auth/wrong-password': "Incorrect password",
      'auth/invalid-email': "Invalid email format",
      'auth/user-disabled': "Account disabled",
      'default': "Login error"
    }
  };
  
  const message = errorMap[context][error.code] || 
                errorMap[context]['default'] || 
                error.message;
  
  showMessage(message, "error");
}

// Enhanced XSS protection using DOMPurify
function sanitizeInput(input) {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Disallow all HTML tags
    ALLOWED_ATTR: []  // Disallow all attributes
  });
}