document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    if (!sessionStorage.getItem('isAdminAuthenticated')) {
        window.location.href = 'login.html';
        return;
    }

    // Инициализация данных
    let services = JSON.parse(localStorage.getItem('services')) || [];
    let feedbacks = JSON.parse(localStorage.getItem('feedback')) || [];
    
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

                // Загружаем историю при переключении на вкладку истории
                if (targetTab === 'history') {
                    window.historyManager.loadHistory();
                }
                // Загружаем отзывы при переключении на вкладку отзывов
                if (targetTab === 'feedback') {
                    loadFeedbacks();
                }
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

    // Загрузка отзывов в таблицу
    function loadFeedbacks() {
        fetch('http://localhost:5000/api/feedback/json')
            .then(response => response.json())
            .then(feedbacks => {
                const feedbackTab = document.getElementById('feedback-tab');
                let table = feedbackTab.querySelector('table');
                if (!table) {
                    table = document.createElement('table');
                    table.className = 'data-table';
                    table.innerHTML = `
                        <thead>
                            <tr>
                                <th>Имя</th>
                                <th>Отзыв</th>
                                <th>Оценка</th>
                                <th>Дата</th>
                            </tr>
                        </thead>
                        <tbody id="feedback-table-body"></tbody>
                    `;
                    feedbackTab.appendChild(table);
                }
                const tbody = table.querySelector('#feedback-table-body');
                if (!feedbacks || feedbacks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4">Нет отзывов</td></tr>';
                    return;
                }
                tbody.innerHTML = feedbacks.map(fb => `
                    <tr>
                        <td>${fb.customer_name || ''}</td>
                        <td>${fb.message || ''}</td>
                        <td>${fb.rating || ''}</td>
                        <td>${fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}</td>
                    </tr>
                `).join('');
            });
    }

    // Удаление услуги
    function initDeleteButtons() {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
                    const id = parseInt(btn.dataset.id);
                    const service = services.find(s => s.id === id);
                    services = services.filter(s => s.id !== id);
                    localStorage.setItem('services', JSON.stringify(services));
                    loadServices();
                    
                    // Добавляем запись в историю
                    window.historyManager.addHistoryEntry(
                        'service',
                        'Удаление услуги',
                        `Удалена услуга: ${service.name}`
                    );
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
            const oldService = services[index];
            services[index] = newService;
            
            // Добавляем запись в историю об обновлении
            window.historyManager.addHistoryEntry(
                'service',
                'Обновление услуги',
                `Обновлена услуга: ${oldService.name} -> ${newService.name}`
            );
        } else {
            services.push(newService);
            
            // Добавляем запись в историю о создании
            window.historyManager.addHistoryEntry(
                'service',
                'Создание услуги',
                `Создана новая услуга: ${newService.name}`
            );
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
    window.historyManager.initHistoryFilters();

    // Кнопка "Добавить услугу"
    document.getElementById('add-service').addEventListener('click', () => {
        openServiceModal();
    });
});