import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import './styles/payroll.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    dept: 'Engineering',
    pos: '',
    salary: '',
    ssn: '',
    bank: ''
  });
  const [calcValues, setCalcValues] = useState({
    employeeId: '',
    gross: 0,
    ot: 0,
    allow: 0,
    ded: 0,
    ssnit: 0,
    paye: 0,
    net: 0
  });

  // Fetch employees from backend
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/employees`, {
        headers: { 'x-auth-token': localStorage.getItem('token') || 'demo' }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.employees && data.employees.length > 0) {
          // Transform backend data to frontend format
          const transformedEmployees = data.employees.map(emp => ({
            id: emp.employee_id,
            name: `${emp.first_name} ${emp.last_name}`,
            dept: emp.department_name || 'General',
            pos: emp.position,
            salary: emp.basic_salary,
            ssn: emp.tax_id || 'N/A',
            bank: emp.bank_account || 'N/A',
            status: emp.status
          }));
          setEmployees(transformedEmployees);
        } else {
          // Load mock data if no employees in database
          loadMockData();
        }
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      loadMockData();
    }
  };

  const loadMockData = () => {
    const mockEmployees = [
      { id: 1, name: 'Kofi Asante', dept: 'Engineering', pos: 'Senior Developer', salary: 12000, ssn: 'G-001234', bank: '1234567890', status: 'Active' },
      { id: 2, name: 'Ama Mensah', dept: 'Finance', pos: 'Finance Manager', salary: 9500, ssn: 'G-002345', bank: '2345678901', status: 'Active' },
      { id: 3, name: 'Yaw Boateng', dept: 'HR', pos: 'HR Specialist', salary: 7000, ssn: 'G-003456', bank: '3456789012', status: 'Active' },
      { id: 4, name: 'Abena Osei', dept: 'Sales', pos: 'Sales Lead', salary: 8200, ssn: 'G-004567', bank: '4567890123', status: 'Active' },
      { id: 5, name: 'Kwame Darko', dept: 'Engineering', pos: 'Backend Engineer', salary: 10500, ssn: 'G-005678', bank: '5678901234', status: 'Active' },
    ];
    setEmployees(mockEmployees);
  };

  const initials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const fmt = (n) => {
    return 'GH₵ ' + Math.round(n).toLocaleString();
  };

  const avatarColor = (i) => {
    const colors = ['#B5D4F4', '#9FE1CB', '#FAEEDA', '#F4C0D1', '#C0DD97', '#F5C4B3'];
    return colors[i % colors.length];
  };

  const calcPAYE = (gross) => {
    const bands = [[490, 0], [210, 0.05], [2416, 0.10], [2384, 0.175], [4500, 0.25], [Infinity, 0.30]];
    let tax = 0, rem = Math.max(0, gross);
    for (const [band, rate] of bands) {
      const chunk = Math.min(rem, band);
      tax += chunk * rate;
      rem -= chunk;
      if (rem <= 0) break;
    }
    return tax;
  };

  const calcBreakdown = (gross, ot, allow, extraDed) => {
    const total = gross + (ot || 0) + (allow || 0);
    const ssnit = total * 0.055;
    const taxable = total - ssnit;
    const paye = calcPAYE(taxable);
    const net = total - ssnit - paye - (extraDed || 0);
    return { total, ssnit, paye, net };
  };

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.salary) {
      toast.error('Please enter name and salary');
      return;
    }

    const nameParts = newEmployee.name.split(' ');
    const employeeData = {
      first_name: nameParts[0],
      last_name: nameParts.slice(1).join(' ') || 'Unknown',
      email: `${newEmployee.name.toLowerCase().replace(' ', '.')}@company.com`,
      position: newEmployee.pos,
      basic_salary: parseFloat(newEmployee.salary),
      department_id: getDepartmentId(newEmployee.dept),
      employment_type: 'Full-time',
      tax_id: newEmployee.ssn,
      bank_account: newEmployee.bank
    };

    try {
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token') || 'demo'
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        toast.success('Employee added successfully!');
        setShowAddForm(false);
        setNewEmployee({ name: '', dept: 'Engineering', pos: '', salary: '', ssn: '', bank: '' });
        fetchEmployees(); // Refresh list
      } else {
        // Fallback to local addition
        const newId = employees.length + 1;
        setEmployees([...employees, {
          id: newId,
          name: newEmployee.name,
          dept: newEmployee.dept,
          pos: newEmployee.pos,
          salary: parseFloat(newEmployee.salary),
          ssn: newEmployee.ssn,
          bank: newEmployee.bank,
          status: 'Active'
        }]);
        toast.success('Employee added locally');
        setShowAddForm(false);
        setNewEmployee({ name: '', dept: 'Engineering', pos: '', salary: '', ssn: '', bank: '' });
      }
    } catch (error) {
      // Local fallback
      const newId = employees.length + 1;
      setEmployees([...employees, {
        id: newId,
        name: newEmployee.name,
        dept: newEmployee.dept,
        pos: newEmployee.pos,
        salary: parseFloat(newEmployee.salary),
        ssn: newEmployee.ssn,
        bank: newEmployee.bank,
        status: 'Active'
      }]);
      toast.success('Employee added locally');
      setShowAddForm(false);
      setNewEmployee({ name: '', dept: 'Engineering', pos: '', salary: '', ssn: '', bank: '' });
    }
  };

  const getDepartmentId = (deptName) => {
    const deptMap = { 'Engineering': 3, 'Finance': 2, 'HR': 1, 'Sales': 4, 'Operations': 6 };
    return deptMap[deptName] || 3;
  };

  const handleCalcChange = (field, value) => {
    const newValues = { ...calcValues, [field]: parseFloat(value) || 0 };
    setCalcValues(newValues);
    
    if (newValues.employeeId && newValues.gross) {
      const b = calcBreakdown(newValues.gross, newValues.ot, newValues.allow, newValues.ded);
      setCalcValues({ ...newValues, ssnit: b.ssnit, paye: b.paye, net: b.net });
    }
  };

  const runPayroll = () => {
    const emp = employees.find(e => e.id === parseInt(calcValues.employeeId));
    if (!emp) {
      toast.error('Please select an employee');
      return;
    }

    const b = calcBreakdown(calcValues.gross, calcValues.ot, calcValues.allow, calcValues.ded);
    const slip = {
      id: Date.now(),
      emp,
      gross: calcValues.gross,
      ot: calcValues.ot,
      allow: calcValues.allow,
      ded: calcValues.ded,
      ...b,
      period: 'May 2026'
    };
    
    setPayslips([slip, ...payslips.filter(p => p.emp.id !== emp.id)]);
    toast.success('Payroll processed successfully!');
    setActivePage('payslip');
  };

  const getDashboardStats = () => {
    let totalGross = 0, totalTax = 0, totalNet = 0;
    employees.forEach(e => {
      const b = calcBreakdown(e.salary, 0, 0, 0);
      totalGross += b.total;
      totalTax += b.paye;
      totalNet += b.net;
    });
    return { totalGross, totalTax, totalNet };
  };

  const stats = getDashboardStats();

  return (
    <>
      <Toaster position="top-right" />
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">🏢 PayHR</div>
          <div className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePage('dashboard')}>
            📊 Dashboard
          </div>
          <div className={`nav-item ${activePage === 'employees' ? 'active' : ''}`} onClick={() => setActivePage('employees')}>
            👥 Employees
          </div>
          <div className={`nav-item ${activePage === 'payroll' ? 'active' : ''}`} onClick={() => setActivePage('payroll')}>
            🧮 Run Payroll
          </div>
          <div className={`nav-item ${activePage === 'payslip' ? 'active' : ''}`} onClick={() => setActivePage('payslip')}>
            📄 Payslips
          </div>
          <div className={`nav-item ${activePage === 'tax' ? 'active' : ''}`} onClick={() => setActivePage('tax')}>
            📊 Tax summary
          </div>
        </div>

        <div className="main">
          {/* Dashboard Page */}
          {activePage === 'dashboard' && (
            <div className="page active">
              <div className="page-title">Dashboard</div>
              <div className="metrics">
                <div className="metric">
                  <div className="metric-label">Total employees</div>
                  <div className="metric-value">{employees.length}</div>
                  <div className="metric-sub">Active staff</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Monthly payroll</div>
                  <div className="metric-value">{fmt(stats.totalGross)}</div>
                  <div className="metric-sub">Due Jun 28</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Tax withheld</div>
                  <div className="metric-value">{fmt(stats.totalTax)}</div>
                  <div className="metric-sub">May 2026</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Net disbursed</div>
                  <div className="metric-value">{fmt(stats.totalNet)}</div>
                  <div className="metric-sub">Last run: May 30</div>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Recent payroll activity</span>
                  <span className="badge badge-success">May 2026 processed</span>
                </div>
                <table>
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Gross pay</th><th>Net pay</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {employees.slice(0, 5).map((e, i) => {
                      const b = calcBreakdown(e.salary, 0, 0, 0);
                      return (
                        <tr key={e.id}>
                          <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            <div className="avatar" style={{background: avatarColor(i), color:'#0C447C'}}>{initials(e.name)}</div>
                            {e.name}
                          </div></td>
                          <td>{e.dept}</td>
                          <td>{fmt(b.total)}</td>
                          <td>{fmt(b.net)}</td>
                          <td><span className="badge badge-success">Paid</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Employees Page */}
          {activePage === 'employees' && (
            <div className="page active">
              <div className="page-title">Employees</div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Employee register</span>
                  <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                    ➕ Add employee
                  </button>
                </div>
                
                {showAddForm && (
                  <div style={{marginBottom: '1rem'}}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Full name</label>
                        <input value={newEmployee.name} onChange={e => setNewEmployee({...newEmployee, name: e.target.value})} placeholder="e.g. Ama Mensah" />
                      </div>
                      <div className="form-group">
                        <label>Department</label>
                        <select value={newEmployee.dept} onChange={e => setNewEmployee({...newEmployee, dept: e.target.value})}>
                          <option>Engineering</option><option>Finance</option><option>HR</option><option>Sales</option><option>Operations</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Position</label>
                        <input value={newEmployee.pos} onChange={e => setNewEmployee({...newEmployee, pos: e.target.value})} placeholder="e.g. Software Engineer" />
                      </div>
                      <div className="form-group">
                        <label>Gross monthly salary (GH₵)</label>
                        <input type="number" value={newEmployee.salary} onChange={e => setNewEmployee({...newEmployee, salary: e.target.value})} placeholder="e.g. 8000" />
                      </div>
                      <div className="form-group">
                        <label>Social Security No.</label>
                        <input value={newEmployee.ssn} onChange={e => setNewEmployee({...newEmployee, ssn: e.target.value})} placeholder="SSNIT number" />
                      </div>
                      <div className="form-group">
                        <label>Bank account</label>
                        <input value={newEmployee.bank} onChange={e => setNewEmployee({...newEmployee, bank: e.target.value})} placeholder="Account number" />
                      </div>
                    </div>
                    <div style={{marginTop: '1rem', display: 'flex', gap: '8px'}}>
                      <button className="btn btn-primary" onClick={addEmployee}>Save employee</button>
                      <button className="btn" onClick={() => setShowAddForm(false)}>Cancel</button>
                    </div>
                    <div className="divider"></div>
                  </div>
                )}
                
                <table>
                  <thead>
                    <tr><th>Name</th><th>Department</th><th>Position</th><th>Gross salary</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {employees.map((e, i) => (
                      <tr key={e.id}>
                        <td><div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                          <div className="avatar" style={{background: avatarColor(i), color:'#0C447C'}}>{initials(e.name)}</div>
                          {e.name}
                        </div></td>
                        <td>{e.dept}</td>
                        <td>{e.pos}</td>
                        <td>{fmt(e.salary)}</td>
                        <td><span className="badge badge-success">{e.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Run Payroll Page */}
          {activePage === 'payroll' && (
            <div className="page active">
              <div className="page-title">Run payroll</div>
              <div className="card">
                <div className="card-title" style={{marginBottom: '1rem'}}>Select employee & calculate</div>
                <div className="select-emp">
                  <div className="form-group" style={{flex:1}}>
                    <label>Employee</label>
                    <select value={calcValues.employeeId} onChange={e => handleCalcChange('employeeId', e.target.value)}>
                      <option value="">Select employee</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Pay period</label>
                    <select><option>May 2026</option><option>Jun 2026</option></select>
                  </div>
                </div>
                <div className="form-grid" style={{marginBottom: '1rem'}}>
                  <div className="form-group">
                    <label>Gross salary (GH₵)</label>
                    <input type="number" value={calcValues.gross} onChange={e => handleCalcChange('gross', e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Overtime (GH₵)</label>
                    <input type="number" value={calcValues.ot} onChange={e => handleCalcChange('ot', e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Allowances (GH₵)</label>
                    <input type="number" value={calcValues.allow} onChange={e => handleCalcChange('allow', e.target.value)} placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label>Other deductions (GH₵)</label>
                    <input type="number" value={calcValues.ded} onChange={e => handleCalcChange('ded', e.target.value)} placeholder="0" />
                  </div>
                </div>
                <div className="divider"></div>
                <div style={{fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px'}}>Computed deductions (Ghana statutory)</div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '1rem'}}>
                  <div className="metric">
                    <div className="metric-label">SSNIT (5.5%)</div>
                    <div className="metric-value" style={{fontSize: '16px'}}>{fmt(calcValues.ssnit)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Income tax (PAYE)</div>
                    <div className="metric-value" style={{fontSize: '16px'}}>{fmt(calcValues.paye)}</div>
                  </div>
                  <div className="metric">
                    <div className="metric-label">Net pay</div>
                    <div className="metric-value" style={{fontSize: '16px', color: '#185FA5'}}>{fmt(calcValues.net)}</div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={runPayroll}>▶ Process & generate payslip</button>
              </div>
            </div>
          )}

          {/* Payslips Page */}
          {activePage === 'payslip' && (
            <div className="page active">
              <div className="page-title">Payslips</div>
              <div style={{display: 'flex', gap: '1rem'}}>
                <div className="card" style={{width: '220px', flexShrink: 0}}>
                  <div className="card-title" style={{marginBottom: '1rem'}}>Processed payslips</div>
                  <div id="slip-list" style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                    {payslips.length === 0 ? (
                      <div style={{fontSize: '13px', color: 'var(--color-text-secondary)'}}>No payslips yet. Run payroll first.</div>
                    ) : (
                      payslips.map(s => (
                        <div key={s.id} onClick={() => {/* Show payslip */}} style={{padding: '9px 10px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', cursor: 'pointer', fontSize: '13px'}}>
                          <div style={{fontWeight: '500'}}>{s.emp.name}</div>
                          <div style={{color: 'var(--color-text-secondary)', fontSize: '12px'}}>{s.period} · {fmt(s.net)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div id="slip-view" style={{flex: 1}}>
                  {payslips.length > 0 && (
                    <div className="payslip">
                      <div className="payslip-header">
                        <div><div className="payslip-company">PayHR Ltd.</div><div style={{fontSize: '12px', color: 'var(--color-text-secondary)'}}>Company payslip</div></div>
                        <div style={{textAlign: 'right'}}><div style={{fontSize: '13px', fontWeight: '500'}}>{payslips[0].period}</div><div className="payslip-period">Generated {new Date().toLocaleDateString()}</div></div>
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem', padding: '12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)'}}>
                        <div className="avatar" style={{width: '40px', height: '40px', background: '#B5D4F4', color: '#0C447C', fontSize: '14px'}}>{initials(payslips[0].emp.name)}</div>
                        <div><div style={{fontWeight: '500'}}>{payslips[0].emp.name}</div><div style={{fontSize: '12px', color: 'var(--color-text-secondary)'}}>{payslips[0].emp.pos} · {payslips[0].emp.dept}</div></div>
                      </div>
                      <div className="payslip-total"><span>Net pay</span><span style={{color: '#185FA5'}}>{fmt(payslips[0].net)}</span></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tax Summary Page */}
          {activePage === 'tax' && (
            <div className="page active">
              <div className="page-title">Tax summary</div>
              <div className="card">
                <div className="card-header"><span className="card-title">Ghana PAYE tax bands (2026)</span></div>
                <table>
                  <thead><tr><th>Monthly income (GH₵)</th><th>Rate</th><th>Description</th></tr></thead>
                  <tbody>
                    <tr><td>0 – 490</td><td><span className="badge badge-success">0%</span></td><td>Tax-free threshold</td></tr>
                    <tr><td>491 – 700</td><td><span className="badge badge-info">5%</span></td><td>Basic rate</td></tr>
                    <tr><td>701 – 3,116</td><td><span className="badge badge-info">10%</span></td><td>Standard rate</td></tr>
                    <tr><td>3,117 – 5,500</td><td><span className="badge badge-warning">17.5%</span></td><td>Higher rate</td></tr>
                    <tr><td>5,501 – 10,000</td><td><span className="badge badge-warning">25%</span></td><td>Upper rate</td></tr>
                    <tr><td>Above 10,000</td><td><span className="badge" style={{background: '#FCEBEB', color: '#A32D2D'}}>30%</span></td><td>Top rate</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Monthly PAYE liability (all employees)</span></div>
                <div id="tax-summary-table">
                  <table>
                    <thead><tr><th>Employee</th><th>Gross</th><th>SSNIT</th><th>PAYE</th><th>Eff. rate</th></tr></thead>
                    <tbody>
                      {employees.map(e => {
                        const b = calcBreakdown(e.salary, 0, 0, 0);
                        return (
                          <tr key={e.id}>
                            <td>{e.name}</td>
                            <td>{fmt(b.total)}</td>
                            <td>{fmt(b.ssnit)}</td>
                            <td>{fmt(b.paye)}</td>
                            <td><span className="badge badge-info">{Math.round(b.paye / b.total * 100)}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{fontWeight: '500'}}>
                        <td>Total</td>
                        <td>{fmt(stats.totalGross)}</td>
                        <td>{fmt(employees.reduce((sum, e) => sum + calcBreakdown(e.salary, 0, 0, 0).ssnit, 0))}</td>
                        <td>{fmt(stats.totalTax)}</td>
                        <td><span className="badge badge-info">{Math.round(stats.totalTax / stats.totalGross * 100)}%</span></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;