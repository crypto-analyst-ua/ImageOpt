function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  // Валидация email
  if (!validateEmail(email)) {
    document.getElementById("message").innerText = "Некоректний email";
    document.getElementById("message").className = "error";
    return;
  }
  
  // Валидация пароля
  if (password.length < 6) {
    document.getElementById("message").innerText = "Пароль повинен містити принаймні 6 символів";
    document.getElementById("message").className = "error";
    return;
  }
  
  const btn = document.querySelector('button[onclick="signUp()"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Завантаження...";
  
  window.auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById("message").innerText = "Реєстрація успішна!";
      document.getElementById("message").className = "success";
      
      // Устанавливаем статус премиум по умолчанию
      window.db.collection("users").doc(userCredential.user.uid).set({ 
        premium: false 
      });
      
      // Автоматический вход после регистрации
      setTimeout(() => signIn(), 1500);
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
      }
      document.getElementById("message").innerText = message;
      document.getElementById("message").className = "error";
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
  
  window.auth.signInWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      // Проверяем премиум-статус
      const userDoc = await window.db.collection('users').doc(userCredential.user.uid).get();
      const isPremium = userDoc.exists ? userDoc.data().premium || false : false;
      
      // Сохраняем статус в localStorage
      localStorage.setItem('premiumUser', isPremium);
      localStorage.setItem('userId', userCredential.user.uid);
      
      document.getElementById("message").innerText = "Вхід виконано!";
      document.getElementById("message").className = "success";
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
      }
      document.getElementById("message").innerText = message;
      document.getElementById("message").className = "error";
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

// Экспорт функций для использования в HTML
window.signUp = signUp;
window.signIn = signIn; 