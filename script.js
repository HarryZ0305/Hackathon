import { db } from './firebase.js';
import { ref, get }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const btn = document.getElementById('homeButton');
const fields = ['fullName', 'gradeYear', 'bio', 'education', 'experience', 'skills', 'interests'];

const username = sessionStorage.getItem('username');
const nameSpan = document.querySelector('.profile span');
if (nameSpan) {
    nameSpan.textContent = username || 'Sign In';
}

btn.addEventListener('click', async function() {
    if (!username) {
        window.location.href = 'login.html?redirect=index.html';
        return;
    }

    btn.disabled = true;

    const snap = await get(ref(db, 'users/' + username));
    const data = snap.exists() ? snap.val() : {};
    const incomplete = fields.some(function(name) {
        return !data[name] || data[name].trim() === '';
    });

    window.location.href = incomplete ? 'about.html' : 'tool.html';
});
