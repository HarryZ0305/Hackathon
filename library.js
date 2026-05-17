import { db } from './firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const username = sessionStorage.getItem('username');
if (!username) {
    window.location.href = 'login.html?redirect=library.html';
}

const listEl = document.getElementById('savedList');
const emptyState = document.getElementById('emptyState');

async function loadLibrary() {
    try {
        const snap = await get(ref(db, 'users/' + username + '/savedEvents'));
        const events = snap.exists() ? snap.val() : [];
        
        const arr = Array.isArray(events) ? events : Object.values(events);

        if (arr.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        listEl.innerHTML = ''; 
        
        arr.forEach((evt) => {
            const div = document.createElement('div');
            div.className = 'section-card'; 
            div.innerHTML = `
                <div class="section-header">
                    <span class="section-title">${evt.title}</span>
                </div>
                <p style="color: var(--navy-mid); font-weight: bold; margin-bottom: 12px; font-size: 14px;">
                    📅 ${evt.data}
                </p>
                <p style="line-height: 1.6; font-size: 15px;">
                    ${evt.description}
                </p>
            `;
            listEl.appendChild(div);
        });

    } catch (err) {
        console.error('Failed to load library:', err);
        listEl.innerHTML = '<p class="empty" style="color: var(--danger);">Failed to load your saved events. Please try again.</p>';
    }
}

loadLibrary();