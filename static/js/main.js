document.addEventListener('DOMContentLoaded', () => {
    // Функция для отображения услуг
    const renderServices = (services) => {
        const container = document.getElementById('services-container');
        if (!container) return;
        
        if (!services || services.length === 0) {
            container.innerHTML = '<p class="error">Услуги не найдены</p>';
            return;
        }
        
        container.innerHTML = services.map(service => {
            // Добавляем проверку данных
            console.log('Отображаем услугу:', service);
            
            return `
                <div class="service-card">
                    ${service.image_url ? `<img src="${service.image_url}" alt="${service.service_name || 'Услуга'}">` : ''}
                    <div class="card-content">
                        <h3>${service.service_name || 'Без названия'}</h3>
                        <p>${service.description || 'Описание отсутствует'}</p>
                        <div class="price">${service.base_price || 0} ₽</div>
                        <div class="duration">Длительность: ${Math.floor((service.duration_minutes || 0) / 60)} ч.</div>
                        <a href="booking.html?service=${service.service_id}" class="btn-primary">Записаться</a>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Инициализация модулей
    const initModules = {
        servicesFilter: () => {
            const applyFilters = async () => {
                const container = document.getElementById('services-container');
                if (!container) return;
                
                try {
                    container.innerHTML = '<div class="loading-animation"></div>';
                    
                    const category = document.getElementById('category-filter')?.value || '';
                    const minPrice = parseInt(document.getElementById('price-min')?.value) || 0;
                    const maxPrice = parseInt(document.getElementById('price-max')?.value) || Infinity;
                    
                    // Получаем данные из глобальной переменной servicesData
                    if (!window.servicesData || window.servicesData.length === 0) {
                        throw new Error('Данные услуг не загружены');
                    }
                    
                    // Применяем фильтры
                    const filteredServices = window.servicesData.filter(service => {
                        console.log('Проверяем услугу:', service);
                        return (category === "" || service.category_slug === category) &&
                               service.base_price >= minPrice && 
                               service.base_price <= maxPrice;
                    });
                    
                    console.log('Отфильтрованные услуги:', filteredServices);
                    renderServices(filteredServices);
                    
                } catch (error) {
                    console.error('Ошибка фильтра:', error);
                    container.innerHTML = `<p class="error">Ошибка загрузки услуг. Пожалуйста, попробуйте позже.</p>`;
                }
            };

            // Обновление значений диапазона цен
            const updatePriceValues = () => {
                document.getElementById('min-value').textContent = `${document.getElementById('price-min')?.value || 0} ₽`;
                document.getElementById('max-value').textContent = `${document.getElementById('price-max')?.value || 10000} ₽`;
            };

            // Инициализация обработчиков событий
            document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
            document.getElementById('category-filter')?.addEventListener('change', applyFilters);
            document.getElementById('price-min')?.addEventListener('input', updatePriceValues);
            document.getElementById('price-max')?.addEventListener('input', updatePriceValues);
            
            // Первоначальная загрузка
            if (document.getElementById('services-container')) {
                updatePriceValues();
                applyFilters();
            }
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