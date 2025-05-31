import sqlite3

def check_database():
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect('database.db')
        cursor = conn.cursor()

        # Проверяем таблицу feedback
        print("\nПроверяем отзывы в базе данных:")
        cursor.execute("SELECT f.*, c.name, c.email FROM feedback f LEFT JOIN customers c ON f.customer_id = c.customer_id")
        feedbacks = cursor.fetchall()
        
        if feedbacks:
            print("\nНайдены отзывы:")
            for feedback in feedbacks:
                print(f"\nID отзыва: {feedback[0]}")
                print(f"ID клиента: {feedback[1]}")
                print(f"Рейтинг: {feedback[3]}")
                print(f"Сообщение: {feedback[4]}")
                print(f"Дата создания: {feedback[5]}")
                print(f"Статус: {feedback[6]}")
                print(f"Имя клиента: {feedback[-2]}")
                print(f"Email клиента: {feedback[-1]}")
        else:
            print("Отзывов в базе данных нет")

        # Проверяем таблицу customers
        print("\nПроверяем клиентов в базе данных:")
        cursor.execute("SELECT * FROM customers")
        customers = cursor.fetchall()
        
        if customers:
            print("\nНайдены клиенты:")
            for customer in customers:
                print(f"\nID клиента: {customer[0]}")
                print(f"Имя: {customer[1]}")
                print(f"Email: {customer[2]}")
                print(f"Телефон: {customer[3]}")
                print(f"Дата регистрации: {customer[4]}")
        else:
            print("Клиентов в базе данных нет")

    except sqlite3.Error as e:
        print(f"Ошибка при работе с базой данных: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    check_database() 