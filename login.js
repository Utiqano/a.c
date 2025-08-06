const users = [
    { email: "amine@wkw.com", password: "amine123" },
    { email: "houssine@wkw.com", password: "houssine123" }
];

function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const error = document.getElementById('error');

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        error.classList.add('hidden');
        showSection('dashboard-section');
    } else {
        error.textContent = 'Invalid email or password';
        error.classList.remove('hidden');
    }
}