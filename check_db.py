import sqlite3
import os

def check_database():
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Получаем список всех таблиц
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("Существующие таблицы:")
        for table in tables:
            print(f"\nТаблица: {table[0]}")
            # Получаем информацию о структуре таблицы
            cursor.execute(f"PRAGMA table_info({table[0]})")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_database() 