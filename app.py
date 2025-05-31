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

if __name__ == '__main__':
    logger.info("Запуск Flask приложения")
    app.run(debug=True, port=5000) 