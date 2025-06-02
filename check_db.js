const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err);
        return;
    }
    console.log('Подключение к базе данных успешно');

    // Проверяем таблицу категорий
    db.all('SELECT * FROM service_categories', [], (err, categories) => {
        if (err) {
            console.error('Ошибка при получении категорий:', err);
        } else {
            console.log('\nКатегории услуг:');
            console.log(categories);
        }

        // Проверяем таблицу услуг
        db.all(`
            SELECT s.*, sc.category_name, sc.category_slug
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.category_id
            WHERE s.is_active = 1
        `, [], (err, services) => {
            if (err) {
                console.error('Ошибка при получении услуг:', err);
            } else {
                console.log('\nУслуги:');
                console.log(services);
            }

            // Закрываем соединение
            db.close((err) => {
                if (err) {
                    console.error('Ошибка при закрытии базы данных:', err);
                } else {
                    console.log('\nСоединение с базой данных закрыто');
                }
            });
        });
    });
}); 