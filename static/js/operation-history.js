class OperationLogger {
    static async log(action) {
        try {
            if (!this.validateAction(action)) {
                throw new Error('Некорректные данные для лога');
            }

            const response = await fetch('/api/log_operation.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action_type: action.type,
                    table_name: action.table,
                    record_id: action.id,
                    action_data: action.data,
                    user_ip: await this.getUserIP(),
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Logging failed:', error);
            throw error;
        }
    }

    static validateAction(action) {
        return action && 
            typeof action === 'object' &&
            ['create', 'update', 'delete'].includes(action.type) &&
            typeof action.table === 'string' &&
            typeof action.id !== 'undefined';
    }

    static async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || 'unknown';
        } catch (error) {
            return 'unknown';
        }
    }
}

// Пример использования
OperationLogger.log({
    type: 'create',
    table: 'bookings',
    id: 12345,
    data: { service: 5, client: "Иван Иванов" }
}).catch(console.error);