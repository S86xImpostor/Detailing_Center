// Локальные данные об услугах
const servicesData = [
    {
        id: 1,
        name: "Комплексная мойка",
        description: "Полная наружная мойка + химчистка салона",
        category: "wash",
        base_price: 3000,
        duration: 2
    },
    {
        id: 2,
        name: "Полировка кузова",
        description: "Восстановление ЛКП с защитным покрытием",
        category: "polish",
        base_price: 8000,
        duration: 4
    }
];

document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    initFilters();
});

// Загрузка услуг из локальных данных
function loadServices() {
    displayServices(servicesData);
    populateCalculator(servicesData);
}

// Отображение услуг
function displayServices(services) {
    const container = document.getElementById('services-container');
    container.innerHTML = '';

    if (services.length === 0) {
        container.innerHTML = '<p class="no-results">По вашему запросу услуг не найдено</p>';
        return;
    }

    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card-page';
        card.innerHTML = `
            <h3>${service.name}</h3>
            <p>${service.description}</p>
            <div class="price">${service.base_price} руб.</div>
            <div class="duration">Длительность: ${service.duration} ч.</div>
        `;
        container.appendChild(card);
    });
}

// Заполнение калькулятора
function populateCalculator(services) {
    const select = document.getElementById('calc-service');
    select.innerHTML = '<option value="">-- Выберите услугу --</option>';

    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} (${service.base_price} руб.)`;
        select.appendChild(option);
    });
}

// Фильтрация на клиенте
function applyFilters() {
    const category = document.getElementById('category-filter').value;
    const minPrice = parseInt(document.getElementById('price-from').value) || 0;
    const maxPrice = parseInt(document.getElementById('price-to').value) || Infinity;
    const duration = document.getElementById('duration-filter').value;

    const filtered = servicesData.filter(service => {
        return (category === '' || service.category === category) &&
               service.base_price >= minPrice &&
               service.base_price <= maxPrice &&
               (duration === '' || service.duration <= duration);
    });

    displayServices(filtered);
}

function initFilters() {
    const form = document.getElementById('services-filter');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        applyFilters();
    });

    form.addEventListener('reset', () => {
        setTimeout(() => {
            loadServices();
        }, 0);
    });
}

// Инициализация калькулятора
document.getElementById('calculate-btn').addEventListener('click', calculatePrice);

function calculatePrice() {
    const serviceId = parseInt(document.getElementById('calc-service').value);
    const premium = document.getElementById('premium-materials').checked;
    const express = document.getElementById('express-service').checked;
    const carSize = document.getElementById('car-size').value;
    
    if (!serviceId) {
        alert('Пожалуйста, выберите услугу');
        return;
    }

    const service = servicesData.find(s => s.id === serviceId);
    if (!service) return;

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
    document.getElementById('result-price').textContent = Math.round(price) + ' руб.';
    
    let details = `Базовая цена: ${service.base_price} руб.<br>`;
    if (premium) details += `+ Премиум материалы (20%)<br>`;
    if (express) details += `+ Срочный заказ (30%)<br>`;
    details += `× Размер авто: ${getSizeName(carSize)}`;
    
    document.getElementById('result-details').innerHTML = details;
    document.getElementById('book-now-btn').style.display = 'inline-block';
}

function getSizeName(size) {
    const sizes = {
        small: 'Малый',
        medium: 'Средний',
        large: 'Большой',
        xlarge: 'Очень большой'
    };
    return sizes[size] || '';
}