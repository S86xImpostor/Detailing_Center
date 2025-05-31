document.addEventListener('DOMContentLoaded', () => {
    // Функция для отображения услуг
    const renderServices = (services) => {
        const container = document.getElementById('services-container');
        if (!container) return;
        
        if (services.length === 0) {
            container.innerHTML = '<p class="error">Услуги не найдены</p>';
            return;
        }
        
        container.innerHTML = services.map(service => `
            <div class="service-card">
                <img src="${service.image}" alt="${service.name}">
                <div class="card-content">
                    <h3>${service.name}</h3>
                    <p>${service.description}</p>
                    <div class="price">${service.price} ₽</div>
                    <a href="booking.html?service=${service.id}" class="btn-primary">Записаться</a>
                </div>
            </div>
        `).join('');
    };

    // Инициализация модулей
    const initModules = {
        servicesFilter: () => {
            const applyFilters = async () => {
                const container = document.getElementById('services-container');
                if (!container) return;
                
                try {
                    container.innerHTML = '<div class="loading-animation"></div>';
                    
                    const category = document.getElementById('category-filter').value;
                    const minPrice = document.getElementById('price-min').value;
                    const maxPrice = document.getElementById('price-max').value;
                    
                    // Заглушка для демонстрации (в реальном проекте заменить на реальный API-запрос)
                    const mockServices = [
                        {
                            id: 1,
                            name: "Комплексная мойка",
                            description: "Полная очистка кузова и салона",
                            price: 3000,
                            image: "images/Moika_BMW.jpg",
                            category: "wash"
                        },
                        {
                            id: 2,
                            name: "Полировка кузова",
                            description: "Удаление царапин и восстановление блеска",
                            price: 5000,
                            image: "images/Polirovka_BMW.jpg",
                            category: "polish"
                        }
                    ].filter(service => 
                        (category === "" || service.category === category) &&
                        service.price >= minPrice && 
                        service.price <= maxPrice
                    );

                    // Имитация задержки сети
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    renderServices(mockServices);
                    
                } catch (error) {
                    console.error('Ошибка фильтра:', error);
                    container.innerHTML = `<p class="error">Ошибка загрузки услуг. Пожалуйста, попробуйте позже.</p>`;
                }
            };

            // Обновление значений диапазона цен
            const updatePriceValues = () => {
                document.getElementById('min-value').textContent = `${document.getElementById('price-min').value} ₽`;
                document.getElementById('max-value').textContent = `${document.getElementById('price-max').value} ₽`;
            };

            // Инициализация обработчиков событий
            document.getElementById('apply-filters').addEventListener('click', applyFilters);
            document.getElementById('category-filter').addEventListener('change', applyFilters);
            document.getElementById('price-min').addEventListener('input', updatePriceValues);
            document.getElementById('price-max').addEventListener('input', updatePriceValues);
            
            // Первоначальная загрузка
            updatePriceValues();
            applyFilters();
        },
        
        bookingSystem: () => {
            // Проверяем, есть ли форма бронирования на странице
            if (document.getElementById('booking-form')) {
                // Динамический импорт модуля бронирования
                import('./booking.js')
                    .then(module => {
                        if (module && typeof module.init === 'function') {
                            module.init();
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка загрузки модуля бронирования:', error);
                    });
            }
        }
    };

    // Активация модулей
    Object.values(initModules).forEach(module => {
        try {
            module();
        } catch (error) {
            console.error('Ошибка инициализации модуля:', error);
        }
    });
});