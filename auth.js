
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      document.getElementById("message").innerText = "Реєстрація успішна!";
      // За замовчуванням статус — без преміуму
      db.collection("users").doc(userCredential.user.uid).set({ premium: false });
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}

function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("message").innerText = "Вхід виконано!";
      window.location.href = "index.html";
    })
    .catch((error) => {
      document.getElementById("message").innerText = error.message;
    });
}
