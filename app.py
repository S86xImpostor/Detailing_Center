from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import sqlite3
from datetime import datetime
import logging
import os
import traceback

# Настройка логирования в файл и консоль
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def get_db():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'database.sqlite')
        logger.debug(f"Подключение к базе данных: {db_path}")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        logger.error(f"Ошибка подключения к базе данных: {str(e)}")
        raise

@app.route('/')
def index():
    return send_from_directory('static', 'feedback.html')

@app.route('/<path:filename>')
def serve_static(filename):
    if filename.endswith('.html'):
        return send_from_directory('static', filename)
    return '', 404

@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('static/css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('static/js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('static/images', filename)

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        logger.debug(f"Получены данные отзыва: {data}")
        
        if not data:
            logger.error("Нет данных в запросе")
            return jsonify({'error': 'Нет данных'}), 400

        required_fields = ['name', 'rating', 'message']
        for field in required_fields:
            if field not in data:
                logger.error(f"Отсутствует обязательное поле: {field}")
                return jsonify({'error': f'Отсутствует обязательное поле: {field}'}), 400

        db = get_db()
        try:
            # Создаем нового клиента или получаем существующего
            customer_id = None
            if data.get('name'):
                cursor = db.execute('SELECT customer_id FROM customers WHERE name = ? AND (email = ? OR (email IS NULL AND ? IS NULL))',
                                  (data['name'], data.get('email'), data.get('email')))
                result = cursor.fetchone()
                
                if result:
                    customer_id = result['customer_id']
                    logger.debug(f"Найден существующий клиент с ID: {customer_id}")
                else:
                    cursor = db.execute(
                        'INSERT INTO customers (name, email, registration_date) VALUES (?, ?, ?)',
                        (data['name'], data.get('email'), datetime.now().isoformat())
                    )
                    customer_id = cursor.lastrowid
                    logger.debug(f"Создан новый клиент с ID: {customer_id}")
            
            # Добавляем отзыв
            logger.debug("Добавление отзыва в базу данных")
            cursor = db.execute(
                '''INSERT INTO feedback 
                   (customer_id, rating, message, created_at, status, is_anonymous)
                   VALUES (?, ?, ?, ?, ?, ?)''',
                (customer_id, int(data['rating']), data['message'], 
                 datetime.now().isoformat(), 'approved', 0 if customer_id else 1)
            )
            feedback_id = cursor.lastrowid
            db.commit()
            logger.debug(f"Создан новый отзыв с ID: {feedback_id}")

            # Получаем HTML для нового отзыва
            cursor = db.execute('''
                SELECT f.*, c.name as customer_name
                FROM feedback f
                LEFT JOIN customers c ON f.customer_id = c.customer_id
                WHERE f.feedback_id = ?
            ''', (feedback_id,))
            feedback = cursor.fetchone()
            logger.debug(f"Получен отзыв для отображения: {dict(feedback)}")
            
            return render_template('_feedback_item.html', feedback=feedback)
            
        except Exception as e:
            logger.error(f"Ошибка базы данных: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            db.rollback()
            return jsonify({'error': str(e)}), 400
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Общая ошибка: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/feedback', methods=['GET'])
def get_feedbacks():
    logger.debug("Запрос на получение списка отзывов")
    db = get_db()
    try:
        cursor = db.execute('''
            SELECT f.*, c.name as customer_name
            FROM feedback f
            LEFT JOIN customers c ON f.customer_id = c.customer_id
            WHERE f.status = 'approved'
            ORDER BY f.created_at DESC
            LIMIT 10
        ''')
        feedbacks = cursor.fetchall()
        logger.debug(f"Найдено отзывов: {len(feedbacks)}")
        return render_template('_feedback_list.html', feedbacks=feedbacks)
    except Exception as e:
        logger.error(f"Ошибка при получении отзывов: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/feedback/json', methods=['GET'])
def get_feedbacks_json():
    logger.debug("Запрос на получение списка отзывов (JSON)")
    db = get_db()
    try:
        cursor = db.execute('''
            SELECT f.feedback_id, f.rating, f.message, f.created_at, f.status, f.is_anonymous,
                   c.name as customer_name, c.email as customer_email
            FROM feedback f
            LEFT JOIN customers c ON f.customer_id = c.customer_id
            ORDER BY f.created_at DESC
        ''')
        feedbacks = [
            {
                'feedback_id': row['feedback_id'],
                'customer_name': row['customer_name'] or 'Анонимный пользователь',
                'customer_email': row['customer_email'],
                'rating': row['rating'],
                'message': row['message'],
                'created_at': row['created_at'],
                'status': row['status'],
                'is_anonymous': row['is_anonymous']
            }
            for row in cursor.fetchall()
        ]
        return jsonify(feedbacks)
    except Exception as e:
        logger.error(f"Ошибка при получении отзывов (JSON): {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/services', methods=['GET'])
def get_services():
    logger.debug("Запрос на получение списка услуг")
    db = get_db()
    try:
        # Получаем все активные услуги с информацией о категории
        cursor = db.execute('''
            SELECT s.*, sc.category_name, sc.category_slug
            FROM services s
            JOIN service_categories sc ON s.category_id = sc.category_id
            WHERE s.is_active = 1
            ORDER BY sc.display_order, s.service_name
        ''')
        services = cursor.fetchall()
        logger.debug(f"Найдено услуг: {len(services)}")
        
        # Преобразуем результаты в список словарей
        services_list = []
        for service in services:
            services_list.append({
                'id': service['service_id'],
                'name': service['service_name'],
                'description': service['description'],
                'base_price': service['base_price'],
                'duration': service['duration_minutes'] // 60,  # Конвертируем минуты в часы
                'category': service['category_slug'],
                'category_name': service['category_name'],
                'image_url': service['image_url']
            })
        
        return jsonify(services_list)
    except Exception as e:
        logger.error(f"Ошибка при получении услуг: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/services/categories', methods=['GET'])
def get_service_categories():
    logger.debug("Запрос на получение категорий услуг")
    db = get_db()
    try:
        cursor = db.execute('''
            SELECT category_id, category_name, category_slug, description
            FROM service_categories
            ORDER BY display_order
        ''')
        categories = cursor.fetchall()
        return jsonify([dict(category) for category in categories])
    except Exception as e:
        logger.error(f"Ошибка при получении категорий: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/feedback/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    db = get_db()
    try:
        db.execute('DELETE FROM feedback WHERE feedback_id = ?', (feedback_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/services', methods=['POST'])
def create_service():
    data = request.get_json()
    db = get_db()
    try:
        cursor = db.execute('''
            INSERT INTO services (category_id, service_name, description, base_price, duration_minutes, is_active, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now'))
        ''', (
            data['category_id'],
            data['service_name'],
            data.get('description', ''),
            data['base_price'],
            data['duration_minutes']
        ))
        db.commit()
        return jsonify({'success': True, 'service_id': cursor.lastrowid})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    data = request.get_json()
    db = get_db()
    try:
        db.execute('''
            UPDATE services SET category_id=?, service_name=?, description=?, base_price=?, duration_minutes=?, updated_by=1, updated_at=datetime('now')
            WHERE service_id=?
        ''', (
            data['category_id'],
            data['service_name'],
            data.get('description', ''),
            data['base_price'],
            data['duration_minutes'],
            service_id
        ))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    db = get_db()
    try:
        db.execute('DELETE FROM services WHERE service_id = ?', (service_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/customers', methods=['POST'])
def create_customer():
    data = request.get_json()
    db = get_db()
    try:
        # Новый поиск: сначала по телефону, потом по email, потом по имени
        customer_id = None
        if data.get('phone'):
            cursor = db.execute('SELECT customer_id FROM customers WHERE phone = ?', (data['phone'],))
            result = cursor.fetchone()
            if result:
                customer_id = result['customer_id']
        if not customer_id and data.get('email'):
            cursor = db.execute('SELECT customer_id FROM customers WHERE email = ?', (data['email'],))
            result = cursor.fetchone()
            if result:
                customer_id = result['customer_id']
        if not customer_id:
            cursor = db.execute('SELECT customer_id FROM customers WHERE name = ?', (data['name'],))
            result = cursor.fetchone()
            if result:
                customer_id = result['customer_id']
        if not customer_id:
            cursor = db.execute(
                'INSERT INTO customers (name, email, phone, registration_date) VALUES (?, ?, ?, datetime("now"))',
                (data['name'], data.get('email'), data.get('phone'))
            )
            customer_id = cursor.lastrowid
            db.commit()
        return jsonify({'id': customer_id})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    db = get_db()
    try:
        db.execute(
            'INSERT INTO bookings (customer_id, service_id, booking_date, start_time, end_time, status, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
            (
                data['customer_id'],
                data['service_id'],
                data['booking_date'],
                data['start_time'],
                data['end_time'],
                'pending',
                data.get('notes', None)
            )
        )
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/bookings', methods=['GET'])
def get_bookings():
    db = get_db()
    try:
        cursor = db.execute('''
            SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.status, c.name as customer_name, s.service_name
            FROM bookings b
            LEFT JOIN customers c ON b.customer_id = c.customer_id
            LEFT JOIN services s ON b.service_id = s.service_id
            ORDER BY b.booking_date DESC, b.start_time DESC
        ''')
        bookings = [
            {
                'id': row['booking_id'],
                'customer_name': row['customer_name'],
                'service_name': row['service_name'],
                'booking_date': row['booking_date'],
                'start_time': row['start_time'],
                'end_time': row['end_time'],
                'status': row['status']
            }
            for row in cursor.fetchall()
        ]
        return jsonify(bookings)
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/bookings/<int:booking_id>', methods=['DELETE'])
def delete_booking(booking_id):
    db = get_db()
    try:
        db.execute('DELETE FROM bookings WHERE booking_id = ?', (booking_id,))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/bookings/<int:booking_id>/status', methods=['PUT'])
def update_booking_status(booking_id):
    data = request.get_json()
    new_status = data.get('status')
    db = get_db()
    try:
        db.execute('UPDATE bookings SET status = ?, updated_at = datetime("now") WHERE booking_id = ?', (new_status, booking_id))
        db.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

@app.route('/api/bookings/client', methods=['GET'])
def get_client_bookings():
    phone = request.args.get('phone')
    email = request.args.get('email')
    db = get_db()
    try:
        if phone:
            cursor = db.execute('''
                SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.status, s.service_name
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.customer_id
                LEFT JOIN services s ON b.service_id = s.service_id
                WHERE c.phone = ?
                ORDER BY b.booking_date DESC, b.start_time DESC
            ''', (phone,))
        elif email:
            cursor = db.execute('''
                SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.status, s.service_name
                FROM bookings b
                LEFT JOIN customers c ON b.customer_id = c.customer_id
                LEFT JOIN services s ON b.service_id = s.service_id
                WHERE c.email = ?
                ORDER BY b.booking_date DESC, b.start_time DESC
            ''', (email,))
        else:
            return jsonify({'error': 'Не указан телефон или email'}), 400

        bookings = [
            {
                'id': row['booking_id'],
                'service_name': row['service_name'],
                'booking_date': row['booking_date'],
                'start_time': row['start_time'],
                'end_time': row['end_time'],
                'status': row['status']
            }
            for row in cursor.fetchall()
        ]
        return jsonify(bookings)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()

if __name__ == '__main__':
    logger.info("Запуск Flask приложения")
    app.run(debug=True, port=5000) 