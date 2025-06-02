import sqlite3
import os

def check_services_data():
    try:
        # Подключаемся к базе данных
        db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
        print(f"Подключение к базе данных: {db_path}")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Проверяем таблицу категорий
        print("\nПроверка таблицы service_categories:")
        cursor.execute("SELECT * FROM service_categories")
        categories = cursor.fetchall()
        if categories:
            print(f"Найдено категорий: {len(categories)}")
            for category in categories:
                print(f"ID: {category[0]}, Название: {category[1]}, Slug: {category[2]}")
        else:
            print("Таблица категорий пуста")

        # Проверяем таблицу услуг
        print("\nПроверка таблицы services:")
        cursor.execute("""
            SELECT s.*, sc.category_name 
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.category_id
            WHERE s.is_active = 1
        """)
        services = cursor.fetchall()
        if services:
            print(f"Найдено активных услуг: {len(services)}")
            for service in services:
                print(f"ID: {service[0]}, Название: {service[2]}, Цена: {service[4]}, Категория: {service[-1]}")
        else:
            print("Таблица услуг пуста или нет активных услуг")

    except sqlite3.OperationalError as e:
        if "no such table" in str(e):
            print(f"Ошибка: таблица не существует - {e}")
            print("Возможно, база данных не была инициализирована")
        else:
            print(f"Ошибка при работе с базой данных: {e}")
    except Exception as e:
        print(f"Общая ошибка: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    check_services_data() 