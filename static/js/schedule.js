document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'ru',
        timeZone: 'Europe/Moscow',
        slotMinTime: '09:00:00',
        slotMaxTime: '21:00:00',
        weekends: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay'
        },
        events: async (fetchInfo, successCallback, failureCallback) => {
            try {
                // Здесь будет реальный запрос к API
                const mockEvents = [
                    {
                        title: 'Запись: Комплексная мойка',
                        start: new Date().setHours(10, 0, 0, 0),
                        end: new Date().setHours(11, 30, 0, 0),
                        color: '#e74c3c',
                        extendedProps: {
                            status: 'booked'
                        }
                    },
                    {
                        title: 'Доступно',
                        start: new Date().setHours(12, 0, 0, 0),
                        end: new Date().setHours(13, 0, 0, 0),
                        color: '#2ecc71',
                        extendedProps: {
                            status: 'available'
                        }
                    }
                ];
                successCallback(mockEvents);
                
            } catch (error) {
                console.error('Calendar error:', error);
                failureCallback(error);
                showCalendarError();
            }
        },
        eventDidMount: (info) => {
            const status = info.event.extendedProps.status;
            info.el.setAttribute('role', 'button');
            info.el.setAttribute('aria-label', status === 'available' ? 'Доступное время для записи' : `Запись: ${info.event.title}`);
        },
        dateClick: async (info) => {
            if (info.view.type === 'timeGridWeek') {
                try {
                    // Здесь будет вызов модального окна для записи
                    console.log('Selected date:', info.date);
                } catch (error) {
                    console.error('Modal error:', error);
                    showCalendarError('Не удалось загрузить услуги');
                }
            }
        }
    });

    calendar.render();

    function showCalendarError(message = 'Ошибка загрузки данных') {
        const alert = document.createElement('div');
        alert.className = 'calendar-alert error';
        alert.textContent = message;
        calendarEl.prepend(alert);
        setTimeout(() => alert.remove(), 5000);
    }
});