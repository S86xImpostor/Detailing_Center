const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), async (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err);
        return;
    }
    console.log('Подключение к базе данных успешно');

    try {
        // Читаем SQL файл
        const sql = fs.readFileSync('dump.sql', 'utf8');
        const statements = sql.split(';').filter(stmt => stmt.trim());

        // Выполняем каждый SQL запрос
        for (const statement of statements) {
            if (statement.trim()) {
                await new Promise((resolve, reject) => {
                    db.run(statement, (err) => {
                        if (err) {
                            console.error('Ошибка при выполнении:', err);
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }
        }

        // Создаем тестового админа
        await new Promise((resolve, reject) => {
            db.run(`
                INSERT OR IGNORE INTO admins (username, password_hash, full_name, email, role)
                VALUES (?, ?, ?, ?, ?)
            `, [
                'admin',
                'pbkdf2:sha256:260000$qiPuAeAMYJ3A2ZY0$f1c1c76b7e194ae7a4c0a3428a01824f5d1c6b1c3b6b4b2b8b8f8d9e8c7b6a5',
                'Администратор',
                'admin@example.com',
                'admin'
            ], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Добавляем категории услуг
        const categories = [
            ['Мойка автомобиля', 'wash', 'Услуги мойки автомобиля', 1],
            ['Полировка', 'polish', 'Услуги полировки кузова', 2],
            ['Защитные покрытия', 'coating', 'Нанесение защитных покрытий', 3],
            ['Уход за салоном', 'interior', 'Услуги по уходу за салоном', 4]
        ];

        for (const [name, slug, desc, order] of categories) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR IGNORE INTO service_categories (category_name, category_slug, description, display_order)
                    VALUES (?, ?, ?, ?)
                `, [name, slug, desc, order], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        // Получаем ID админа
        const admin = await new Promise((resolve, reject) => {
            db.get('SELECT admin_id FROM admins WHERE username = ?', ['admin'], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // Получаем ID категорий
        const categoryIds = {};
        for (const [name, slug] of categories) {
            const category = await new Promise((resolve, reject) => {
                db.get('SELECT category_id FROM service_categories WHERE category_slug = ?', [slug], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            categoryIds[slug] = category.category_id;
        }

        // Добавляем услуги
        const services = [
            // Мойка
            [categoryIds['wash'], 'Экспресс-мойка', 'Быстрая мойка кузова без химчистки салона', 1500, 60],
            [categoryIds['wash'], 'Комплексная мойка', 'Полная мойка кузова с химчисткой салона', 3000, 120],
            [categoryIds['wash'], 'Детейлинг мойка', 'Тщательная мойка с обработкой всех деталей', 5000, 180],
            
            // Полировка
            [categoryIds['polish'], 'Полировка фар', 'Восстановление прозрачности фар', 2000, 60],
            [categoryIds['polish'], 'Полировка кузова', 'Удаление мелких царапин и восстановление блеска', 8000, 240],
            [categoryIds['polish'], 'Абразивная полировка', 'Глубокая полировка с удалением серьезных дефектов', 12000, 360],
            
            // Покрытия
            [categoryIds['coating'], 'Жидкое стекло', 'Защитное покрытие на основе жидкого стекла', 15000, 180],
            [categoryIds['coating'], 'Керамическое покрытие', 'Нанесение керамического защитного слоя', 25000, 240],
            [categoryIds['coating'], 'Антидождь', 'Нанесение водоотталкивающего покрытия', 3000, 60],
            
            // Салон
            [categoryIds['interior'], 'Химчистка сидений', 'Глубокая очистка сидений', 4000, 120],
            [categoryIds['interior'], 'Полная химчистка салона', 'Комплексная химчистка всего салона', 8000, 240],
            [categoryIds['interior'], 'Озонирование', 'Дезинфекция салона озоном', 2000, 60]
        ];

        for (const [categoryId, name, desc, price, duration] of services) {
            await new Promise((resolve, reject) => {
                db.run(`
                    INSERT OR IGNORE INTO services (
                        category_id, service_name, description, base_price, 
                        duration_minutes, is_active, created_by, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, 1, ?, datetime('now'))
                `, [categoryId, name, desc, price, duration, admin.admin_id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }

        console.log('База данных успешно инициализирована');
    } catch (error) {
        console.error('Ошибка при инициализации базы данных:', error);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('Ошибка при закрытии базы данных:', err);
            } else {
                console.log('Соединение с базой данных закрыто');
            }
        });
    }
}); 