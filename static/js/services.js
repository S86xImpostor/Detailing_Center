// Глобальные переменные для хранения данных
window.servicesData = [];
window.categoriesData = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadServices();
        
        // Инициализируем фильтры только на странице услуг
        if (window.location.pathname.includes('services.html')) {
            initFilters();
            initCalculator();
        }
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
});

// Загрузка услуг из API
async function loadServices() {
    try {
        console.log('Начинаем загрузку услуг');
        // Загружаем услуги
        const response = await fetch('/api/services');
        if (!response.ok) {
            throw new Error('Ошибка при загрузке услуг');
        }
        window.servicesData = await response.json();
        console.log('Получены услуги:', window.servicesData);
        
        // Загружаем категории
        const categoriesResponse = await fetch('/api/services/categories');
        if (!categoriesResponse.ok) {
            throw new Error('Ошибка при загрузке категорий');
        }
        window.categoriesData = await categoriesResponse.json();
        console.log('Получены категории:', window.categoriesData);
        
        // Обновляем фильтр категорий на странице услуг
        if (window.location.pathname.includes('services.html')) {
            updateCategoryFilter();
        }
        
        // Отображаем услуги
        if (document.getElementById('services-container')) {
            displayServices(window.servicesData);
        }
        
        // Заполняем калькулятор на странице услуг
        if (window.location.pathname.includes('services.html')) {
            populateCalculator(window.servicesData);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        const container = document.getElementById('services-container');
        if (container) {
            container.innerHTML = '<p class="error">Не удалось загрузить услуги. Пожалуйста, попробуйте позже.</p>';
        }
        throw error;
    }
}

// Обновление фильтра категорий
function updateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = '<option value="">Все категории</option>';
    
    window.categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.category_slug;
        option.textContent = category.category_name;
        categoryFilter.appendChild(option);
    });
}

// Отображение услуг
function displayServices(services) {
    const container = document.getElementById('services-container');
    if (!container) return;

    container.innerHTML = '';

    if (!services || services.length === 0) {
        container.innerHTML = '<p class="no-results">По вашему запросу услуг не найдено</p>';
        return;
    }

    services.forEach(service => {
        console.log('Отображаем услугу (детально):', service);
        const card = document.createElement('div');
        card.className = 'service-card-page';
        card.innerHTML = `
            ${service.image_url ? `<img src="${service.image_url}" alt="${service.service_name || 'Услуга'}">` : ''}
            <h3>${service.service_name || 'Без названия'}</h3>
            <p>${service.description || 'Описание отсутствует'}</p>
            <div class="price">${service.base_price || 0} руб.</div>
            <div class="duration">Длительность: ${Math.floor((service.duration_minutes || 0) / 60)} ч.</div>
            <a href="booking.html?service=${service.service_id || service.id}&autostart=true" class="btn-primary">Записаться</a>
        `;
        container.appendChild(card);
    });
}

// Заполнение калькулятора
function populateCalculator(services) {
    const select = document.getElementById('calc-service');
    if (!select) return;

    select.innerHTML = '<option value="">-- Выберите услугу --</option>';

    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.service_id;
        option.textContent = `${service.service_name} (${service.base_price} руб.)`;
        select.appendChild(option);
    });
}

// Фильтрация услуг
function applyFilters() {
    if (!window.servicesData || !window.servicesData.length) {
        console.warn('Данные услуг еще не загружены');
        return;
    }

    const selectedCategorySlug = document.getElementById('category-filter')?.value || '';
    const minPrice = parseInt(document.getElementById('price-from')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('price-to')?.value) || Infinity;
    const durationFilterValue = parseInt(document.getElementById('duration-filter')?.value) || Infinity;

    console.log('Применяем фильтры:', { selectedCategorySlug, minPrice, maxPrice, durationFilterValue });
    console.log('Все услуги:', window.servicesData);
    console.log('Все категории:', window.categoriesData);

    let targetCategoryId = null;
    if (selectedCategorySlug !== '') {
        const selectedCategory = window.categoriesData.find(cat => cat.category_slug === selectedCategorySlug);
        if (selectedCategory) {
            targetCategoryId = selectedCategory.category_id;
        }
    }
    console.log('Целевой category_id для фильтрации:', targetCategoryId);

    const filtered = window.servicesData.filter(service => {
        const matchesCategory = selectedCategorySlug === '' || service.category_id === targetCategoryId;
        const matchesPrice = service.base_price >= minPrice && 
                           (maxPrice === Infinity || service.base_price <= maxPrice);
        const matchesDuration = durationFilterValue === Infinity || service.duration_minutes <= durationFilterValue * 60;

        console.log('Проверяем услугу:', {
            serviceName: service.service_name,
            serviceCategoryId: service.category_id,
            targetCategoryId: targetCategoryId,
            selectedCategorySlug: selectedCategorySlug,
            matchesCategory: matchesCategory,
            matchesPrice: matchesPrice,
            matchesDuration: matchesDuration,
            overallMatch: matchesCategory && matchesPrice && matchesDuration
        });

        return matchesCategory && matchesPrice && matchesDuration;
    });

    console.log('Отфильтрованные услуги:', filtered);
    displayServices(filtered);
}

// Инициализация фильтров
function initFilters() {
    const form = document.getElementById('services-filter');
    if (!form) return;

    // Добавляем обработчики событий
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            displayServices(window.servicesData);
        }, 0);
    });

    // Удаляем обработчики для живого обновления
    /*
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            applyFilters();
        });
    });
    */
}

// Инициализация калькулятора
function initCalculator() {
    const calculateBtn = document.getElementById('calculate-btn');
    if (!calculateBtn) return;

    calculateBtn.addEventListener('click', calculatePrice);
}

// Расчет цены
function calculatePrice() {
    const serviceId = parseInt(document.getElementById('calc-service')?.value);
    if (!serviceId) {
        alert('Пожалуйста, выберите услугу');
        return;
    }

    const service = window.servicesData.find(s => s.service_id === serviceId);
    if (!service) {
        console.error('Услуга с ID', serviceId, 'не найдена.');
        return;
    }

    const premium = document.getElementById('premium-materials')?.checked || false;
    const express = document.getElementById('express-service')?.checked || false;
    const carSize = document.getElementById('car-size')?.value || 'medium';

    let price = service.base_price;
    
    // Применяем коэффициенты
    if (premium) price *= 1.2;
    if (express) price *= 1.3;
    
    // Коэффициенты размера авто
    const sizeMultipliers = {
        small: 1,
        medium: 1.2,
        large: 1.5,
        xlarge: 2
    };
    price *= sizeMultipliers[carSize] || 1;
    
    // Отображение результата
    const resultPrice = document.getElementById('result-price');
    const resultDetails = document.getElementById('result-details');
    const bookNowBtn = document.getElementById('book-now-btn');

    if (resultPrice) resultPrice.textContent = Math.round(price) + ' руб.';
    
    if (resultDetails) {
        let details = `Базовая цена: ${service.base_price} руб.<br>`;
        if (premium) details += `+ Премиум материалы (20%)<br>`;
        if (express) details += `+ Срочный заказ (30%)<br>`;
        details += `× Размер авто: ${getSizeName(carSize)}`;
        resultDetails.innerHTML = details;
    }
    
    if (bookNowBtn) {
        bookNowBtn.style.display = 'inline-block';
        bookNowBtn.href = `booking.html?service=${serviceId}&premium=${premium}&express=${express}&carSize=${carSize}&totalPrice=${Math.round(price)}&autostart=true`;
    }
}

// Вспомогательная функция для получения названия размера автомобиля
function getSizeName(size) {
    const sizes = {
        small: 'Малый (седан, хэтчбек)',
        medium: 'Средний (кроссовер, универсал)',
        large: 'Большой (внедорожник, минивэн)',
        xlarge: 'Очень большой (пикап, микроавтобус)'
    };
    return sizes[size] || size;
}