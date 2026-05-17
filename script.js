const btn = document.getElementById('homeButton');

const username = sessionStorage.getItem('username');
const nameSpan = document.querySelector('.profile span');
if (nameSpan) {
    nameSpan.textContent = username || 'Sign In';
}

btn.addEventListener('click', function() {
    if (username) {
        window.location.href = 'tool.html';
    } else {
        window.location.href = 'login.html?redirect=index.html';
    }
});
