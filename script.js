const btn = document.getElementById('homeButton');
btn.addEventListener('click', function() {
    window.location.href = 'tool.html';
});
const prof = document.getElementsByClassName('proffile');
prof.addEventListener('click',function()){
    window.location.href = 'about.html';
}