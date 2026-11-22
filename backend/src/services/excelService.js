const ExcelJS = require('exceljs');

class ExcelService {
    static async generatePayrollReport(employees, payslips, period) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'PayHR System';
        workbook.created = new Date();
        
        // Summary Sheet
        const summarySheet = workbook.addWorksheet('Payroll Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];
        
        const totalGross = payslips.reduce((sum, p) => sum + p.gross, 0);
        const totalTax = payslips.reduce((sum, p) => sum + p.tax, 0);
        const totalSSNIT = payslips.reduce((sum, p) => sum + p.ssnit, 0);
        const totalNet = payslips.reduce((sum, p) => sum + p.net, 0);
        
        summarySheet.addRows([
            { metric: 'Report Period', value: period },
            { metric: 'Generated Date', value: new Date().toLocaleString() },
            { metric: 'Total Employees', value: employees.length },
            { metric: 'Total Gross Payroll', value: `GH₵ ${totalGross.toLocaleString()}` },
            { metric: 'Total SSNIT Deduction', value: `GH₵ ${totalSSNIT.toLocaleString()}` },
            { metric: 'Total PAYE Tax', value: `GH₵ ${totalTax.toLocaleString()}` },
            { metric: 'Total Net Payroll', value: `GH₵ ${totalNet.toLocaleString()}` }
        ]);
        
        // Details Sheet
        const detailsSheet = workbook.addWorksheet('Employee Details');
        detailsSheet.columns = [
            { header: 'Employee ID', key: 'id', width: 12 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Department', key: 'dept', width: 15 },
            { header: 'Position', key: 'position', width: 20 },
            { header: 'Gross Salary', key: 'gross', width: 15 },
            { header: 'Overtime', key: 'overtime', width: 12 },
            { header: 'Allowances', key: 'allowances', width: 12 },
            { header: 'SSNIT', key: 'ssnit', width: 12 },
            { header: 'PAYE Tax', key: 'tax', width: 12 },
            { header: 'Other Deductions', key: 'deductions', width: 15 },
            { header: 'Net Salary', key: 'net', width: 15 }
        ];
        
        payslips.forEach(p => {
            detailsSheet.addRow({
                id: p.employeeId,
                name: p.employeeName,
                dept: p.department,
                position: p.position,
                gross: p.gross,
                overtime: p.overtime || 0,
                allowances: p.allowances || 0,
                ssnit: p.ssnit,
                tax: p.tax,
                deductions: p.deductions || 0,
                net: p.net
            });
        });
        
        // Style the sheets
        [summarySheet, detailsSheet].forEach(sheet => {
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF667EEA' }
            };
        });
        
        return workbook;
    }
    
    static async generateTaxReport(employees, period) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Tax Report');
        
        sheet.columns = [
            { header: 'Employee', key: 'employee', width: 25 },
            { header: 'Monthly Gross', key: 'gross', width: 15 },
            { header: 'Annual Gross', key: 'annualGross', width: 15 },
            { header: 'SSNIT (5.5%)', key: 'ssnit', width: 15 },
            { header: 'PAYE Tax', key: 'tax', width: 15 },
            { header: 'Annual Tax', key: 'annualTax', width: 15 },
            { header: 'Effective Rate', key: 'rate', width: 12 }
        ];
        
        employees.forEach(emp => {
            const ssnit = emp.basic_salary * 0.055;
            // Simple PAYE calculation
            let tax = 0;
            let annual = emp.basic_salary * 12;
            if (annual > 490) {
                if (annual <= 700) tax = (annual - 490) * 0.05;
                else if (annual <= 3116) tax = (210 * 0.05) + ((annual - 700) * 0.10);
                else if (annual <= 5500) tax = (210 * 0.05) + (2416 * 0.10) + ((annual - 3116) * 0.175);
                else tax = (210 * 0.05) + (2416 * 0.10) + (2384 * 0.175) + ((annual - 5500) * 0.25);
            }
            
            sheet.addRow({
                employee: `${emp.first_name} ${emp.last_name}`,
                gross: emp.basic_salary,
                annualGross: emp.basic_salary * 12,
                ssnit: ssnit,
                tax: tax,
                annualTax: tax * 12,
                rate: `${Math.round((tax / emp.basic_salary) * 100)}%`
            });
        });
        
        return workbook;
    }
    
    static async generateEmployeeList(employees) {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Employee Directory');
        
        sheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'First Name', key: 'firstName', width: 15 },
            { header: 'Last Name', key: 'lastName', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Position', key: 'position', width: 20 },
            { header: 'Department', key: 'department', width: 15 },
            { header: 'Salary', key: 'salary', width: 15 },
            { header: 'Hire Date', key: 'hireDate', width: 12 },
            { header: 'Status', key: 'status', width: 10 }
        ];
        
        employees.forEach(emp => {
            sheet.addRow({
                id: emp.employee_id,
                firstName: emp.first_name,
                lastName: emp.last_name,
                email: emp.email,
                position: emp.position || 'Staff',
                department: emp.department_name || 'General',
                salary: emp.basic_salary,
                hireDate: emp.hire_date,
                status: emp.status
            });
        });
        
        return workbook;
    }
}

module.exports = ExcelService;