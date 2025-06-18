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
                // Загружаем записи при переключении на вкладку записей
                if (targetTab === 'bookings') {
                    loadBookings();
                }
            });
        });
    }

    // Загрузка услуг из API
    async function loadServices() {
        const response = await fetch('http://localhost:5000/api/services');
        const services = await response.json();
        const tbody = document.getElementById('services-table-body');
        tbody.innerHTML = services.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>${service.base_price} руб.</td>
                <td>${service.category_name}</td>
                <td>
                    <button class="btn-edit" data-id="${service.id}">✏️</button>
                    <button class="btn-delete" data-id="${service.id}">🗑️</button>
                </td>
            </tr>
        `).join('');
        initDeleteButtons(services);
        initEditButtons(services);
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
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody id="feedback-table-body"></tbody>
                    `;
                    feedbackTab.appendChild(table);
                }
                const tbody = table.querySelector('#feedback-table-body');
                if (!feedbacks || feedbacks.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5">Нет отзывов</td></tr>';
                    return;
                }
                tbody.innerHTML = feedbacks.map(fb => `
                    <tr>
                        <td>${fb.customer_name || ''}</td>
                        <td>${fb.message || ''}</td>
                        <td>${fb.rating || ''}</td>
                        <td>${fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}</td>
                        <td>
                            <button class="btn-delete-feedback" data-id="${fb.feedback_id}">Удалить</button>
                        </td>
                    </tr>
                `).join('');

                // Обработчик удаления
                tbody.querySelectorAll('.btn-delete-feedback').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.dataset.id;
                        if (confirm('Удалить этот отзыв?')) {
                            fetch(`http://localhost:5000/api/feedback/${id}`, { method: 'DELETE' })
                                .then(res => res.json())
                                .then(result => {
                                    if (result.success) {
                                        loadFeedbacks();
                                    } else {
                                        alert('Ошибка при удалении: ' + (result.error || 'Неизвестная ошибка'));
                                    }
                                });
                        }
                    });
                });
            });
    }

    // Загрузка записей (бронирований) в таблицу
    async function loadBookings() {
        const response = await fetch('http://localhost:5000/api/bookings');
        const bookings = await response.json();
        const bookingsTab = document.getElementById('bookings-tab');
        let table = bookingsTab.querySelector('table');
        if (!table) {
            table = document.createElement('table');
            table.className = 'data-table';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Клиент</th>
                        <th>Услуга</th>
                        <th>Дата</th>
                        <th>Время</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="bookings-table-body"></tbody>
            `;
            bookingsTab.appendChild(table);
        }
        const tbody = table.querySelector('#bookings-table-body');
        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Нет записей</td></tr>';
            return;
        }
        const statusOptions = [
            { value: 'pending', label: 'В ожидании' },
            { value: 'confirmed', label: 'Подтверждена' },
            { value: 'completed', label: 'Выполнена' },
            { value: 'cancelled', label: 'Отменена' }
        ];
        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td>${b.customer_name || ''}</td>
                <td>${b.service_name || ''}</td>
                <td>${b.booking_date || ''}</td>
                <td>${b.start_time || ''} - ${b.end_time || ''}</td>
                <td>
                    <select class="booking-status-select" data-id="${b.id}">
                        ${statusOptions.map(opt => `<option value="${opt.value}"${b.status === opt.value ? ' selected' : ''}>${opt.label}</option>`).join('')}
                    </select>
                </td>
                <td><button class="btn-delete-booking" data-id="${b.id}">Удалить</button></td>
            </tr>
        `).join('');
        // Обработчик удаления
        tbody.querySelectorAll('.btn-delete-booking').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                if (confirm('Удалить эту запись?')) {
                    fetch(`http://localhost:5000/api/bookings/${id}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(result => {
                            if (result.success) {
                                loadBookings();
                            } else {
                                alert('Ошибка при удалении: ' + (result.error || 'Неизвестная ошибка'));
                            }
                        });
                }
            });
        });
        // Обработчик изменения статуса
        tbody.querySelectorAll('.booking-status-select').forEach(select => {
            select.addEventListener('change', function() {
                const id = this.dataset.id;
                const newStatus = this.value;
                fetch(`http://localhost:5000/api/bookings/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
                .then(res => res.json())
                .then(result => {
                    if (!result.success) {
                        alert('Ошибка при обновлении статуса: ' + (result.error || 'Неизвестная ошибка'));
                        loadBookings();
                    }
                });
            });
        });
    }

    // Удаление услуги через API
    function initDeleteButtons(services) {
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                if (confirm('Вы уверены, что хотите удалить эту услугу?')) {
                    fetch(`http://localhost:5000/api/services/${id}`, { method: 'DELETE' })
                        .then(res => res.json())
                        .then(result => {
                            if (result.success) {
                                loadServices();
                            } else {
                                alert('Ошибка при удалении: ' + (result.error || 'Неизвестная ошибка'));
                            }
                        });
                }
            });
        });
    }

    // Редактирование услуги через API
    function initEditButtons(services) {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                const service = services.find(s => s.id === parseInt(btn.dataset.id));
                openServiceModal(service);
            });
        });
    }

    // Модальное окно для добавления/редактирования услуги
    function openServiceModal(service = null) {
        const modal = document.getElementById('service-modal');
        const form = document.getElementById('service-form');
        if (service) {
            form.dataset.id = service.id;
            document.getElementById('modal-service-name').value = service.name;
            document.getElementById('modal-service-price').value = service.base_price;
            document.getElementById('modal-service-category').value = service.category;
            document.getElementById('modal-service-description').value = service.description || '';
            document.getElementById('modal-service-duration').value = service.duration || 1;
            document.querySelector('.modal-title').textContent = 'Редактировать услугу';
        } else {
            form.reset();
            form.removeAttribute('data-id');
            document.querySelector('.modal-title').textContent = 'Добавить услугу';
        }
        modal.style.display = 'flex';
    }

    // Сохранение услуги через API
    document.getElementById('service-form').addEventListener('submit', async e => {
        e.preventDefault();
        const form = e.target;
        const id = form.dataset.id;
        const name = document.getElementById('modal-service-name').value;
        const price = parseFloat(document.getElementById('modal-service-price').value);
        const category = document.getElementById('modal-service-category').value;
        const description = document.getElementById('modal-service-description').value;
        const duration = parseInt(document.getElementById('modal-service-duration').value) || 1;
        // Получаем category_id по slug
        const categories = {
            wash: 1,
            polish: 2,
            coating: 3,
            interior: 4
        };
        const category_id = categories[category];
        const payload = {
            service_name: name,
            base_price: price,
            category_id: category_id,
            description: description,
            duration_minutes: duration * 60
        };
        if (id) {
            // Обновление
            await fetch(`http://localhost:5000/api/services/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            // Добавление
            await fetch('http://localhost:5000/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
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