import sqlite3

def check_schema():
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Получаем информацию о структуре таблицы feedback
        print("\nСтруктура таблицы feedback:")
        cursor.execute("PRAGMA table_info(feedback)")
        feedback_columns = cursor.fetchall()
        for col in feedback_columns:
            print(f"Колонка: {col[1]}, Тип: {col[2]}, Обязательна: {col[3]}")

        # Получаем информацию о структуре таблицы customers
        print("\nСтруктура таблицы customers:")
        cursor.execute("PRAGMA table_info(customers)")
        customer_columns = cursor.fetchall()
        for col in customer_columns:
            print(f"Колонка: {col[1]}, Тип: {col[2]}, Обязательна: {col[3]}")

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_schema() 