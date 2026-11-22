class BankService {
    // Ghana Interbank Payment (GIP) format
    static generateGIPFile(payments, period) {
        const lines = [];
        const now = new Date();
        
        // Header Record
        lines.push(`HDR|PAYHR|${now.toISOString().slice(0,10)}|PAYROLL|${period}|${payments.length}|`);
        
        // Detail Records
        payments.forEach(p => {
            const bankCode = p.bankCode || 'XXXX';
            const branchCode = p.branchCode || 'XXXX';
            const accountNumber = p.accountNumber || '0000000000';
            const amount = p.amount.toFixed(2);
            
            lines.push(`DTL|${bankCode}|${branchCode}|${accountNumber}|${p.employeeId}|${p.employeeName}|${amount}|`);
        });
        
        // Trailer Record
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
        lines.push(`TRL|${payments.length}|${totalAmount.toFixed(2)}||`);
        
        return lines.join('\n');
    }
    
    // CSV format for bank upload
    static generateBankCSV(payments) {
        const headers = ['Employee ID', 'Employee Name', 'Bank Code', 'Branch Code', 'Account Number', 'Amount', 'Reference'];
        const rows = [headers];
        
        payments.forEach(p => {
            rows.push([
                p.employeeId,
                p.employeeName,
                p.bankCode || 'XXXX',
                p.branchCode || 'XXXX',
                p.accountNumber || '0000000000',
                p.amount.toFixed(2),
                `PAYROLL_${new Date().toISOString().slice(0,10)}`
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    // MT940 format (SWIFT bank statement)
    static generateMT940(payments, accountNumber) {
        const lines = [];
        const now = new Date();
        const ref = `PAYROLL${now.toISOString().slice(0,10).replace(/-/g, '')}`;
        
        lines.push(':20:START');
        lines.push(`:25:${accountNumber}`);
        lines.push(`:28C:1`);
        lines.push(`:60F:C${now.toISOString().slice(0,10).replace(/-/g, '')}EUR0,00`);
        
        payments.forEach(p => {
            lines.push(`:61:${now.toISOString().slice(0,10).replace(/-/g, '')}${now.toISOString().slice(0,10).replace(/-/g, '')}CD${p.amount.toFixed(2)}NTRF${ref}`);
            lines.push(`:86:${p.employeeName} Salary Payment`);
        });
        
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        lines.push(`:62F:C${now.toISOString().slice(0,10).replace(/-/g, '')}EUR${total.toFixed(2)}`);
        lines.push(`-`);
        
        return lines.join('\n');
    }
}

module.exports = BankService;