document.addEventListener('DOMContentLoaded', function() {
    console.log('Schedule.js loaded');
    const scheduleDateInput = document.getElementById('schedule-date');
    const bookingsContainer = document.getElementById('bookings-container');
    const timeColumn = document.querySelector('.time-column');
    const viewButtons = document.querySelectorAll('.view-controls button');
    
    let currentView = 'day';
    let currentDate = new Date();

    // Инициализация выбора даты
    const fp = flatpickr(scheduleDateInput, {
        locale: 'ru',
        dateFormat: 'Y-m-d',
        defaultDate: 'today',
        minDate: 'today',
        maxDate: new Date().fp_incr(30),
        disable: [
            function(date) {
                // Отключаем выходные дни (суббота и воскресенье)
                return date.getDay() === 0 || date.getDay() === 6;
            }
        ],
        onChange: function(selectedDates) {
            console.log('Date selected:', selectedDates[0]);
            if (selectedDates.length > 0) {
                currentDate = selectedDates[0];
                loadSchedule(currentDate, currentView);
            }
        }
    });

    // Обработчики для кнопок переключения вида
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('View changed to:', button.dataset.view);
            viewButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentView = button.dataset.view;
            loadSchedule(currentDate, currentView);
        });
    });

    // Функция загрузки расписания
    async function loadSchedule(date, view) {
        console.log('Loading schedule for:', date, 'view:', view);
        showLoading();
        try {
            // В реальном приложении здесь будет запрос к API
            const bookings = await fetchBookings(date, view);
            displaySchedule(bookings, view);
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);
            showError('Не удалось загрузить расписание');
        }
    }

    // Функция для получения данных о записях (пока с моковыми данными)
    async function fetchBookings(date, view) {
        console.log('Fetching bookings for:', date);
        // Имитация задержки загрузки
        await new Promise(resolve => setTimeout(resolve, 500));

        const timeSlots = [];
        const startHour = 9; // Начало рабочего дня
        const endHour = 21; // Конец рабочего дня

        // Генерируем временные слоты
        for (let hour = startHour; hour < endHour; hour++) {
            timeSlots.push({
                time: `${hour}:00`,
                bookings: []
            });
        }

        // Добавляем несколько тестовых записей
        timeSlots[2].bookings.push({
            id: 1,
            service: 'Комплексная мойка',
            client: 'Иван Петров',
            status: 'booked'
        });

        timeSlots[5].bookings.push({
            id: 2,
            status: 'available'
        });

        return timeSlots;
    }

    // Функция отображения расписания
    function displaySchedule(timeSlots, view) {
        console.log('Displaying schedule:', timeSlots);
        // Очищаем контейнеры
        timeColumn.innerHTML = '<div class="time-header">Время</div>';
        bookingsContainer.innerHTML = '';

        // Отображаем временные слоты
        timeSlots.forEach(slot => {
            // Добавляем время в левую колонку
            const timeSlotEl = document.createElement('div');
            timeSlotEl.className = 'time-slot';
            timeSlotEl.textContent = slot.time;
            timeColumn.appendChild(timeSlotEl);

            // Добавляем информацию о записях
            const bookingSlotEl = document.createElement('div');
            bookingSlotEl.className = 'booking-slot';

            if (slot.bookings.length > 0) {
                const booking = slot.bookings[0];
                if (booking.status === 'booked') {
                    bookingSlotEl.classList.add('booked');
                    bookingSlotEl.innerHTML = `
                        <strong>${booking.service}</strong><br>
                        <span>${booking.client}</span>
                    `;
                } else {
                    setupAvailableSlot(bookingSlotEl, slot);
                }
            } else {
                setupAvailableSlot(bookingSlotEl, slot);
            }

            bookingsContainer.appendChild(bookingSlotEl);
        });
    }

    function setupAvailableSlot(element, slot) {
        console.log('Setting up available slot:', slot);
        element.classList.add('available');
        element.textContent = 'Доступно для записи';
        element.addEventListener('click', () => {
            console.log('Slot clicked:', slot);
            const params = new URLSearchParams();
            params.set('date', formatDate(currentDate));
            params.set('time', slot.time);
            params.set('preselected', 'true');
            const bookingUrl = `booking.html?${params.toString()}`;
            console.log('Redirecting to:', bookingUrl);
            window.location.href = bookingUrl;
        });
    }

    // Вспомогательные функции
    function showLoading() {
        bookingsContainer.innerHTML = '<div class="loading-animation"></div>';
    }

    function showError(message) {
        console.error('Error:', message);
        bookingsContainer.innerHTML = `
            <div class="error-message">
                ${message}
                <button class="btn-outline retry-btn">Повторить</button>
            </div>
        `;
        document.querySelector('.retry-btn').addEventListener('click', () => {
            loadSchedule(currentDate, currentView);
        });
    }

    function formatDate(date) {
        console.log('Formatting date:', date);
        return date.toISOString().split('T')[0];
    }

    // Загружаем расписание при первой загрузке страницы
    console.log('Initial schedule load');
    loadSchedule(currentDate, currentView);
});