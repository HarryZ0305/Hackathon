import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCHTafFTnh8O3b2AH1K54oOxuzLMzutL4E",
    authDomain: "hakathon-2026.firebaseapp.com",
    databaseURL: "https://hakathon-2026-default-rtdb.firebaseio.com",
    projectId: "hakathon-2026",
    storageBucket: "hakathon-2026.firebasestorage.app",
    messagingSenderId: "909528413417",
    appId: "1:909528413417:web:ab0d52870763228f12ec78",
    measurementId: "G-GRCB9FXS3C"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
