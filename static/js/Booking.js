document.addEventListener('DOMContentLoaded', function() {
    const bookingForm = document.getElementById('booking-form');
    const steps = document.querySelectorAll('.form-step');
    const stepButtons = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const timeSlotsContainer = document.getElementById('time-slots');
    const bookingDateInput = document.getElementById('booking-date');
    
    let currentStep = 1;
    let selectedService = null;
    let selectedDateTime = null;
    
    // Инициализация datepicker
    const fp = flatpickr(bookingDateInput, {
        locale: 'ru',
        minDate: 'today',
        maxDate: new Date().fp_incr(30),
        disable: [date => date.getDay() === 0 || date.getDay() === 6],
        onChange: function(selectedDates) {
            if (selectedDates.length > 0) {
                loadAvailableTimeSlots(selectedDates[0].toISOString().split('T')[0]);
            }
        }
    });
    
    // Загрузка услуг
    loadServicesForBooking();
    
    // Переключение шагов
    function goToStep(step) {
        steps.forEach(s => {
            s.classList.remove('active');
            s.hidden = true;
        });
        stepButtons.forEach(b => b.classList.remove('active'));
        
        const activeStep = document.querySelector(`.form-step[data-step="${step}"]`);
        const activeButton = document.querySelector(`.step[data-step="${step}"]`);
        
        activeStep.classList.add('active');
        activeStep.hidden = false;
        activeButton.classList.add('active');
        currentStep = step;
    }
    
    // Обработчики кнопок
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                if (currentStep === 4) return;
                
                if (currentStep === 3) updateSummary();
                goToStep(currentStep + 1);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', () => goToStep(currentStep - 1));
    });
    
    // Валидация
    function validateStep(step) {
        clearErrors();
        let isValid = true;
        
        if (step === 1) {
            const serviceSelected = document.querySelector('input[name="service"]:checked');
            if (!serviceSelected) {
                showError('Пожалуйста, выберите услугу');
                isValid = false;
            } else {
                selectedService = {
                    id: serviceSelected.value,
                    name: serviceSelected.parentElement.querySelector('h3').textContent,
                    base_price: serviceSelected.parentElement.querySelector('.price').textContent
                };
            }
        }
        else if (step === 2) {
            if (!selectedDateTime) {
                showError('Выберите дату и время');
                isValid = false;
            }
        }
        else if (step === 3) {
            const clientName = document.getElementById('client-name').value.trim();
            const clientPhone = document.getElementById('client-phone').value.trim();
            const clientCar = document.getElementById('client-car').value.trim();
            const clientEmail = document.getElementById('client-email').value.trim();
            
            if (!clientName) {
                showError('name-error', 'Введите ваше имя');
                isValid = false;
            }
            
            if (!/^[\d\+]{10,15}$/.test(clientPhone)) {
                showError('phone-error', 'Неверный формат телефона');
                isValid = false;
            }
            
            if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
                showError('email-error', 'Неверный формат email');
                isValid = false;
            }
            
            if (!clientCar) {
                showError('car-error', 'Укажите модель автомобиля');
                isValid = false;
            }
        }
        else if (step === 4) {
            if (!document.getElementById('agree-terms').checked) {
                showError('Вы должны согласиться с условиями');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    function showError(id, message) {
        if (id) {
            const errorElement = document.getElementById(id);
            errorElement.textContent = message;
            errorElement.hidden = false;
        } else {
            alert(message);
        }
    }
    
    function clearErrors() {
        document.querySelectorAll('.error-text').forEach(el => {
            el.hidden = true;
        });
    }
    
    // Загрузка услуг для бронирования
    async function loadServicesForBooking() {
        try {
            // В реальном проекте замените на реальный API-запрос
            const mockServices = [
                {
                    id: 1,
                    name: "Комплексная мойка",
                    description: "Полная очистка кузова и салона",
                    base_price: 3000
                },
                {
                    id: 2,
                    name: "Полировка кузова",
                    description: "Удаление царапин и восстановление блеска",
                    base_price: 5000
                }
            ];
            
            displayServices(mockServices);
            
            // Разблокируем кнопку "Далее" после загрузки
            document.querySelector('.next-step').disabled = false;
        } catch (error) {
            console.error('Ошибка:', error);
            document.getElementById('booking-services').innerHTML = 
                '<p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>';
        }
    }
    
    // Отображение услуг
    function displayServices(services) {
        const container = document.getElementById('booking-services');
        container.innerHTML = '';
        
        services.forEach(service => {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'service-card';
            serviceElement.innerHTML = `
                <input type="radio" name="service" id="service-${service.id}" 
                       value="${service.id}" required>
                <label for="service-${service.id}">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="price">${service.base_price} руб.</div>
                </label>
            `;
            container.appendChild(serviceElement);
            
            // Добавляем обработчик выбора услуги
            document.getElementById(`service-${service.id}`).addEventListener('change', () => {
                selectedService = service;
            });
        });
    }
    
    // Загрузка временных слотов
    async function loadAvailableTimeSlots(date) {
        timeSlotsContainer.innerHTML = '<div class="loading-animation"></div>';
        
        try {
            // Имитация загрузки данных
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // В реальном проекте замените на реальные данные
            const mockTimeSlots = [
                { id: 1, start_time: '10:00', end_time: '11:00' },
                { id: 2, start_time: '11:00', end_time: '12:00' },
                { id: 3, start_time: '14:00', end_time: '15:00' }
            ];
            
            displayTimeSlots(mockTimeSlots);
        } catch (error) {
            console.error('Ошибка:', error);
            timeSlotsContainer.innerHTML = `
                <p class="error">Ошибка загрузки расписания</p>
                <button class="btn-outline retry-btn">Повторить попытку</button>
            `;
            document.querySelector('.retry-btn').addEventListener('click', 
                () => loadAvailableTimeSlots(date));
        }
    }
    
    // Отображение временных слотов
    function displayTimeSlots(timeslots) {
        timeSlotsContainer.innerHTML = timeslots.length === 0 
            ? '<p>Нет доступных слотов на выбранную дату</p>'
            : timeslots.map(slot => `
                <div class="time-slot">
                    <input type="radio" name="timeslot" id="slot-${slot.id}" value="${slot.id}" hidden>
                    <label for="slot-${slot.id}">${slot.start_time} - ${slot.end_time}</label>
                </div>
            `).join('');
            
        // Добавляем обработчики выбора времени
        timeslots.forEach(slot => {
            document.getElementById(`slot-${slot.id}`).addEventListener('change', () => {
                selectedDateTime = {
                    id: slot.id,
                    date: bookingDateInput.value,
                    start: slot.start_time,
                    end: slot.end_time
                };
            });
        });
    }
    
    // Обновление сводки
    function updateSummary() {
        document.getElementById('summary-service').textContent = selectedService.name;
        document.getElementById('summary-price').textContent = `${selectedService.base_price} руб.`;
        document.getElementById('summary-datetime').textContent = 
            `${selectedDateTime.date} ${selectedDateTime.start}`;
        document.getElementById('summary-name').textContent = document.getElementById('client-name').value;
        document.getElementById('summary-phone').textContent = document.getElementById('client-phone').value;
        document.getElementById('summary-car').textContent = document.getElementById('client-car').value;
    }
    
    // Отправка формы
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateStep(4)) return;
        
        try {
            // Имитация отправки данных
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // В реальном проекте замените на реальный API-запрос
            const mockResponse = {
                booking_id: 'BK-' + Math.floor(Math.random() * 10000)
            };
            
            // Показываем сообщение об успехе
            bookingForm.hidden = true;
            document.getElementById('booking-success').hidden = false;
            document.getElementById('success-details').innerHTML = `
                <p><strong>Услуга:</strong> ${selectedService.name}</p>
                <p><strong>Дата:</strong> ${selectedDateTime.date} ${selectedDateTime.start}</p>
                <p><strong>Номер записи:</strong> ${mockResponse.booking_id}</p>
            `;
        } catch (error) {
            console.error('Ошибка:', error);
            alert(`Ошибка бронирования: ${error.message}`);
        }
    });
});