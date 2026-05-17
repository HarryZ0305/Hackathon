import { db } from './firebase.js';
import { ref, get, update }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const fields = ['fullName', 'gradeYear', 'bio', 'education', 'experience', 'skills', 'interests'];
const status = document.getElementById('status');
const saveBtn = document.getElementById('saveBtn');
const logoutBtn = document.getElementById('logoutBtn');

const username = sessionStorage.getItem('username');
if (!username) {
    window.location.href = 'login.html?redirect=about.html';
}

const userRef = ref(db, 'users/' + username);

(async function load() {
    const snap = await get(userRef);
    const data = snap.exists() ? snap.val() : {};
    fields.forEach(function(name) {
        const el = document.getElementById(name);
        if (el && data[name]) el.value = data[name];
    });
})();

saveBtn.addEventListener('click', async function() {
    saveBtn.disabled = true;
    status.style.color = 'green';
    status.textContent = 'Saving...';

    const payload = {};
    fields.forEach(function(name) {
        payload[name] = document.getElementById(name).value.trim();
    });

    try {
        await update(userRef, payload);
        status.textContent = 'Saved.';
    } catch (err) {
        status.style.color = 'red';
        status.textContent = 'Save failed: ' + err.message;
    } finally {
        saveBtn.disabled = false;
    }
});

logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('username');
    window.location.href = 'index.html';
});
