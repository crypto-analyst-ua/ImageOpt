// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkYfaXVkGgYqZRzobLVoyUT88l5FHkXYY",
  authDomain: "imageopt-pro.firebaseapp.com",
  projectId: "imageopt-pro",
  storageBucket: "imageopt-pro.appspot.com",
  messagingSenderId: "135619164867",
  appId: "1:135619164867:web:20abe6f99ab9d468eac076"
};

// Проверка инициализации Firebase
let app;
let auth;
let db;

if (!firebase.apps.length) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}

auth = firebase.auth();
db = firebase.firestore();

// Экспорт для использования в других файлах
window.auth = auth;
window.db = db;