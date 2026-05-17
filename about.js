import { auth, db } from './firebase.js';
import { onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, setDoc }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const fields = ['education', 'experience', 'skills', 'interests'];

onAuthStateChanged(auth, async function(user) {
    if (!user) {
        window.location.href = 'login.html?redirect=about.html';
        return;
    }

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const data = snap.exists() ? snap.data() : {};

    fields.forEach(function(name) {
        const el = document.querySelector('[data-field="' + name + '"]');
        if (el && data[name]) {
            el.textContent = data[name];
        }

        if (el) {
            el.addEventListener('blur', async function() {
                await setDoc(userRef, { [name]: el.textContent.trim() }, { merge: true });
            });
        }
    });
});
