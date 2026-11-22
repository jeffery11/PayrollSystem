const nodemailer = require('nodemailer');

// Email configuration (use your actual email settings)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // For Gmail
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
});

async function sendEmail(to, subject, html, attachments = []) {
    try {
        const info = await transporter.sendMail({
            from: `"PayHR Payroll" <${process.env.EMAIL_USER || 'payroll@payhr.com'}>`,
            to: to,
            subject: subject,
            html: html,
            attachments: attachments
        });
        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}

function generatePayslipEmailHtml(employee, payslip, period) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
                .content { padding: 20px; background: #f9fafb; border-radius: 10px; margin-top: 20px; }
                .amount { font-size: 28px; font-weight: bold; color: #10b981; }
                .details { margin: 20px 0; padding: 15px; background: white; border-radius: 8px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>PayHR Payroll System</h2>
                    <p>Payslip for ${period}</p>
                </div>
                <div class="content">
                    <h3>Dear ${employee.first_name} ${employee.last_name},</h3>
                    <p>Your payslip for <strong>${period}</strong> is now ready.</p>
                    
                    <div class="details">
                        <table style="width:100%; border-collapse: collapse;">
                            <tr><td><strong>Employee ID:</strong></td><td>${employee.employee_id}</td></tr>
                            <tr><td><strong>Position:</strong></td><td>${employee.position || 'Staff'}</td></tr>
                            <tr><td><strong>Department:</strong></td><td>${employee.department_name || 'General'}</td></tr>
                            <tr style="border-top:1px solid #ddd;"><td><strong>Basic Salary:</strong></td><td>GH₵ ${payslip.gross.toLocaleString()}</td></tr>
                            <tr><td><strong>SSNIT (5.5%):</strong></td><td>GH₵ ${payslip.ssnit.toLocaleString()}</td></tr>
                            <tr><td><strong>PAYE Tax:</strong></td><td>GH₵ ${payslip.tax.toLocaleString()}</td></tr>
                            <tr style="border-top:2px solid #ddd;"><td><strong><span style="font-size:18px;">NET PAY:</span></strong></td><td><span class="amount">GH₵ ${payslip.net.toLocaleString()}</span></td></tr>
                        </table>
                    </div>
                    
                    <p>Your salary has been processed and will be credited to your registered bank account.</p>
                    <p style="text-align: center; margin-top: 20px;">
                        <a href="http://localhost:3000" class="btn">View Dashboard</a>
                    </p>
                </div>
                <div class="footer">
                    <p>This is an automated message from PayHR Payroll System.<br>
                    For any queries, please contact HR department.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = { sendEmail, generatePayslipEmailHtml };