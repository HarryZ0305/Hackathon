import { db } from './firebase.js';
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const username = sessionStorage.getItem('username');
if (!username) {
    window.location.href = 'login.html?redirect=library.html';
}

const listEl = document.getElementById('savedList');
const emptyState = document.getElementById('emptyState');

window.deleteEvent = async function(index) {
    try {
        const userRef = ref(db, 'users/' + username);
        const snap = await get(userRef);
        const profile = snap.exists() ? snap.val() : {};
        
        let savedEvents = profile.savedEvents || [];
        savedEvents = Array.isArray(savedEvents) ? savedEvents : Object.values(savedEvents);

        savedEvents.splice(index, 1);
        
        await update(userRef, { savedEvents: savedEvents });
        loadLibrary();
    } catch (err) {
        console.error("Failed to delete event:", err);
        alert("Could not delete event.");
    }
};

async function loadLibrary() {
    try {
        const snap = await get(ref(db, 'users/' + username + '/savedEvents'));
        const events = snap.exists() ? snap.val() : [];
        
        const arr = Array.isArray(events) ? events : Object.values(events);

        if (arr.length === 0) {
            listEl.innerHTML = ''; 
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none'; 
        listEl.innerHTML = ''; 
        
        arr.forEach((evt, index) => {
            const div = document.createElement('div');
            div.className = 'section-card'; 
            div.style.position = 'relative';
            
            div.innerHTML = `
                <button class="delete-btn" onclick="deleteEvent(${index})" title="Remove">
                    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" width="20" height="20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
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