import sqlite3
import os
from datetime import datetime

def init_services_data():
    try:
        # Подключаемся к базе данных
        db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
        print(f"Подключение к базе данных: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Создаем тестового админа (если его нет)
        cursor.execute("""
            INSERT OR IGNORE INTO admins (
                username, password_hash, full_name, email, role
            ) VALUES (
                'admin', 
                'pbkdf2:sha256:260000$qiPuAeAMYJ3A2ZY0$f1c1c76b7e194ae7a4c0a3428a01824f5d1c6b1c3b6b4b2b8b8f8d9e8c7b6a5',
                'Администратор',
                'admin@example.com',
                'admin'
            )
        """)
        admin_id = cursor.lastrowid or 1

        # Добавляем категории услуг
        categories = [
            ('Мойка автомобиля', 'wash', 'Услуги мойки автомобиля', 1),
            ('Полировка', 'polish', 'Услуги полировки кузова', 2),
            ('Защитные покрытия', 'coating', 'Нанесение защитных покрытий', 3),
            ('Уход за салоном', 'interior', 'Услуги по уходу за салоном', 4)
        ]
        
        cursor.executemany("""
            INSERT OR IGNORE INTO service_categories (
                category_name, category_slug, description, display_order
            ) VALUES (?, ?, ?, ?)
        """, categories)

        # Получаем ID категорий
        category_ids = {}
        for category in categories:
            cursor.execute("SELECT category_id FROM service_categories WHERE category_slug = ?", (category[1],))
            category_ids[category[1]] = cursor.fetchone()[0]

        # Добавляем услуги
        services = [
            # Мойка
            (category_ids['wash'], 'Экспресс-мойка', 'Быстрая мойка кузова без химчистки салона', 1500, 60),
            (category_ids['wash'], 'Комплексная мойка', 'Полная мойка кузова с химчисткой салона', 3000, 120),
            (category_ids['wash'], 'Детейлинг мойка', 'Тщательная мойка с обработкой всех деталей', 5000, 180),
            
            # Полировка
            (category_ids['polish'], 'Полировка фар', 'Восстановление прозрачности фар', 2000, 60),
            (category_ids['polish'], 'Полировка кузова', 'Удаление мелких царапин и восстановление блеска', 8000, 240),
            (category_ids['polish'], 'Абразивная полировка', 'Глубокая полировка с удалением серьезных дефектов', 12000, 360),
            
            # Покрытия
            (category_ids['coating'], 'Жидкое стекло', 'Защитное покрытие на основе жидкого стекла', 15000, 180),
            (category_ids['coating'], 'Керамическое покрытие', 'Нанесение керамического защитного слоя', 25000, 240),
            (category_ids['coating'], 'Антидождь', 'Нанесение водоотталкивающего покрытия', 3000, 60),
            
            # Салон
            (category_ids['interior'], 'Химчистка сидений', 'Глубокая очистка сидений', 4000, 120),
            (category_ids['interior'], 'Полная химчистка салона', 'Комплексная химчистка всего салона', 8000, 240),
            (category_ids['interior'], 'Озонирование', 'Дезинфекция салона озоном', 2000, 60)
        ]

        # Добавляем услуги в базу
        cursor.executemany("""
            INSERT OR IGNORE INTO services (
                category_id, service_name, description, base_price, duration_minutes,
                is_active, created_by, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, 1, ?, ?
            )
        """, [(s[0], s[1], s[2], s[3], s[4], admin_id, datetime.now().isoformat()) for s in services])

        # Сохраняем изменения
        conn.commit()
        print("Данные успешно добавлены в базу")

    except Exception as e:
        print(f"Ошибка при инициализации данных: {e}")
        conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    init_services_data() 