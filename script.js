import { auth } from './firebase.js';
import { onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const btn = document.getElementById('homeButton');

let currentUser = null;

onAuthStateChanged(auth, function(user) {
    currentUser = user;
    const nameSpan = document.querySelector('.profile span');
    if (nameSpan) {
        nameSpan.textContent = user ? (user.email.split('@')[0]) : 'Sign In';
    }
});

btn.addEventListener('click', function() {
    if (currentUser) {
        window.location.href = 'tool.html';
    } else {
        window.location.href = 'login.html?redirect=index.html';
    }
});
