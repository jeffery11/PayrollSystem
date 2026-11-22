const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';

// ==================== USERS DATA (ALL WORKING) ====================
const users = [
    { id: 1, username: 'admin', password: 'admin123', name: 'System Administrator', email: 'admin@payhr.com', role: 'admin', employeeId: null, isActive: true },
    { id: 2, username: 'hr_manager', password: 'hr123', name: 'HR Manager', email: 'hr@payhr.com', role: 'hr', employeeId: null, isActive: true },
    { id: 3, username: 'kofi.asante', password: 'employee123', name: 'Kofi Asante', email: 'kofi.asante@company.com', role: 'employee', employeeId: 1, isActive: true },
    { id: 4, username: 'ama.mensah', password: 'employee123', name: 'Ama Mensah', email: 'ama.mensah@company.com', role: 'employee', employeeId: 2, isActive: true },
    { id: 5, username: 'yaw.boateng', password: 'employee123', name: 'Yaw Boateng', email: 'yaw.boateng@company.com', role: 'employee', employeeId: 3, isActive: true }
];

// ==================== MOCK DATA ====================
let employees = [
    { employee_id: 1, first_name: 'Kofi', last_name: 'Asante', email: 'kofi.asante@company.com', phone: '0244123456', position: 'Senior Developer', basic_salary: 12000, department_id: 3, department_name: 'Engineering', status: 'Active', hire_date: '2023-01-15' },
    { employee_id: 2, first_name: 'Ama', last_name: 'Mensah', email: 'ama.mensah@company.com', phone: '0244123457', position: 'Finance Manager', basic_salary: 9500, department_id: 2, department_name: 'Finance', status: 'Active', hire_date: '2022-03-10' },
    { employee_id: 3, first_name: 'Yaw', last_name: 'Boateng', email: 'yaw.boateng@company.com', phone: '0244123458', position: 'HR Specialist', basic_salary: 7000, department_id: 1, department_name: 'HR', status: 'Active', hire_date: '2023-06-20' }
];

let nextId = 4;
let payslips = [];

// ==================== LEAVE MANAGEMENT DATA ====================
const leaveTypes = [
    { id: 1, name: 'Annual Leave', days_per_year: 22 },
    { id: 2, name: 'Sick Leave', days_per_year: 12 },
    { id: 3, name: 'Maternity Leave', days_per_year: 90 },
    { id: 4, name: 'Paternity Leave', days_per_year: 10 },
    { id: 5, name: 'Bereavement Leave', days_per_year: 5 },
    { id: 6, name: 'Unpaid Leave', days_per_year: 0 }
];

let leaveBalances = [];
let leaveRequests = [];

// Initialize leave balances for employees
function initializeLeaveBalances() {
    employees.forEach(emp => {
        leaveTypes.forEach(leaveType => {
            const exists = leaveBalances.find(b => b.employeeId === emp.employee_id && b.leaveTypeId === leaveType.id);
            if (!exists) {
                leaveBalances.push({
                    id: Date.now() + Math.random() + emp.employee_id,
                    employeeId: emp.employee_id,
                    leaveTypeId: leaveType.id,
                    year: new Date().getFullYear(),
                    totalDays: leaveType.days_per_year,
                    usedDays: 0,
                    remainingDays: leaveType.days_per_year
                });
            }
        });
    });
}
initializeLeaveBalances();

// ==================== HELPER FUNCTIONS ====================
function calculatePAYE(grossMonthly) {
    let tax = 0;
    if (grossMonthly > 490) {
        if (grossMonthly <= 700) tax = (grossMonthly - 490) * 0.05;
        else if (grossMonthly <= 3116) tax = (210 * 0.05) + ((grossMonthly - 700) * 0.10);
        else if (grossMonthly <= 5500) tax = (210 * 0.05) + (2416 * 0.10) + ((grossMonthly - 3116) * 0.175);
        else if (grossMonthly <= 10000) tax = (210 * 0.05) + (2416 * 0.10) + (2384 * 0.175) + ((grossMonthly - 5500) * 0.25);
        else tax = (210 * 0.05) + (2416 * 0.10) + (2384 * 0.175) + (4500 * 0.25) + ((grossMonthly - 10000) * 0.30);
    }
    return Math.round(tax * 100) / 100;
}

// Add sample payslips for existing employees
if (payslips.length === 0) {
    const sampleDates = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026'];
    
    employees.forEach(emp => {
        const baseSalary = emp.basic_salary;
        
        sampleDates.forEach((period, index) => {
            const overtime = Math.floor(Math.random() * 500);
            const allowances = 300;
            const deductions = 100;
            const ssnit = baseSalary * 0.055;
            const tax = calculatePAYE(baseSalary);
            const net = baseSalary + overtime + allowances - ssnit - tax - deductions;
            
            payslips.push({
                id: Date.now() + index + emp.employee_id,
                employeeId: emp.employee_id,
                employeeName: `${emp.first_name} ${emp.last_name}`,
                position: emp.position,
                department: emp.department_name,
                period: period,
                gross: baseSalary,
                overtime: overtime,
                allowances: allowances,
                deductions: deductions,
                ssnit: ssnit,
                tax: tax,
                net: net
            });
        });
    });
    
    console.log(`✅ Created ${payslips.length} sample payslips`);
}

// ==================== AUTH MIDDLEWARE ====================
function verifyToken(req, res, next) {
    const token = req.headers['x-auth-token'];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Invalid token' });
    }
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', username, '| Password length:', password?.length);

    // Trim any whitespace
    const trimmedUsername = username?.trim();
    const trimmedPassword = password?.trim();

    const user = users.find(u => u.username === trimmedUsername && u.password === trimmedPassword && u.isActive);

    if (!user) {
        console.log('Login failed for:', trimmedUsername);
        console.log('Available users:', users.map(u => u.username));
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    console.log('Login successful:', trimmedUsername);

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role, employeeId: user.employeeId },
        JWT_SECRET,
        { expiresIn: '8h' }
    );

    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            employeeId: user.employeeId
        }
    });
});

// ==================== PUBLIC ROUTES ====================
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// ==================== EMPLOYEE ROUTES (Updated for security) ====================
app.get('/api/employees', verifyToken, (req, res) => {
    let result = employees;

    // If user is employee, only return their own record
    if (req.user.role === 'employee' && req.user.employeeId) {
        result = employees.filter(e => e.employee_id === req.user.employeeId);
        console.log(`Employee ${req.user.username} viewing their own data`);
    } else {
        console.log(`${req.user.username} (${req.user.role}) viewing all employees`);
    }

    res.json({ success: true, employees: result });
});

app.get('/api/employees/:id', verifyToken, (req, res) => {
    const employeeId = parseInt(req.params.id);

    // If user is employee, they can only view their own record
    if (req.user.role === 'employee' && req.user.employeeId) {
        if (employeeId !== req.user.employeeId) {
            console.log(`Security: Employee ${req.user.username} tried to view employee ${employeeId}`);
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. You can only view your own information.' 
            });
        }
    }

    const employee = employees.find(e => e.employee_id === employeeId);
    if (!employee) {
        return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.json({ success: true, employee });
});

app.post('/api/employees', verifyToken, (req, res) => {
    const { first_name, last_name, email, position, department_name, basic_salary } = req.body;
    const newEmployee = {
        employee_id: nextId++,
        first_name, last_name,
        email: email || `${first_name.toLowerCase()}.${last_name.toLowerCase()}@company.com`,
        position: position || 'Staff',
        basic_salary: parseFloat(basic_salary),
        department_name: department_name || 'General',
        status: 'Active',
        hire_date: new Date().toISOString().split('T')[0]
    };
    employees.push(newEmployee);
    initializeLeaveBalances();
    res.status(201).json({ success: true, employee: newEmployee });
});

// ==================== DASHBOARD STATS (Employee sees only their own) ====================
app.get('/api/dashboard/stats', verifyToken, (req, res) => {
    // If employee, show only their stats
    if (req.user.role === 'employee' && req.user.employeeId) {
        const employee = employees.find(e => e.employee_id === req.user.employeeId);
        if (employee) {
            const tax = calculatePAYE(employee.basic_salary);
            const ssnit = employee.basic_salary * 0.055;
            const net = employee.basic_salary - ssnit - tax;
            
            console.log(`Employee ${req.user.username} viewing their dashboard`);
            
            return res.json({
                totalEmployees: 1,
                monthlyPayroll: employee.basic_salary,
                taxWithheld: tax,
                netDisbursed: net,
                recentActivities: [{
                    employee_name: `${employee.first_name} ${employee.last_name}`,
                    department_name: employee.department_name,
                    gross: employee.basic_salary,
                    net: net,
                    payment_status: 'Paid'
                }]
            });
        }
    }
    
    // Admin/HR see all stats
    const activeEmployees = employees.filter(e => e.status === 'Active');
    const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.basic_salary, 0);
    const totalTax = activeEmployees.reduce((sum, e) => sum + calculatePAYE(e.basic_salary), 0);
    
    res.json({
        totalEmployees: activeEmployees.length,
        monthlyPayroll: totalPayroll,
        taxWithheld: totalTax,
        netDisbursed: totalPayroll - totalTax - (totalPayroll * 0.055),
        recentActivities: activeEmployees.slice(0, 5).map(e => ({
            employee_name: `${e.first_name} ${e.last_name}`,
            department_name: e.department_name,
            gross: e.basic_salary,
            net: e.basic_salary - calculatePAYE(e.basic_salary) - (e.basic_salary * 0.055),
            payment_status: 'Paid'
        }))
    });
});

// ==================== PAYROLL ROUTES ====================
app.post('/api/payroll/calculate', verifyToken, (req, res) => {
    const { grossSalary, overtime, allowances, deductions } = req.body;
    const total = (parseFloat(grossSalary) || 0) + (parseFloat(overtime) || 0) + (parseFloat(allowances) || 0);
    const ssnit = total * 0.055;
    const paye = calculatePAYE(total - ssnit);
    const net = total - ssnit - paye - (parseFloat(deductions) || 0);
    res.json({ total, ssnit, paye, net, otherDeductions: parseFloat(deductions) || 0, totalDeductions: ssnit + paye + (parseFloat(deductions) || 0) });
});

app.post('/api/payroll/process', verifyToken, (req, res) => {
    const { employeeId, grossSalary, overtime, allowances, deductions, netSalary, taxAmount, ssnitAmount } = req.body;

    const employee = employees.find(e => e.employee_id === parseInt(employeeId));
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    const payslip = {
        id: Date.now(),
        employeeId: parseInt(employeeId),
        employeeName: `${employee.first_name} ${employee.last_name}`,
        position: employee.position,
        department: employee.department_name,
        period: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        gross: parseFloat(grossSalary),
        overtime: parseFloat(overtime) || 0,
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
        ssnit: ssnitAmount || parseFloat(grossSalary) * 0.055,
        tax: taxAmount || calculatePAYE(parseFloat(grossSalary)),
        net: parseFloat(netSalary)
    };
    payslips.unshift(payslip);
    res.json({ success: true, message: 'Payroll processed successfully', payrollId: payslip.id, payslip });
});

app.get('/api/payroll/payslips', verifyToken, (req, res) => {
    let result = payslips;
    if (req.user.role === 'employee' && req.user.employeeId) {
        result = payslips.filter(p => p.employeeId === req.user.employeeId);
    }
    res.json({ success: true, payslips: result });
});

app.get('/api/payroll/payslip-pdf/:payrollId', verifyToken, (req, res) => {
    const payslip = payslips.find(p => p.id == req.params.payrollId);
    if (!payslip) return res.status(404).send('Payslip not found');
    
    const employee = employees.find(e => e.employee_id === payslip.employeeId);
    const totalEarnings = payslip.gross + payslip.overtime + payslip.allowances;
    const totalDeductions = payslip.ssnit + payslip.tax + payslip.deductions;
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payslip - ${employee.first_name} ${employee.last_name}</title>
    <style>body{font-family:Arial;padding:40px;}.payslip{max-width:800px;margin:0 auto;border:1px solid #ddd;padding:20px;border-radius:8px;}
    .header{text-align:center;margin-bottom:30px;}.company{font-size:24px;font-weight:bold;color:#2563eb;}
    table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border:1px solid #ddd;padding:10px;text-align:left;}
    .total{font-weight:bold;background:#f0f0f0;}.net{font-size:24px;font-weight:bold;color:#10b981;text-align:right;margin-top:20px;}</style></head>
    <body><div class="payslip"><div class="header"><div class="company">PayHR Ltd.</div><div>123 Independence Avenue, Accra, Ghana</div><div>Tel: +233 30 123 4567</div></div>
    <h2>PAYSLIP - ${payslip.period}</h2>
    <div><strong>${employee.first_name} ${employee.last_name}</strong><br>${employee.position} · ${employee.department_name}<br>Employee ID: ${employee.employee_id}</div>
    <table><th>Description</th><th>Amount (GHS)</th></tr>
    <tr><td>Basic Salary</td><td>${payslip.gross.toLocaleString()}</td></tr>
    ${payslip.overtime ? `<tr><td>Overtime</td><td>${payslip.overtime.toLocaleString()}</td></tr>` : ''}
    ${payslip.allowances ? `<tr><td>Allowances</td><td>${payslip.allowances.toLocaleString()}</td></tr>` : ''}
    <tr class="total"><td>TOTAL EARNINGS</td><td>${totalEarnings.toLocaleString()}</td></tr>
    <tr><td>SSNIT (5.5%)</td><td>${payslip.ssnit.toLocaleString()}</td></tr>
    <tr><td>PAYE Tax</td><td>${payslip.tax.toLocaleString()}</td></tr>
    ${payslip.deductions ? `<tr><td>Other Deductions</td><td>${payslip.deductions.toLocaleString()}</td></tr>` : ''}
    <tr class="total"><td>TOTAL DEDUCTIONS</td><td>${totalDeductions.toLocaleString()}</td></tr>
    </table><div class="net">NET PAY: GHS ${payslip.net.toLocaleString()}</div>
    <div style="margin-top:30px;text-align:center;font-size:12px;color:#666;">Generated on: ${new Date().toLocaleString()}</div>
    </div></body></html>`;
    res.setHeader('Content-Type', 'text/html'); res.send(html);
});

// Temporary endpoint to create sample payslips
app.post('/api/create-sample-payslips', verifyToken, (req, res) => {
    const samplePayslips = [
        {
            id: Date.now(),
            employeeId: 3,
            employeeName: 'Yaw Boateng',
            position: 'HR Specialist',
            department: 'HR',
            period: 'January 2026',
            gross: 7000,
            overtime: 200,
            allowances: 300,
            deductions: 100,
            ssnit: 385,
            tax: 850,
            net: 6165
        },
        {
            id: Date.now() + 1,
            employeeId: 3,
            employeeName: 'Yaw Boateng',
            position: 'HR Specialist',
            department: 'HR',
            period: 'February 2026',
            gross: 7000,
            overtime: 150,
            allowances: 300,
            deductions: 100,
            ssnit: 385,
            tax: 850,
            net: 6115
        },
        {
            id: Date.now() + 2,
            employeeId: 3,
            employeeName: 'Yaw Boateng',
            position: 'HR Specialist',
            department: 'HR',
            period: 'March 2026',
            gross: 7000,
            overtime: 300,
            allowances: 300,
            deductions: 100,
            ssnit: 385,
            tax: 850,
            net: 6265
        }
    ];
    
    samplePayslips.forEach(slip => {
        payslips.unshift(slip);
    });
    
    res.json({ success: true, message: 'Sample payslips created', count: samplePayslips.length });
});

// ==================== LEAVE MANAGEMENT ROUTES ====================
app.get('/api/leave/types', verifyToken, (req, res) => {
    res.json({ success: true, leaveTypes });
});

// ==================== LEAVE MANAGEMENT (Employee sees only their own) ====================
app.get('/api/leave/all-balances', verifyToken, (req, res) => {
    let balances = leaveBalances;
    
    // If employee, only show their own balances
    if (req.user.role === 'employee' && req.user.employeeId) {
        balances = leaveBalances.filter(b => b.employeeId === req.user.employeeId);
        console.log(`Employee ${req.user.username} viewing their leave balances`);
    }
    
    const result = balances.map(b => ({
        ...b,
        leaveType: leaveTypes.find(l => l.id === b.leaveTypeId),
        employee: req.user.role === 'employee' ? null : employees.find(e => e.employee_id === b.employeeId)
    }));
    
    res.json({ success: true, balances: result });
});

app.post('/api/leave/request', verifyToken, (req, res) => {
    const { employeeId, leaveTypeId, startDate, endDate, reason } = req.body;
    const start = new Date(startDate), end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const balance = leaveBalances.find(b => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId);
    
    if (!balance) {
        return res.status(400).json({ success: false, message: 'Leave type not found for this employee' });
    }
    
    if (balance.remainingDays < days) {
        return res.status(400).json({ success: false, message: `Insufficient balance. Available: ${balance.remainingDays} days, Requested: ${days} days` });
    }
    
    const newRequest = {
        id: Date.now(),
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        days,
        reason: reason || '',
        status: 'Pending',
        requestedDate: new Date().toISOString()
    };
    leaveRequests.unshift(newRequest);
    res.json({ success: true, message: 'Leave request submitted successfully', request: newRequest });
});

app.post('/api/employee/leave-request', verifyToken, (req, res) => {
    if (req.user.role !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { leaveTypeId, startDate, endDate, reason } = req.body;
    const start = new Date(startDate), end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const employeeId = req.user.employeeId;
    
    const balance = leaveBalances.find(b => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId);
    
    if (!balance) {
        return res.status(400).json({ success: false, message: 'Leave type not found' });
    }
    
    if (balance.remainingDays < days) {
        return res.status(400).json({ success: false, message: `Insufficient balance. Available: ${balance.remainingDays} days` });
    }
    
    const newRequest = {
        id: Date.now(),
        employeeId,
        leaveTypeId,
        startDate,
        endDate,
        days,
        reason: reason || '',
        status: 'Pending',
        requestedDate: new Date().toISOString()
    };
    leaveRequests.unshift(newRequest);
    res.json({ success: true, message: 'Leave request submitted successfully', request: newRequest });
});

app.get('/api/leave/all-requests', verifyToken, (req, res) => {
    let requests = leaveRequests;
    
    // If employee, only show their own requests
    if (req.user.role === 'employee' && req.user.employeeId) {
        requests = leaveRequests.filter(r => r.employeeId === req.user.employeeId);
        console.log(`Employee ${req.user.username} viewing their leave requests`);
    }
    
    const result = requests.map(r => ({
        ...r,
        leaveType: leaveTypes.find(l => l.id === r.leaveTypeId),
        employee: req.user.role === 'employee' ? null : employees.find(e => e.employee_id === r.employeeId)
    }));
    
    res.json({ success: true, requests: result });
});

app.put('/api/leave/approve/:requestId', verifyToken, (req, res) => {
    const request = leaveRequests.find(r => r.id == req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    
    request.status = 'Approved';
    request.approvedDate = new Date().toISOString();
    
    const balance = leaveBalances.find(b => b.employeeId === request.employeeId && b.leaveTypeId === request.leaveTypeId);
    if (balance) {
        balance.usedDays += request.days;
        balance.remainingDays = balance.totalDays - balance.usedDays;
    }
    res.json({ success: true, message: 'Leave approved' });
});

app.get('/api/leave/summary', verifyToken, (req, res) => {
    res.json({
        success: true,
        summary: {
            pendingRequests: leaveRequests.filter(r => r.status === 'Pending').length,
            approvedRequests: leaveRequests.filter(r => r.status === 'Approved').length,
            totalDaysRequested: leaveRequests.reduce((sum, r) => sum + r.days, 0),
            employeesOnLeave: leaveRequests.filter(r => r.status === 'Approved' && new Date(r.startDate) <= new Date() && new Date(r.endDate) >= new Date()).length
        }
    });
});

// ==================== EMPLOYEE PROFILE ROUTES ====================
app.get('/api/employee/dashboard', verifyToken, (req, res) => {
    if (req.user.role !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const employee = employees.find(e => e.employee_id === req.user.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    const employeePayslips = payslips.filter(p => p.employeeId === req.user.employeeId);
    const employeeBalances = leaveBalances.filter(b => b.employeeId === req.user.employeeId).map(b => ({
        ...b,
        leaveType: leaveTypes.find(l => l.id === b.leaveTypeId)
    }));
    const employeeRequests = leaveRequests.filter(r => r.employeeId === req.user.employeeId).map(r => ({
        ...r,
        leaveType: leaveTypes.find(l => l.id === r.leaveTypeId)
    }));
    
    res.json({
        success: true,
        employee: {
            id: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            position: employee.position,
            department: employee.department_name,
            email: employee.email,
            phone: employee.phone || 'Not provided',
            hireDate: employee.hire_date,
            basicSalary: employee.basic_salary
        },
        summary: {
            totalEarned: employeePayslips.reduce((sum, p) => sum + p.net, 0),
            payslipCount: employeePayslips.length,
            lastPayslipAmount: employeePayslips[0]?.net || 0,
            lastPayslipPeriod: employeePayslips[0]?.period || 'N/A'
        },
        leaveBalances: employeeBalances,
        leaveRequests: employeeRequests,
        recentPayslips: employeePayslips.slice(0, 6)
    });
});

app.put('/api/employee/profile', verifyToken, (req, res) => {
    if (req.user.role !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const employee = employees.find(e => e.employee_id === req.user.employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });
    
    if (req.body.phone) employee.phone = req.body.phone;
    res.json({ success: true, message: 'Profile updated successfully' });
});

app.put('/api/employee/change-password', verifyToken, (req, res) => {
    if (req.user.role !== 'employee' || !req.user.employeeId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    const { currentPassword, newPassword } = req.body;
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user || user.password !== currentPassword) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    res.json({ success: true, message: 'Password changed successfully' });
});

// ==================== EMAIL ROUTES (Mock for now) ====================
app.post('/api/payroll/send-payslip-email/:payrollId', verifyToken, (req, res) => {
    // Mock email - in production, implement actual email
    console.log(`Email would be sent for payslip ${req.params.payrollId}`);
    res.json({ success: true, message: 'Email sent (mock) - Configure SMTP for production' });
});

// ==================== EXPORT ROUTES ====================
app.get('/api/export/employees', verifyToken, async (req, res) => {
    // Only admin and HR can export
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        console.log(`Security: ${req.user.username} (${req.user.role}) tried to export employees`);
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and Admin can export data.' });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Employees');
    sheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'First Name', key: 'firstName', width: 15 },
        { header: 'Last Name', key: 'lastName', width: 15 },
        { header: 'Email', key: 'email', width: 25 },
        { header: 'Position', key: 'position', width: 20 },
        { header: 'Department', key: 'department', width: 15 },
        { header: 'Salary', key: 'salary', width: 15 },
        { header: 'Status', key: 'status', width: 10 }
    ];
    employees.forEach(emp => {
        sheet.addRow({
            id: emp.employee_id,
            firstName: emp.first_name,
            lastName: emp.last_name,
            email: emp.email,
            position: emp.position,
            department: emp.department_name,
            salary: emp.basic_salary,
            status: emp.status
        });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
    await workbook.xlsx.write(res);
    res.end();
});

app.get('/api/export/payroll-report', verifyToken, async (req, res) => {
    // Only admin and HR can export payroll reports
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and Admin can export payroll reports.' });
    }
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Payroll Report');
    sheet.columns = [
        { header: 'Employee', key: 'employee', width: 20 },
        { header: 'Period', key: 'period', width: 15 },
        { header: 'Gross', key: 'gross', width: 12 },
        { header: 'SSNIT', key: 'ssnit', width: 12 },
        { header: 'PAYE', key: 'paye', width: 12 },
        { header: 'Net', key: 'net', width: 12 }
    ];
    payslips.forEach(p => {
        sheet.addRow({
            employee: p.employeeName,
            period: p.period,
            gross: p.gross,
            ssnit: p.ssnit,
            paye: p.tax,
            net: p.net
        });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=payroll_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
});

app.get('/api/export/tax-report', verifyToken, async (req, res) => {
    // Only admin and HR can export tax reports
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and Admin can export tax reports.' });
    }
    
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tax Report');
    sheet.columns = [
        { header: 'Employee', key: 'employee', width: 20 },
        { header: 'Monthly Salary', key: 'salary', width: 15 },
        { header: 'Annual Salary', key: 'annual', width: 15 },
        { header: 'PAYE Tax', key: 'paye', width: 12 },
        { header: 'Effective Rate', key: 'rate', width: 12 }
    ];
    employees.forEach(emp => {
        const paye = calculatePAYE(emp.basic_salary);
        sheet.addRow({
            employee: `${emp.first_name} ${emp.last_name}`,
            salary: emp.basic_salary,
            annual: emp.basic_salary * 12,
            paye: paye,
            rate: `${Math.round((paye / emp.basic_salary) * 100)}%`
        });
    });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tax_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
});

// ==================== BANK FILE ROUTES ====================
app.get('/api/bank/generate-csv', verifyToken, (req, res) => {
    // Only admin and HR can generate bank files
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and Admin can generate bank files.' });
    }

    const headers = ['Employee ID', 'Employee Name', 'Amount', 'Bank Code', 'Account Number'];
    const rows = [headers];
    payslips.forEach(p => {
        rows.push([p.employeeId, p.employeeName, p.net, 'XXXX', '0000000000']);
    });
    const csv = rows.map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=salary_payments.csv');
    res.send(csv);
});

app.get('/api/bank/generate-gip', verifyToken, (req, res) => {
    // Only admin and HR can generate bank files
    if (req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({ success: false, message: 'Access denied. Only HR and Admin can generate bank files.' });
    }

    const lines = [`HDR|PAYHR|${new Date().toISOString().slice(0,10)}|PAYROLL|${payslips.length}|`];
    payslips.forEach(p => {
        lines.push(`DTL|XXXX|XXXX|0000000000|${p.employeeId}|${p.employeeName}|${p.net.toFixed(2)}|`);
    });
    const total = payslips.reduce((sum, p) => sum + p.net, 0);
    lines.push(`TRL|${payslips.length}|${total.toFixed(2)}||`);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename=salary_payments.gip');
    res.send(lines.join('\n'));
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📊 API: http://localhost:${PORT}/api/employees`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log(`\n✅ TEST CREDENTIALS:`);
    console.log(`   Admin:      admin / admin123`);
    console.log(`   HR Manager: hr_manager / hr123`);
    console.log(`   Employee:   kofi.asante / employee123`);
    console.log(`   Employee:   ama.mensah / employee123`);
    console.log(`   Employee:   yaw.boateng / employee123\n`);
});