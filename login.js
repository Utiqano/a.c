function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const error = document.getElementById('error');
    if ((email === 'amine@wkw.com' && password === 'amine123') || 
        (email === 'houssine@wkw.com' && password === 'houssine123')) {
        const loginContainer = document.getElementById('login-container');
        const dashboard = document.getElementById('dashboard');
        if (loginContainer && dashboard) {
            loginContainer.classList.add('hidden');
            dashboard.classList.remove('hidden');
            window.pendingLogin = true; // Signal login pending
            const section = document.getElementById('dashboard-section');
            if (section) {
                showSection('dashboard-section');
                window.pendingLogin = false;
            } else {
                console.log('Waiting for sections to load...');
                // main.js will call showSection when ready
            }
        } else {
            console.error('Login container or dashboard not found');
            alert('Error: Page elements missing. Please refresh.');
        }
    } else {
        error.classList.remove('hidden');
        error.textContent = 'Invalid email or password';
    }
}
