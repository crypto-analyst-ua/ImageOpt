function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  // Валидация email
  if (!validateEmail(email)) {
    showMessage("Некоректний email", "error");
    return;
  }
  
  // Валидация пароля
  if (password.length < 6) {
    showMessage("Пароль повинен містити принаймні 6 символів", "error");
    return;
  }
  
  const btn = document.querySelector('button[onclick="signUp()"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Завантаження...";
  
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      showMessage("Реєстрація успішна!", "success");
      
      // Устанавливаем статус премиум по умолчанию
      firebase.firestore().collection("users").doc(userCredential.user.uid).set({ 
        premium: false 
      }).then(() => {
        // Редирект на страницу оплаты после регистрации
        setTimeout(() => {
          window.location.href = "pay.html";
        }, 2000);
      });
    })
    .catch((error) => {
      let message = "Помилка реєстрації";
      switch (error.code) {
        case "auth/email-already-in-use":
          message = "Цей email вже використовується";
          break;
        case "auth/invalid-email":
          message = "Некоректний email";
          break;
        case "auth/weak-password":
          message = "Пароль занадто слабкий";
          break;
        default:
          message = error.message;
      }
      showMessage(message, "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    });
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  const btn = document.querySelector('button[onclick="signIn()"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Завантаження...";
  
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      // Проверяем премиум-статус
      const userDoc = await firebase.firestore().collection('users').doc(userCredential.user.uid).get();
      const isPremium = userDoc.exists ? userDoc.data().premium || false : false;
      
      // Сохраняем статус в localStorage
      localStorage.setItem('premiumUser', isPremium);
      localStorage.setItem('userId', userCredential.user.uid);
      
      showMessage("Вхід виконано!", "success");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    })
    .catch((error) => {
      let message = "Помилка входу";
      switch (error.code) {
        case "auth/user-not-found":
          message = "Користувача не знайдено";
          break;
        case "auth/wrong-password":
          message = "Невірний пароль";
          break;
        case "auth/invalid-email":
          message = "Некоректний email";
          break;
        default:
          message = error.message;
      }
      showMessage(message, "error");
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    });
}

// Валидация email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Показать сообщение
function showMessage(text, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = text;
  messageDiv.className = type;
  messageDiv.style.display = "block";
  
  // Автоскрытие сообщения через 5 секунд
  setTimeout(() => {
    messageDiv.style.display = "none";
  }, 5000);
}

// Экспорт функций для использования в HTML
window.signUp = signUp;
window.signIn = signIn;
window.resetPassword = resetPassword;
window.validateEmail = validateEmail;
window.showMessage = showMessage;