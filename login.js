import { db } from './firebase.js';
import { ref, get, set }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorMsg.textContent = '';
    submitBtn.disabled = true;

    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!/^[a-z0-9_]{2,20}$/.test(username)) {
        errorMsg.textContent = 'Username: 2-20 letters, digits, or underscores.';
        submitBtn.disabled = false;
        return;
    }
    if (password.length < 1) {
        errorMsg.textContent = 'Password required.';
        submitBtn.disabled = false;
        return;
    }

    try {
        const userRef = ref(db, 'users/' + username);
        const snap = await get(userRef);

        if (!snap.exists()) {
            await set(userRef, {
                username: username,
                password: password,
                createdAt: Date.now()
            });
        } else {
            if (snap.val().password !== password) {
                errorMsg.textContent = 'Wrong password.';
                submitBtn.disabled = false;
                return;
            }
        }

        sessionStorage.setItem('username', username);

        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || 'index.html';
        window.location.href = redirect;
    } catch (err) {
        errorMsg.textContent = 'Something went wrong: ' + err.message;
        submitBtn.disabled = false;
    }
});
