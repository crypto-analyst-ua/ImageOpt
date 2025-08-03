// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initAuth);

function initAuth() {
  // Проверка состояния аутентификации
  firebase.auth().onAuthStateChanged(user => {
    if (user && user.uid !== "guest") {
      window.location.href = "index.html";
    }
  });

  // Обработчики Enter
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
  
  // Валидация
  if (!validateEmail(email)) {
    return showMessage("Некоректний email", "error");
  }
  
  if (password.length < 6) {
    return showMessage("Пароль повинен містити принаймні 6 символів", "error");
  }
  
  const btn = document.querySelector('button[onclick="signUp()"]');
  toggleButtonState(btn, true);
  
  try {
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    
    // Создаем запись пользователя в Firestore
    await firebase.firestore().collection("users").doc(userCredential.user.uid).set({ 
      premium: false,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showMessage("Реєстрація успішна! Перенаправляємо...", "success");
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
    
    // Получаем данные пользователя
    const userDoc = await firebase.firestore()
      .collection('users')
      .doc(userCredential.user.uid)
      .get();

    const userData = userDoc.data() || { premium: false };
    
    // Сохраняем данные в localStorage
    localStorage.setItem('premiumUser', userData.premium);
    localStorage.setItem('userId', userCredential.user.uid);
    localStorage.setItem('userEmail', userData.email || email);
    
    showMessage("Вхід виконано! Перенаправляємо...", "success");
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
    email = prompt("Введіть ваш email для відновлення пароля:");
    if (!email) return;
  }
  
  if (!validateEmail(email)) {
    return showMessage("Будь ласка, введіть коректний email", "error");
  }
  
  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      showMessage("Лист для відновлення пароля відправлено на вашу пошту!", "success");
    })
    .catch(error => {
      console.error("Помилка відновлення:", error);
      showMessage(`Помилка: ${error.message}`, "error");
    });
}

// Вспомогательные функции
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
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Завантаження...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

function handleAuthError(error, context) {
  const errorMap = {
    'signup': {
      'auth/email-already-in-use': "Цей email вже використовується",
      'auth/invalid-email': "Некоректний email",
      'auth/weak-password': "Пароль занадто слабкий",
      'default': "Помилка реєстрації"
    },
    'signin': {
      'auth/user-not-found': "Користувача не знайдено",
      'auth/wrong-password': "Невірний пароль",
      'auth/invalid-email': "Некоректний email",
      'auth/user-disabled': "Акаунт вимкнено",
      'default': "Помилка входу"
    }
  };
  
  const message = errorMap[context][error.code] || 
                errorMap[context]['default'] || 
                error.message;
  
  showMessage(message, "error");
}

// Защита от XSS
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}