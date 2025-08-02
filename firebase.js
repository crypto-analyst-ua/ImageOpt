[file name]: firebase.js
[file content begin]
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Конфигурация PayPal
const paypalConfig = {
  clientId: "ATnZIAG3susq8624ujWJL8C5iu3D_1C6lQeYkuESE8VE_v7qonBxxeSFICHlY3dOq9XQD8GwAHne2Uwf",
  currency: "USD"
};

// Экспорт для использования в других файлах
window.firebaseConfig = firebaseConfig;
window.paypalConfig = paypalConfig;
window.auth = auth;
window.db = db;
[file content end]