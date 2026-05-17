import { auth } from './firebase.js';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('errorMsg');
const submitBtn = document.getElementById('submitBtn');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const switchPrompt = document.getElementById('switchPrompt');
const switchLink = document.getElementById('switchLink');

let mode = 'login';

switchLink.addEventListener('click', function(e) {
    e.preventDefault();
    mode = mode === 'login' ? 'signup' : 'login';
    if (mode === 'signup') {
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Join NextOccasion';
        submitBtn.textContent = 'Sign Up';
        switchPrompt.textContent = 'Already have an account?';
        switchLink.textContent = 'Log in';
    } else {
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Sign in to continue';
        submitBtn.textContent = 'Log In';
        switchPrompt.textContent = "Don't have an account?";
        switchLink.textContent = 'Sign up';
    }
    errorMsg.textContent = '';
});

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    errorMsg.textContent = '';
    submitBtn.disabled = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
        if (mode === 'signup') {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || 'index.html';
        window.location.href = redirect;
    } catch (err) {
        errorMsg.textContent = friendlyError(err.code);
        submitBtn.disabled = false;
    }
});

function friendlyError(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Invalid email address.';
        case 'auth/email-already-in-use': return 'Email already registered. Try logging in.';
        case 'auth/weak-password': return 'Password must be at least 6 characters.';
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found': return 'Incorrect email or password.';
        default: return 'Something went wrong. Please try again.';
    }
}
