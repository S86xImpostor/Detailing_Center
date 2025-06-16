document.addEventListener('DOMContentLoaded', () => {
    // Фильтрация галереи
    const filterButtons = document.querySelectorAll('.gallery-filters .btn-outline');
    const galleryContainer = document.getElementById('gallery-container');

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Обновление активной кнопки
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');
            
            // Анимация фильтрации
            galleryContainer.style.opacity = '0';
            setTimeout(() => {
                const category = this.dataset.category;
                const items = document.querySelectorAll('.gallery-item');
                
                items.forEach(item => {
                    const show = category === 'all' || item.dataset.category === category;
                    item.style.display = show ? 'block' : 'none';
                });
                
                galleryContainer.style.opacity = '1';
            }, 300);
        });
    });

    // Удаляем инициализацию before/after слайдера
    /*
    const initSlider = container => {
        let isDragging = false;
        
        const updateSlider = (xPos) => {
            const rect = container.getBoundingClientRect();
            const percentage = Math.min(Math.max((xPos - rect.left) / rect.width, 0), 1) * 100;
            container.querySelector('.before').style.clipPath = 
                `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
        };

        // Обработчики событий
        container.addEventListener('mousedown', () => isDragging = true);
        container.addEventListener('mouseup', () => isDragging = false);
        container.addEventListener('mouseleave', () => isDragging = false);
        container.addEventListener('mousemove', e => isDragging && updateSlider(e.clientX));
        
        // Сенсорные события
        container.addEventListener('touchstart', () => isDragging = true);
        container.addEventListener('touchend', () => isDragging = false);
        container.addEventListener('touchmove', e => {
            if (isDragging) {
                e.preventDefault();
                updateSlider(e.touches[0].clientX);
            }
        }, { passive: false });
    };

    document.querySelectorAll('.before-after-container').forEach(initSlider);
    */
});