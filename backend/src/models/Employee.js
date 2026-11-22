const db = require('../config/database');

class Employee {
    static async findAll(page = 1, limit = 10, filters = {}) {
        const offset = (page - 1) * limit;
        let query = `
            SELECT e.*, d.department_name 
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE e.status = 'Active'
        `;
        const params = [];
        let paramCount = 1;

        if (filters.departmentId) {
            query += ` AND e.department_id = $${paramCount}`;
            params.push(filters.departmentId);
            paramCount++;
        }

        if (filters.search) {
            query += ` AND (e.first_name ILIKE $${paramCount} OR e.last_name ILIKE $${paramCount} OR e.email ILIKE $${paramCount})`;
            params.push(`%${filters.search}%`);
            paramCount++;
        }

        query += ` ORDER BY e.last_name LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) FROM employees WHERE status = 'Active'`;
        if (filters.departmentId) {
            countQuery += ` AND department_id = ${filters.departmentId}`;
        }
        const countResult = await db.query(countQuery);

        return {
            employees: result.rows,
            total: parseInt(countResult.rows[0].count),
            page,
            totalPages: Math.ceil(countResult.rows[0].count / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT e.*, d.department_name 
            FROM employees e
            LEFT JOIN departments d ON e.department_id = d.department_id
            WHERE e.employee_id = $1 AND e.status = 'Active'
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async create(employeeData) {
        const query = `
            INSERT INTO employees (
                first_name, last_name, email, phone, address, 
                date_of_birth, hire_date, department_id, position, 
                basic_salary, employment_type, bank_account, bank_name, tax_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING employee_id, first_name, last_name, email, position, basic_salary
        `;
        const values = [
            employeeData.first_name,
            employeeData.last_name,
            employeeData.email,
            employeeData.phone || null,
            employeeData.address || null,
            employeeData.date_of_birth || null,
            employeeData.hire_date || new Date(),
            employeeData.department_id,
            employeeData.position,
            employeeData.basic_salary,
            employeeData.employment_type || 'Full-time',
            employeeData.bank_account || null,
            employeeData.bank_name || null,
            employeeData.tax_id || null
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async update(id, employeeData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'address', 
                               'position', 'basic_salary', 'department_id', 'employment_type', 
                               'bank_account', 'bank_name', 'tax_id'];

        allowedFields.forEach(field => {
            if (employeeData[field] !== undefined) {
                fields.push(`${field} = $${paramCount}`);
                values.push(employeeData[field]);
                paramCount++;
            }
        });

        if (fields.length === 0) return null;

        values.push(id);
        const query = `
            UPDATE employees 
            SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = $${paramCount} 
            RETURNING employee_id, first_name, last_name, email, position, basic_salary
        `;
        
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async delete(id) {
        const query = `
            UPDATE employees 
            SET status = 'Inactive', updated_at = CURRENT_TIMESTAMP 
            WHERE employee_id = $1 
            RETURNING employee_id
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async getDepartments() {
        const query = `SELECT department_id, department_name FROM departments ORDER BY department_name`;
        const result = await db.query(query);
        return result.rows;
    }
}

module.exports = Employee;