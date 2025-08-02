// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkYfaXVkGgYqZRzobLVoyUT88l5FHkXYY",
  authDomain: "imageopt-pro.firebaseapp.com",
  projectId: "imageopt-pro",
  storageBucket: "imageopt-pro.appspot.com",
  messagingSenderId: "135619164867",
  appId: "1:135619164867:web:20abe6f99ab9d468eac076"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = app.auth();
const db = app.firestore();

// Экспорт для использования в других файлах
window.auth = auth;
window.db = db; 