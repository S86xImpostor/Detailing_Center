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
    
    // Получаем параметры из URL
    const urlParams = new URLSearchParams(window.location.search);
    const autoStartService = urlParams.get('service');
    const autoStart = urlParams.get('autostart') === 'true';
    const premium = urlParams.get('premium') === 'true';
    const express = urlParams.get('express') === 'true';
    const carSize = urlParams.get('carSize');
    const totalPriceFromUrl = urlParams.get('totalPrice');
    
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
    loadServicesForBooking().then(() => {
        // Если есть параметр service в URL и autostart=true
        if (autoStartService && autoStart) {
            console.log('Автоматический выбор услуги:', autoStartService);
            const serviceInput = document.querySelector(`input[name="service"][value="${autoStartService}"]`);
            if (serviceInput) {
                serviceInput.checked = true;
                serviceInput.dispatchEvent(new Event('change'));
                // Переходим к выбору даты
                setTimeout(() => {
                    if (validateStep(1)) {
                        goToStep(2);
                    }
                }, 100);
            } else {
                console.error('Услуга не найдена:', autoStartService);
            }
        }
    });
    
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

        console.log(`Navigated to step: ${currentStep}`);
        if (currentStep === 3) {
            console.log('Attempting to focus on client-name input...');
            const clientNameInput = document.getElementById('client-name');
            if (clientNameInput) {
                clientNameInput.focus();
                console.log('Client name input focused:', document.activeElement === clientNameInput);
            } else {
                console.log('Client name input not found.');
            }
        }
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
            const response = await fetch('/api/services');
            if (!response.ok) {
                throw new Error('Не удалось загрузить услуги');
            }
            const services = await response.json();
            
            if (!Array.isArray(services) || services.length === 0) {
                throw new Error('Нет доступных услуг');
            }

            displayServices(services);
            document.querySelector('.next-step').disabled = false;
        } catch (error) {
            console.error('Ошибка загрузки услуг:', error);
            document.getElementById('booking-services').innerHTML = 
                '<p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>';
        }
    }
    
    // Отображение услуг
    function displayServices(services) {
        const container = document.getElementById('booking-services');
        container.innerHTML = '';

        // Удаляем существующее модальное окно
        const existingModal = document.getElementById('service-confirmation');
        if (existingModal) {
            existingModal.remove();
        }

        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.className = 'confirmation-modal';
        modal.id = 'service-confirmation';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Подтверждение выбора</h3>
                <div id="modal-service-details"></div>
                <div class="modal-buttons">
                    <button class="btn-primary" id="confirm-service">Продолжить</button>
                    <button class="btn-outline" id="cancel-service">Отменить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Создаем карточки услуг
        services.forEach(service => {
            const card = document.createElement('div');
            card.className = 'service-card';
            
            const serviceName = service.service_name || service.name;
            const serviceDescription = service.description || 'Описание отсутствует';
            const servicePrice = service.base_price;
            const serviceId = service.service_id || service.id;

            card.innerHTML = `
                <input type="radio" name="service" id="service-${serviceId}" value="${serviceId}">
                <label for="service-${serviceId}">
                    <h3>${serviceName}</h3>
                    <p>${serviceDescription}</p>
                    <div class="price">${servicePrice} руб.</div>
                </label>
            `;
            container.appendChild(card);

            // Добавляем обработчик для радио-кнопки
            const radio = card.querySelector('input[type="radio"]');
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    const modalDetails = document.getElementById('modal-service-details');
                    const priceToDisplayInModal = totalPriceFromUrl ? `${totalPriceFromUrl} руб.` : `${servicePrice} руб.`;
                    modalDetails.innerHTML = `
                        <p>Вы выбрали услугу: ${serviceName}</p>
                        <p>Стоимость: ${priceToDisplayInModal}</p>
                    `;
                    modal.style.display = 'flex';

                    // Обработчик подтверждения
                    const confirmBtn = document.getElementById('confirm-service');
                    confirmBtn.onclick = () => {
                        selectedService = {
                            id: serviceId,
                            name: serviceName,
                            base_price: servicePrice,
                            calculated_price: totalPriceFromUrl ? parseFloat(totalPriceFromUrl) : null // Сохраняем рассчитанную цену
                        };
                        modal.style.display = 'none';
                        document.querySelector('.next-step').disabled = false;
                    };

                    // Обработчик отмены
                    const cancelBtn = document.getElementById('cancel-service');
                    cancelBtn.onclick = () => {
                        radio.checked = false;
                        modal.style.display = 'none';
                    };
                }
            });
        });

        // Закрытие модального окна при клике вне его
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const checkedRadio = document.querySelector('input[name="service"]:checked');
                if (checkedRadio) {
                    checkedRadio.checked = false;
                }
                modal.style.display = 'none';
            }
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
        if (!selectedService || !selectedDateTime) {
            console.error('Service or datetime not selected for summary update.');
            return;
        }

        document.getElementById('summary-service').textContent = selectedService.name;
        document.getElementById('summary-datetime').textContent = selectedDateTime.toLocaleString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        // Используем рассчитанную цену, если она есть, иначе базовую
        document.getElementById('summary-price').textContent = selectedService.calculated_price ? `${selectedService.calculated_price} руб.` : `${selectedService.base_price} руб.`;
        document.getElementById('summary-name').textContent = document.getElementById('client-name').value.trim();
        document.getElementById('summary-phone').textContent = document.getElementById('client-phone').value.trim();
        document.getElementById('summary-car').textContent = document.getElementById('client-car').value.trim();
    }
    
    // Отправка формы
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateStep(4)) return;
        try {
            // 1. Создаём/получаем клиента
            const customerRes = await fetch('http://localhost:5000/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('client-name').value.trim(),
                    phone: document.getElementById('client-phone').value.trim(),
                    email: document.getElementById('client-email').value.trim() || null
                })
            });
            const customerData = await customerRes.json();
            if (!customerData.id) {
                alert('Ошибка создания клиента');
                return;
            }
            // 2. Создаём бронирование
            const bookingData = {
                customer_id: customerData.id,
                service_id: parseInt(selectedService.id),
                booking_date: selectedDateTime.date,
                start_time: selectedDateTime.start,
                end_time: selectedDateTime.end,
                notes: document.getElementById('client-notes').value.trim() || null
            };
            const response = await fetch('http://localhost:5000/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookingData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка при создании записи');
            }
            const result = await response.json();
            // Показываем сообщение об успехе
            bookingForm.hidden = true;
            document.getElementById('booking-success').hidden = false;
            document.getElementById('success-details').innerHTML = `
                <p><strong>Услуга:</strong> ${selectedService.name}</p>
                <p><strong>Дата:</strong> ${selectedDateTime.date} ${selectedDateTime.start}</p>
            `;
        } catch (error) {
            console.error('Ошибка:', error);
            alert(`Ошибка бронирования: ${error.message}`);
        }
    });
});