import sqlite3
from datetime import datetime

def test_feedback_submission():
    # Тестовые данные
    test_feedback = {
        'name': 'Тест Тестович',
        'email': 'test@test.com',
        'rating': 5,
        'message': 'Тестовый отзыв'
    }
    
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()
        
        # Создаем клиента
        cursor.execute(
            'INSERT INTO customers (name, email) VALUES (?, ?)',
            (test_feedback['name'], test_feedback['email'])
        )
        customer_id = cursor.lastrowid
        
        # Добавляем отзыв
        cursor.execute(
            '''INSERT INTO feedback 
               (customer_id, rating, message, created_at, status, is_anonymous)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (customer_id, test_feedback['rating'], test_feedback['message'],
             datetime.now().isoformat(), 'approved', 0)
        )
        
        # Сохраняем изменения
        conn.commit()
        print("Тестовый отзыв успешно добавлен!")
        
        # Проверяем, что отзыв действительно добавлен
        cursor.execute('''
            SELECT f.*, c.name, c.email
            FROM feedback f
            JOIN customers c ON f.customer_id = c.customer_id
            WHERE c.email = ?
        ''', (test_feedback['email'],))
        
        result = cursor.fetchone()
        if result:
            print("\nНайден добавленный отзыв:")
            print(f"Имя: {result[8]}")  # name из таблицы customers
            print(f"Email: {result[9]}")  # email из таблицы customers
            print(f"Рейтинг: {result[3]}")  # rating из таблицы feedback
            print(f"Сообщение: {result[4]}")  # message из таблицы feedback
        else:
            print("Ошибка: отзыв не найден в базе данных!")
            
    except Exception as e:
        print(f"Ошибка при тестировании: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    test_feedback_submission() 