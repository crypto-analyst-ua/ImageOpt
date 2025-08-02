function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById("message").innerText = "Реєстрація успішна!";
      // Устанавливаем статус премиум по умолчанию
      db.collection("users").doc(userCredential.user.uid).set({ 
        premium: false 
      });
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  auth.signInWithEmailAndPassword(email, password)
    .then(async (userCredential) => {
      // Проверяем премиум-статус
      const userDoc = await db.collection("users").doc(userCredential.user.uid).get();
      const isPremium = userDoc.exists ? userDoc.data().premium || false : false;
      
      // Сохраняем статус в localStorage
      localStorage.setItem('premiumUser', isPremium);
      
      document.getElementById("message").innerText = "Вхід виконано!";
      window.location.href = "index.html";
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}
