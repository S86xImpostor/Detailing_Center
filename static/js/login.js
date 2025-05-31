document.addEventListener('DOMContentLoaded', () => {
    initAdminCredentials();
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', handleLogin);
});

function initAdminCredentials() {
    if (!localStorage.getItem('admin')) {
        const defaultCredentials = {
            login: 'admin',
            password: btoa('admin123')
        };
        localStorage.setItem('admin', JSON.stringify(defaultCredentials));
    }
}

function handleLogin(e) {
    e.preventDefault();
    
    const loginInput = document.querySelector('input[name="login"]');
    const passwordInput = document.querySelector('input[name="password"]');
    const errorElement = document.getElementById('login-error');
    
    const login = loginInput.value.trim();
    const password = passwordInput.value.trim();

    // Сброс ошибок
    errorElement.style.display = 'none';
    loginInput.classList.remove('error');
    passwordInput.classList.remove('error');

    // Проверка заполнения полей
    if (!login || !password) {
        showError('Заполните все поля!');
        if (!login) loginInput.classList.add('error');
        if (!password) passwordInput.classList.add('error');
        return;
    }

    // Получаем сохраненные данные
    const savedData = JSON.parse(localStorage.getItem('admin'));
    
    // Кодируем введенный пароль для сравнения
    const encodedPassword = btoa(password);
    
    // Проверяем логин и закодированный пароль
    if (login === savedData.login && encodedPassword === savedData.password) {
        // Сохраняем статус авторизации
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        // Перенаправляем на dashboard.html
        window.location.href = 'dashboard.html';
    } else {
        showError('Неверные учетные данные');
        loginInput.classList.add('error');
        passwordInput.classList.add('error');
    }
}

function showError(message) {
    const errorElement = document.getElementById('login-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}