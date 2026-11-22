const Employee = require('../models/Employee');

exports.getAllEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const departmentId = req.query.departmentId;
        const search = req.query.search;

        const result = await Employee.findAll(page, limit, { departmentId, search });
        res.json({
            success: true,
            employees: result.employees,
            total: result.total,
            page: result.page,
            totalPages: result.totalPages
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to fetch employees', error: error.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        const employee = await Employee.create(req.body);
        res.status(201).json({ success: true, employee, message: 'Employee created successfully' });
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.update(req.params.id, req.body);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, employee, message: 'Employee updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.delete(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        res.json({ success: true, message: 'Employee deactivated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getDepartments = async (req, res) => {
    try {
        const departments = await Employee.getDepartments();
        res.json({ success: true, departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};