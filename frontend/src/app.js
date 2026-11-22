const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ==================== MOCK DATA ====================
let employees = [
    { 
        employee_id: 1, 
        first_name: 'Kofi', 
        last_name: 'Asante', 
        email: 'kofi.asante@company.com',
        phone: '0244123456',
        position: 'Senior Developer', 
        basic_salary: 12000,
        department_id: 3,
        department_name: 'Engineering',
        status: 'Active',
        hire_date: '2023-01-15'
    },
    { 
        employee_id: 2, 
        first_name: 'Ama', 
        last_name: 'Mensah', 
        email: 'ama.mensah@company.com',
        phone: '0244123457',
        position: 'Finance Manager', 
        basic_salary: 9500,
        department_id: 2,
        department_name: 'Finance',
        status: 'Active',
        hire_date: '2022-03-10'
    },
    { 
        employee_id: 3, 
        first_name: 'Yaw', 
        last_name: 'Boateng', 
        email: 'yaw.boateng@company.com',
        phone: '0244123458',
        position: 'HR Specialist', 
        basic_salary: 7000,
        department_id: 1,
        department_name: 'HR',
        status: 'Active',
        hire_date: '2023-06-20'
    },
    { 
        employee_id: 4, 
        first_name: 'Abena', 
        last_name: 'Osei', 
        email: 'abena.osei@company.com',
        phone: '0244123459',
        position: 'Sales Lead', 
        basic_salary: 8200,
        department_id: 4,
        department_name: 'Sales',
        status: 'Active',
        hire_date: '2023-08-01'
    },
    { 
        employee_id: 5, 
        first_name: 'Kwame', 
        last_name: 'Darko', 
        email: 'kwame.darko@company.com',
        phone: '0244123460',
        position: 'Backend Engineer', 
        basic_salary: 10500,
        department_id: 3,
        department_name: 'Engineering',
        status: 'Active',
        hire_date: '2023-11-15'
    },
    { 
        employee_id: 6, 
        first_name: 'Esi', 
        last_name: 'Mensah', 
        email: 'esi.mensah@company.com',
        phone: '0244123461',
        position: 'Product Manager', 
        basic_salary: 15000,
        department_id: 3,
        department_name: 'Engineering',
        status: 'Active',
        hire_date: '2022-01-10'
    },
    { 
        employee_id: 7, 
        first_name: 'Kojo', 
        last_name: 'Arthur', 
        email: 'kojo.arthur@company.com',
        phone: '0244123462',
        position: 'Accountant', 
        basic_salary: 8000,
        department_id: 2,
        department_name: 'Finance',
        status: 'Active',
        hire_date: '2023-09-05'
    }
];

let nextId = 8;
let payslips = [];

// ==================== HELPER FUNCTIONS ====================
function calculatePAYE(grossMonthly) {
    // Ghana PAYE tax bands (monthly)
    let tax = 0;
    let remaining = grossMonthly;
    
    if (remaining > 490) {
        if (remaining <= 700) {
            tax = (remaining - 490) * 0.05;
        } else if (remaining <= 3116) {
            tax = (210 * 0.05) + ((remaining - 700) * 0.10);
        } else if (remaining <= 5500) {
            tax = (210 * 0.05) + (2416 * 0.10) + ((remaining - 3116) * 0.175);
        } else if (remaining <= 10000) {
            tax = (210 * 0.05) + (2416 * 0.10) + (2384 * 0.175) + ((remaining - 5500) * 0.25);
        } else {
            tax = (210 * 0.05) + (2416 * 0.10) + (2384 * 0.175) + (4500 * 0.25) + ((remaining - 10000) * 0.30);
        }
    }
    
    return Math.round(tax * 100) / 100;
}

// ==================== PUBLIC ROUTES ====================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'Payroll System API is running successfully!'
    });
});

app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'API is working!',
        endpoints: [
            'GET /health',
            'GET /api/employees',
            'POST /api/employees',
            'GET /api/employees/:id',
            'PUT /api/employees/:id',
            'DELETE /api/employees/:id',
            'GET /api/dashboard/stats',
            'POST /api/payroll/calculate',
            'POST /api/payroll/process',
            'GET /api/payroll/payslips'
        ]
    });
});

// ==================== EMPLOYEE ROUTES ====================
app.get('/api/employees', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedEmployees = employees.slice(start, end);
    
    res.json({ 
        success: true, 
        employees: paginatedEmployees,
        total: employees.length,
        page: page,
        totalPages: Math.ceil(employees.length / limit)
    });
});

app.get('/api/employees/:id', (req, res) => {
    const employee = employees.find(e => e.employee_id === parseInt(req.params.id));
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
});

app.post('/api/employees', (req, res) => {
    const { first_name, last_name, email, phone, position, basic_salary, department_id, department_name } = req.body;
    
    if (!first_name || !last_name || !basic_salary) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const newEmployee = {
        employee_id: nextId++,
        first_name: first_name,
        last_name: last_name,
        email: email || `${first_name.toLowerCase()}.${last_name.toLowerCase()}@company.com`,
        phone: phone || '',
        position: position || 'Staff',
        basic_salary: parseFloat(basic_salary),
        department_id: department_id || 3,
        department_name: department_name || 'General',
        status: 'Active',
        hire_date: new Date().toISOString().split('T')[0]
    };
    
    employees.push(newEmployee);
    res.status(201).json({ success: true, employee: newEmployee, message: 'Employee created successfully' });
});

app.put('/api/employees/:id', (req, res) => {
    const index = employees.findIndex(e => e.employee_id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    employees[index] = { 
        ...employees[index], 
        ...req.body,
        employee_id: employees[index].employee_id // Keep the same ID
    };
    
    res.json({ success: true, employee: employees[index], message: 'Employee updated successfully' });
});

app.delete('/api/employees/:id', (req, res) => {
    const index = employees.findIndex(e => e.employee_id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    employees[index].status = 'Inactive';
    res.json({ success: true, message: 'Employee deactivated successfully' });
});

// ==================== DASHBOARD ROUTES ====================
app.get('/api/dashboard/stats', (req, res) => {
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const totalEmployees = activeEmployees.length;
    const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.basic_salary, 0);
    const totalTax = activeEmployees.reduce((sum, e) => sum + calculatePAYE(e.basic_salary), 0);
    const totalNet = totalPayroll - totalTax;
    
    const recentActivities = activeEmployees.slice(0, 5).map(e => ({
        employee_name: `${e.first_name} ${e.last_name}`,
        department_name: e.department_name,
        gross: e.basic_salary,
        net: e.basic_salary - calculatePAYE(e.basic_salary) - (e.basic_salary * 0.055),
        payment_status: 'Paid'
    }));
    
    res.json({
        success: true,
        totalEmployees: totalEmployees,
        monthlyPayroll: totalPayroll,
        taxWithheld: totalTax,
        netDisbursed: totalNet,
        recentActivities: recentActivities,
        upcomingPayroll: [
            { period: 'June 2026', dueDate: '2026-06-28', amount: totalPayroll },
            { period: 'July 2026', dueDate: '2026-07-28', amount: totalPayroll }
        ]
    });
});

// ==================== PAYROLL ROUTES ====================
app.post('/api/payroll/calculate', (req, res) => {
    const { grossSalary, overtime, allowances, deductions } = req.body;
    
    const total = (parseFloat(grossSalary) || 0) + (parseFloat(overtime) || 0) + (parseFloat(allowances) || 0);
    const ssnit = total * 0.055;
    const taxable = total - ssnit;
    const paye = calculatePAYE(taxable);
    const net = total - ssnit - paye - (parseFloat(deductions) || 0);
    
    res.json({
        success: true,
        total: total,
        ssnit: ssnit,
        paye: paye,
        net: net,
        otherDeductions: parseFloat(deductions) || 0,
        totalDeductions: ssnit + paye + (parseFloat(deductions) || 0)
    });
});

app.post('/api/payroll/process', (req, res) => {
    const { employeeId, periodId, grossSalary, overtime, allowances, deductions, netSalary, taxAmount, ssnitAmount } = req.body;
    
    const employee = employees.find(e => e.employee_id === parseInt(employeeId));
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    
    const payslip = {
        id: Date.now(),
        employeeId: parseInt(employeeId),
        employeeName: `${employee.first_name} ${employee.last_name}`,
        position: employee.position,
        department: employee.department_name,
        period: periodId || 'June 2026',
        gross: parseFloat(grossSalary),
        overtime: parseFloat(overtime) || 0,
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
        ssnit: ssnitAmount || parseFloat(grossSalary) * 0.055,
        tax: taxAmount || calculatePAYE(parseFloat(grossSalary)),
        net: parseFloat(netSalary),
        date: new Date().toISOString()
    };
    
    payslips.unshift(payslip);
    
    res.json({ 
        success: true, 
        message: 'Payroll processed successfully',
        payrollId: payslip.id,
        payslip: payslip
    });
});

app.get('/api/payroll/payslips', (req, res) => {
    res.json({
        success: true,
        payslips: payslips
    });
});

// ==================== DEPARTMENTS ROUTE ====================
app.get('/api/departments', (req, res) => {
    const departments = [
        { department_id: 1, department_name: 'Human Resources' },
        { department_id: 2, department_name: 'Finance' },
        { department_id: 3, department_name: 'Engineering' },
        { department_id: 4, department_name: 'Sales' },
        { department_id: 5, department_name: 'Marketing' },
        { department_id: 6, department_name: 'Operations' }
    ];
    
    res.json({ success: true, departments: departments });
});

// ==================== 404 HANDLER ====================
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.url} not found`,
        availableRoutes: [
            'GET /health',
            'GET /api/test',
            'GET /api/employees',
            'POST /api/employees',
            'GET /api/employees/:id',
            'PUT /api/employees/:id',
            'DELETE /api/employees/:id',
            'GET /api/dashboard/stats',
            'POST /api/payroll/calculate',
            'POST /api/payroll/process',
            'GET /api/payroll/payslips',
            'GET /api/departments'
        ]
    });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`   Payroll System Backend Server`);
    console.log(`   ========================================`);
    console.log(`   ✅ Server running on port ${PORT}`);
    console.log(`   📍 URL: http://localhost:${PORT}`);
    console.log(`   🔗 API: http://localhost:${PORT}/api/employees`);
    console.log(`   ❤️  Health: http://localhost:${PORT}/health`);
    console.log(`   ========================================\n`);
});

module.exports = app;