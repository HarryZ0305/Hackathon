import { db } from './firebase.js';
import { ref, get }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const btn = document.getElementById('homeButton');
const stringFields = ['fullName', 'gradeYear', 'zipCode', 'bio'];
const arrayFields = ['education', 'experience', 'skills', 'interests'];

const username = sessionStorage.getItem('username');
const nameSpan = document.querySelector('.profile span');
if (nameSpan) {
    nameSpan.textContent = username || 'Sign In';
}

function isIncomplete(data) {
    for (const name of stringFields) {
        if (!data[name] || String(data[name]).trim() === '') return true;
    }
    for (const name of arrayFields) {
        const v = data[name];
        const arr = Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : []);
        if (arr.length === 0) return true;
    }
    return false;
}

btn.addEventListener('click', async function() {
    if (!username) {
        window.location.href = 'login.html?redirect=index.html';
        return;
    }

    btn.disabled = true;

    const snap = await get(ref(db, 'users/' + username));
    const data = snap.exists() ? snap.val() : {};

    window.location.href = isIncomplete(data) ? 'about.html' : 'tool.html';
});
