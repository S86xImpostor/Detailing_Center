class ServiceCalculator {
    static async calculate(serviceId, options) {
        // Находим услугу в глобальном массиве servicesData
        const service = servicesData.find(s => s.id === parseInt(serviceId));
        if (!service) return Promise.reject("Услуга не найдена");

        let total = service.base_price;
        
        // Применяем модификаторы
        if (options.premiumMaterials) total *= 1.2;
        if (options.express) total *= 1.3;
        
        // Применяем коэффициент размера автомобиля
        const sizeMultipliers = {
            'small': 1,
            'medium': 1.2,
            'large': 1.5,
            'xlarge': 2
        };
        
        total *= sizeMultipliers[options.carSize] || 1;
        
        return Promise.resolve(Math.round(total));
    }
}