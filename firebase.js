// Конфигурация Firebase в base64
const firebaseConfig = JSON.parse(atob("Y29uc3QgY29uZmlnID0gewogIGFwaUtleTogIkFJemFTeUJrWWZhWFZrR2dZcVpSem9iTFZveVVUODhsNUZIa1hZWSIsCiAgYXV0aERvbWFpbjogImltYWdlb3B0LXByby5maXJlYmFzZWFwcC5jb20iLAogIHByb2plY3RJZDogImltYWdlb3B0LXBybyIsCiAgc3RvcmFnZUJ1Y2tldDogImltYWdlb3B0LXByby5hcHBzcG90LmNvbSIsCiAgbWVzc2FnaW5nU2VuZGVySWQ6ICIxMzU2MTkxNjQ4NjciLAogIGFwcElkOiAiMToxMzU2MTkxNjQ4Njc6d2ViOjIwYWJlNmY5OWFiOWQ0NjhlYWMwNzYiCn07CgpidG9hKEpTT04uc3RyaW5naWZ5KGNvbmZpZykp"));

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