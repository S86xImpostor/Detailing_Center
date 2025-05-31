document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('feedbackForm');
    const ratingStars = document.querySelectorAll('.rating-stars i');
    const ratingInput = document.getElementById('rating');
    const feedbackList = document.getElementById('feedbackList');

    // Загрузка существующих отзывов
    fetchFeedbacks();

    // Обработка звездного рейтинга
    ratingStars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            highlightStars(rating);
        });

        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            ratingInput.value = rating;
            highlightStars(rating);
        });
    });

    document.querySelector('.rating-stars').addEventListener('mouseleave', function() {
        if (!ratingInput.value) {
            clearStars();
        } else {
            highlightStars(ratingInput.value);
        }
    });

    // Отправка формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value || null,
            rating: parseInt(ratingInput.value),
            message: document.getElementById('message').value
        };

        try {
            // Сначала создаем или получаем клиента
            const customerResponse = await fetch('/api/customers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email
                })
            });

            if (!customerResponse.ok) {
                throw new Error('Ошибка при создании клиента');
            }

            const customerData = await customerResponse.json();
            
            // Затем создаем отзыв
            const feedbackResponse = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer_id: customerData.id,
                    rating: formData.rating,
                    message: formData.message,
                    status: 'approved',
                    is_anonymous: formData.email ? 0 : 1
                })
            });

            if (!feedbackResponse.ok) {
                throw new Error('Ошибка при создании отзыва');
            }

            // Обновляем список отзывов
            await fetchFeedbacks();
            
            // Очищаем форму
            form.reset();
            clearStars();
            ratingInput.value = '';
            
            alert('Спасибо за ваш отзыв!');
            
        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message);
        }
    });

    function highlightStars(rating) {
        ratingStars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.style.color = starRating <= rating ? '#ffd700' : '#ddd';
        });
    }

    function clearStars() {
        ratingStars.forEach(star => {
            star.style.color = '#ddd';
        });
    }

    async function fetchFeedbacks() {
        try {
            const response = await fetch('/api/feedback');
            if (!response.ok) {
                throw new Error('Ошибка при загрузке отзывов');
            }
            const feedbacks = await response.json();
            
            // Получаем информацию о клиентах
            const feedbacksWithCustomers = await Promise.all(
                feedbacks.map(async feedback => {
                    if (feedback.customer_id) {
                        const customerResponse = await fetch(`/api/customers?customer_id=${feedback.customer_id}`);
                        if (customerResponse.ok) {
                            const [customer] = await customerResponse.json();
                            return { ...feedback, customer_name: customer.name };
                        }
                    }
                    return { ...feedback, customer_name: 'Анонимный пользователь' };
                })
            );

            // Отображаем отзывы
            feedbackList.innerHTML = feedbacksWithCustomers.map(feedback => `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div class="feedback-author">${feedback.customer_name}</div>
                        <div class="feedback-rating">
                            ${Array(5).fill(0).map((_, i) => 
                                `<i class="${i < feedback.rating ? 'fas' : 'far'} fa-star"></i>`
                            ).join('')}
                        </div>
                        <div class="feedback-date">${new Date(feedback.created_at).toLocaleDateString()}</div>
                    </div>
                    <div class="feedback-text">
                        ${feedback.message}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка:', error);
            feedbackList.innerHTML = '<p>Ошибка при загрузке отзывов</p>';
        }
    }
});