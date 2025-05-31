document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    if (!sessionStorage.getItem('isAdminAuthenticated')) {
        window.location.href = 'login.html';
        return;
    }

    // Инициализация данных
    let services = JSON.parse(localStorage.getItem('services')) || [];
    
    // Инициализация вкладок
    function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Удаляем активные классы
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));

                // Активируем выбранную вкладку
                const targetTab = button.dataset.tab;
                button.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }

    // Загрузка услуг в таблицу
    function loadServices() {
        const tbody = document.getElementById('services-table-body');
        tbody.innerHTML = services.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>${service.price} руб.</td>
                <td>${getCategoryName(service.category)}</td>
                <td>
                    <button class="btn-edit" data-id="${service.id}">✏️</button>
                    <button class="btn-delete" data-id="${service.id}">🗑️</button>
                </td>
            </tr>
        `).join('');

        // Инициализация кнопок удаления и редактирования
        initDeleteButtons();
        initEditButtons();
    }

    function getCategoryName(category) {
        const categories = {
            wash: 'Мойка',
            polish: 'Полировка',
            coating: 'Покрытия',
            interior: 'Салон'
        };
        return categories[category] || category;
    }

    // Удаление услуги
    function initDeleteButtons() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
                    const id = parseInt(btn.dataset.id);
                    services = services.filter(service => service.id !== id);
                    localStorage.setItem('services', JSON.stringify(services));
                    loadServices();
                }
            });
        });
    }

    // Редактирование услуги
    function initEditButtons() {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = services.find(s => s.id === parseInt(btn.dataset.id));
                openServiceModal(service);
            });
        });
    }

    // Модальное окно для добавления/редактирования
    function openServiceModal(service = null) {
        const modal = document.getElementById('service-modal');
        const form = document.getElementById('service-form');

        if (service) {
            form.dataset.id = service.id;
            document.getElementById('modal-service-name').value = service.name;
            document.getElementById('modal-service-price').value = service.price;
            document.getElementById('modal-service-category').value = service.category;
            document.querySelector('.modal-title').textContent = 'Редактировать услугу';
        } else {
            form.reset();
            form.removeAttribute('data-id');
            document.querySelector('.modal-title').textContent = 'Добавить услугу';
        }

        modal.style.display = 'flex';
    }

    // Сохранение услуги
    document.getElementById('service-form').addEventListener('submit', e => {
        e.preventDefault();
        
        const id = e.target.dataset.id ? parseInt(e.target.dataset.id) : Date.now();
        const name = document.getElementById('modal-service-name').value;
        const price = parseInt(document.getElementById('modal-service-price').value);
        const category = document.getElementById('modal-service-category').value;

        const newService = { id, name, price, category };

        // Обновление или добавление
        const index = services.findIndex(s => s.id === id);
        if (index >= 0) {
            services[index] = newService;
        } else {
            services.push(newService);
        }

        localStorage.setItem('services', JSON.stringify(services));
        loadServices();
        document.getElementById('service-modal').style.display = 'none';
    });

    // Закрытие модального окна
    document.querySelector('.modal-close').addEventListener('click', () => {
        document.getElementById('service-modal').style.display = 'none';
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('service-modal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Инициализация
    initTabs();
    loadServices();

    // Кнопка "Добавить услугу"
    document.getElementById('add-service').addEventListener('click', () => {
        openServiceModal();
    });
});