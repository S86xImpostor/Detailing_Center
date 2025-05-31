import sqlite3

def check_schema():
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('database.sqlite')
        cursor = conn.cursor()

        # Получаем список всех таблиц
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("\nТаблицы в database.sqlite:")
        for table in tables:
            table_name = table[0]
            print(f"\nТаблица: {table_name}")
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            for col in columns:
                print(f"Колонка: {col[1]}, Тип: {col[2]}, Обязательна: {col[3]}")

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_schema() 