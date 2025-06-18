// Функция для добавления записи в историю операций
function addHistoryEntry(type, action, details) {
    const history = JSON.parse(localStorage.getItem('operationHistory')) || [];
    const entry = {
        id: Date.now(),
        date: new Date().toISOString(),
        type,
        action,
        user: sessionStorage.getItem('adminUsername') || 'admin',
        details
    };
    history.unshift(entry); // Добавляем новую запись в начало массива
    localStorage.setItem('operationHistory', JSON.stringify(history));
}

// Функция для загрузки истории операций
function loadHistory(filters = {}) {
    const history = JSON.parse(localStorage.getItem('operationHistory')) || [];
    const tbody = document.getElementById('history-table-body');
    
    let filteredHistory = history;
    
    // Применяем фильтры
    if (filters.type && filters.type !== 'all') {
        filteredHistory = filteredHistory.filter(entry => entry.type === filters.type);
    }
    
    if (filters.date) {
        const filterDate = new Date(filters.date).toDateString();
        filteredHistory = filteredHistory.filter(entry => 
            new Date(entry.date).toDateString() === filterDate
        );
    }
    
    tbody.innerHTML = filteredHistory.map(entry => `
        <tr>
            <td>${new Date(entry.date).toLocaleString()}</td>
            <td>${getOperationTypeName(entry.type)}</td>
            <td>${entry.action}</td>
            <td>${entry.user}</td>
            <td>${entry.details}</td>
        </tr>
    `).join('');
}

// Функция для получения названия типа операции
function getOperationTypeName(type) {
    const types = {
        service: 'Услуга',
        booking: 'Запись',
        feedback: 'Отзыв'
    };
    return types[type] || type;
}

// Инициализация фильтров истории
function initHistoryFilters() {
    const typeFilter = document.getElementById('history-type-filter');
    const dateFilter = document.getElementById('history-date-filter');
    const clearButton = document.getElementById('clear-filters');
    
    typeFilter.addEventListener('change', () => {
        loadHistory({
            type: typeFilter.value,
            date: dateFilter.value
        });
    });
    
    dateFilter.addEventListener('change', () => {
        loadHistory({
            type: typeFilter.value,
            date: dateFilter.value
        });
    });
    
    clearButton.addEventListener('click', () => {
        typeFilter.value = 'all';
        dateFilter.value = '';
        loadHistory();
    });
}

// Экспортируем функции для использования в других файлах
window.historyManager = {
    addHistoryEntry,
    loadHistory,
    initHistoryFilters
}; 