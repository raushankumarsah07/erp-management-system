import React, { useState } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Layers, Lock, Mail, User, Briefcase, Phone } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'sales',
    department: 'Sales & Marketing',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        phone: formData.phone,
      });
      toast.success('Registration successful! Welcome to the team.');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 brand-logo"
            style={{ width: '52px', height: '52px', fontSize: '1.4rem' }}
          >
            <Layers size={28} />
          </div>
          <h4 className="fw-bold text-dark mb-1">Create ERP Account</h4>
          <p className="text-muted small">Register a new employee profile to access modules</p>
        </div>

        {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}

        <Form onSubmit={handleRegister}>
          <Form.Group className="mb-3" controlId="regName">
            <Form.Label className="small fw-semibold text-secondary">Full Name</Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <User size={16} />
              </span>
              <Form.Control
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="border-start-0 ps-0"
              />
            </div>
          </Form.Group>

          <Row>
            <Col md={7}>
              <Form.Group className="mb-3" controlId="regEmail">
                <Form.Label className="small fw-semibold text-secondary">Email Address</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Mail size={16} />
                  </span>
                  <Form.Control
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@erp.com"
                    className="border-start-0 ps-0"
                  />
                </div>
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group className="mb-3" controlId="regRole">
                <Form.Label className="small fw-semibold text-secondary">Assigned Role</Form.Label>
                <Form.Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="sales">Sales</option>
                  <option value="purchase">Purchase</option>
                  <option value="inventory">Inventory</option>
                  <option value="finance">Finance</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="regDept">
                <Form.Label className="small fw-semibold text-secondary">Department</Form.Label>
                <Form.Control
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Operations"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="regPhone">
                <Form.Label className="small fw-semibold text-secondary">Phone (Optional)</Form.Label>
                <Form.Control
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-4" controlId="regPass">
                <Form.Label className="small fw-semibold text-secondary">Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-4" controlId="regConfirmPass">
                <Form.Label className="small fw-semibold text-secondary">Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                />
              </Form.Group>
            </Col>
          </Row>

          <Button
            type="submit"
            variant="primary"
            className="w-100 py-2.5 fw-semibold mb-3 shadow-sm"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Account'}
          </Button>

          <div className="text-center small text-muted">
            Already registered?{' '}
            <Link to="/login" className="fw-semibold text-primary text-decoration-none">
              Sign In here
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default RegisterPage;
