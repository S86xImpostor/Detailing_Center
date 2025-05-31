import sqlite3
import os

def create_database():
    db_path = 'database.sqlite'
    # Удаляем существующую базу данных, если она есть
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Существующая база данных удалена")

    try:
        # Создаем новое подключение к базе данных
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Создаем таблицу customers
        cursor.execute('''
        CREATE TABLE customers (
            customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            registration_date TEXT,
            last_visit TEXT
        )
        ''')

        # Создаем таблицу feedback
        cursor.execute('''
        CREATE TABLE feedback (
            feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            service_id INTEGER,
            rating INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT,
            status TEXT DEFAULT 'pending',
            is_anonymous INTEGER DEFAULT 0,
            FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
        )
        ''')

        # Создаем индексы для оптимизации запросов
        cursor.execute('CREATE INDEX idx_feedback_customer ON feedback(customer_id)')
        cursor.execute('CREATE INDEX idx_feedback_status ON feedback(status)')
        cursor.execute('CREATE INDEX idx_customers_email ON customers(email)')

        conn.commit()
        print("База данных успешно создана")

    except sqlite3.Error as e:
        print(f"Ошибка при создании базы данных: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_database() 