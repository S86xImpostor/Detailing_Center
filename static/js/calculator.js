class ServiceCalculator {
    static calculate(serviceId, options) {
        const service = servicesData.find(s => s.id === serviceId);
        if (!service) return Promise.reject("Услуга не найдена");

        let total = service.base_price;
        if (options.premiumMaterials) total *= 1.2;
        if (options.express) total *= 1.3;
        
        switch (options.carSize) {
            case 'large': total *= 1.2; break;
            case 'xlarge': total *= 1.5; break;
        }
        
        return Promise.resolve(total.toFixed(2));
    }
}