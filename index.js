const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

// Database wrapper class
class Database {
  constructor(dbPath) {
    this.db = new sqlite3.Database(dbPath);
  }

  // Initialize database from dump file
  async initFromDump(dumpPath) {
    const dump = fs.readFileSync(dumpPath, "utf8");
    const statements = dump.split(";").filter((stmt) => stmt.trim());

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run("PRAGMA foreign_keys = ON");

        statements.forEach((statement) => {
          if (statement.trim()) {
            this.db.run(statement, (err) => {
              if (err) {
                console.error("Error executing statement:", err);
                reject(err);
              }
            });
          }
        });

        resolve();
      });
    });
  }

  // CRUD operations
  async create(table, data) {
    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);

    return new Promise((resolve, reject) => {
      const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;
      this.db.run(query, values, function (err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async read(table, conditions = {}, columns = "*") {
    const whereClause = Object.keys(conditions).length
      ? "WHERE " +
        Object.keys(conditions)
          .map((key) => `${key} = ?`)
          .join(" AND ")
      : "";
    const values = Object.values(conditions);

    return new Promise((resolve, reject) => {
      const query = `SELECT ${columns} FROM ${table} ${whereClause}`;
      this.db.all(query, values, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  async update(table, data, conditions) {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const values = [...Object.values(data), ...Object.values(conditions)];

    return new Promise((resolve, reject) => {
      const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      this.db.run(query, values, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  async delete(table, conditions) {
    const whereClause = Object.keys(conditions)
      .map((key) => `${key} = ?`)
      .join(" AND ");
    const values = Object.values(conditions);

    return new Promise((resolve, reject) => {
      const query = `DELETE FROM ${table} WHERE ${whereClause}`;
      this.db.run(query, values, function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }
}

// Create Express app
const app = express();
app.use(express.json());

app.use(express.static('static'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});


// Initialize database
const db = new Database("database.sqlite");

// Проверка структуры базы данных
db.db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'", [], (err, rows) => {
    if (err) {
        console.error('Ошибка при проверке структуры таблицы:', err);
    } else {
        console.log('Структура таблицы bookings:', rows);
    }
});

// Initialize database from dump file
db.initFromDump("dump.sql")
  .then(() => {
    console.log("Database initialized successfully");
  })
  .catch((err) => {
    console.error("Error initializing database:", err);
  });

// Example routes
app.post("/api/:table", async (req, res) => {
  try {
    const id = await db.create(req.params.table, req.body);
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/:table", async (req, res) => {
  try {
    const rows = await db.read(req.params.table, req.query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/:table", async (req, res) => {
  try {
    const { id, ...data } = req.body;
    const changes = await db.update(req.params.table, data, { id });
    res.json({ changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/:table", async (req, res) => {
  try {
    const changes = await db.delete(req.params.table, req.query);
    res.json({ changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Специальные маршруты для услуг
app.get("/api/services", async (req, res) => {
  try {
    console.log("Получен запрос на /api/services");
    const query = `
      SELECT 
        s.service_id,
        s.service_name,
        s.description,
        s.base_price,
        s.duration_minutes,
        s.image_url,
        s.is_active,
        sc.category_name,
        sc.category_slug
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.category_id
      WHERE s.is_active = 1
      ORDER BY sc.display_order, s.service_name
    `;
    console.log("SQL запрос:", query);
    
    db.db.all(query, [], (err, services) => {
      if (err) {
        console.error("Ошибка при получении услуг:", err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log("Получены сырые данные из БД:", services);
      
      if (!services || services.length === 0) {
        console.log("Услуги не найдены в базе данных");
        return res.json([]);
      }
      
      const services_list = services.map(service => {
        console.log("Обрабатываем услугу из БД:", service);
        const transformed = {
          service_id: service.service_id,
          service_name: service.service_name,
          description: service.description,
          base_price: service.base_price,
          duration_minutes: service.duration_minutes,
          category_name: service.category_name || 'Без категории',
          category_slug: service.category_slug || 'uncategorized',
          image_url: service.image_url || null
        };
        console.log("Преобразованная услуга:", transformed);
        return transformed;
      });
      
      console.log("Отправляем клиенту финальный список:", services_list);
      res.json(services_list);
    });
  } catch (err) {
    console.error("Ошибка при обработке запроса услуг:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/services/categories", async (req, res) => {
  try {
    const query = `
      SELECT category_id, category_name, category_slug, description
      FROM service_categories
      ORDER BY display_order
    `;
    
    db.db.all(query, [], (err, categories) => {
      if (err) {
        console.error("Ошибка при получении категорий:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(categories);
    });
  } catch (err) {
    console.error("Ошибка при обработке запроса категорий:", err);
    res.status(500).json({ error: err.message });
  }
});

// Маршрут для создания новой записи
app.post("/api/bookings", async (req, res) => {
    try {
        console.log('Получены данные для бронирования:', req.body);
        
        const { 
            service_id, 
            client_name, 
            client_phone, 
            client_email, 
            client_car,
            booking_date,
            start_time,
            end_time,
            notes
        } = req.body;

        // Проверяем обязательные поля
        if (!service_id || !client_name || !client_phone || !booking_date || !start_time || !end_time) {
            console.log('Отсутствуют обязательные поля:', {
                service_id, client_name, client_phone, booking_date, start_time, end_time
            });
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }

        try {
            // Создаем или получаем клиента
            let customerId;
            const customers = await db.read('customers', { phone: client_phone });
            console.log('Найденные клиенты:', customers);
            
            if (customers && customers.length > 0) {
                customerId = customers[0].customer_id;
                console.log('Найден существующий клиент:', customerId);
                // Обновляем информацию о клиенте
                await db.update('customers', 
                    { 
                        name: client_name, 
                        email: client_email || null,
                        last_visit: new Date().toISOString()
                    }, 
                    { customer_id: customerId }
                );
            } else {
                // Создаем нового клиента
                const customerData = {
                    name: client_name,
                    phone: client_phone,
                    email: client_email || null,
                    registration_date: new Date().toISOString()
                };
                console.log('Создаем нового клиента:', customerData);
                customerId = await db.create('customers', customerData);
                console.log('Создан новый клиент:', customerId);
            }

            // Создаем запись в соответствии со структурой таблицы bookings
            const bookingData = {
                customer_id: customerId,
                service_id: service_id,
                booking_date: booking_date,
                start_time: start_time,
                end_time: end_time,
                status: 'pending',
                notes: notes || null,
                created_at: new Date().toISOString()
            };
            console.log('Создаем бронирование:', bookingData);

            const bookingId = await db.create('bookings', bookingData);
            console.log('Создано бронирование:', bookingId);

            // Возвращаем ID новой записи
            res.json({ 
                booking_id: bookingId,
                message: 'Запись успешно создана'
            });

        } catch (error) {
            console.error('Внутренняя ошибка при создании записи:', error);
            throw error;
        }
    } catch (error) {
        console.error('Ошибка при создании записи:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
