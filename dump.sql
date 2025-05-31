-- Таблица категорий услуг
CREATE TABLE service_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0
);

-- Таблица администраторов (добавлена первой из-за зависимостей)
CREATE TABLE admins (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'manager' CHECK (role IN ('manager', 'admin', 'superadmin')),
    is_active INTEGER DEFAULT 1,
    last_login TEXT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NULL,
    reset_token TEXT NULL,
    reset_token_expires TEXT NULL
);

-- Таблица услуг
CREATE TABLE services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    service_name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    duration_minutes INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    image_url TEXT,
    created_by INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER NULL,
    updated_at TEXT NULL,
    FOREIGN KEY (category_id) REFERENCES service_categories(category_id),
    FOREIGN KEY (created_by) REFERENCES admins(admin_id),
    FOREIGN KEY (updated_by) REFERENCES admins(admin_id)
);

-- Таблица модификаторов цен
CREATE TABLE price_modifiers (
    modifier_id INTEGER PRIMARY KEY AUTOINCREMENT,
    modifier_name TEXT NOT NULL,
    modifier_type TEXT NOT NULL CHECK (modifier_type IN ('percentage', 'fixed')),
    modifier_value REAL NOT NULL,
    description TEXT
);

-- Таблица размеров автомобилей
CREATE TABLE car_sizes (
    size_id INTEGER PRIMARY KEY AUTOINCREMENT,
    size_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    price_multiplier REAL DEFAULT 1.00
);

-- Таблица связей услуг и модификаторов
CREATE TABLE service_modifiers (
    service_id INTEGER NOT NULL,
    modifier_id INTEGER NOT NULL,
    PRIMARY KEY (service_id, modifier_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id),
    FOREIGN KEY (modifier_id) REFERENCES price_modifiers(modifier_id)
);

-- Таблица клиентов
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    registration_date TEXT DEFAULT CURRENT_TIMESTAMP,
    last_visit TEXT NULL
);

-- Таблица отзывов
CREATE TABLE feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    service_id INTEGER,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    is_anonymous INTEGER DEFAULT 0,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- Таблица ответов на отзывы
CREATE TABLE feedback_replies (
    reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    reply_text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(feedback_id),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

-- Таблица сессий администраторов
CREATE TABLE admin_sessions (
    session_id TEXT PRIMARY KEY,
    admin_id INTEGER NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Таблица логов активности администраторов
CREATE TABLE admin_activity_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER NOT NULL,
    action_type TEXT NOT NULL,
    table_affected TEXT NOT NULL,
    record_id INTEGER NULL,
    action_details TEXT,
    ip_address TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);

-- Таблица бронирований
CREATE TABLE bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    admin_id INTEGER NULL,
    booking_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id),
    FOREIGN KEY (admin_id) REFERENCES admins(admin_id)
);