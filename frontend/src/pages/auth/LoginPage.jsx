import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { Layers, Lock, Mail, UserCheck, Shield } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Welcome back to Enterprise ERP!");
      navigate("/dashboard");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.code === "ERR_NETWORK"
          ? 'Cannot reach the ERP backend. Start the backend server with "cd backend && npm start", then try again.'
          : err.message) ||
        "Failed to login";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (roleEmail) => {
    setEmail(roleEmail);
    setPassword("password123");
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 brand-logo"
            style={{ width: "52px", height: "52px", fontSize: "1.4rem" }}
          >
            <Layers size={28} />
          </div>
          <h4 className="fw-bold text-dark mb-1">Apex Enterprise ERP</h4>
          <p className="text-muted small">
            Sign in to manage your business operations
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 small">
            {error}
          </Alert>
        )}

        {/* Form */}
        <Form onSubmit={handleLogin}>
          <Form.Group className="mb-3" controlId="loginEmail">
            <Form.Label className="small fw-semibold text-secondary">
              Work Email
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Mail size={16} />
              </span>
              <Form.Control
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="border-start-0 ps-0"
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-4" controlId="loginPassword">
            <Form.Label className="small fw-semibold text-secondary">
              Password
            </Form.Label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                <Lock size={16} />
              </span>
              <Form.Control
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border-start-0 ps-0"
              />
            </div>
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 py-2.5 fw-semibold mb-3 shadow-sm"
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </Form>

        {/* Demo Fast Login Switcher */}
        {/* <div className="p-3 bg-light rounded-3 border mt-3">
          <div className="d-flex align-items-center gap-1 mb-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
            <UserCheck size={14} className="text-primary" />
            <span>QUICK DEMO ACCOUNTS (Click to fill):</span>
          </div>
          <div className="d-flex flex-wrap gap-1.5">
            <Button
              variant="outline-danger"
              size="sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setDemoCredentials('admin@erp.com')}
            >
              👑 Admin
            </Button>
            <Button
              variant="outline-primary"
              size="sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setDemoCredentials('sales@erp.com')}
            >
              💼 Sales
            </Button>
            <Button
              variant="outline-info"
              size="sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setDemoCredentials('purchase@erp.com')}
            >
              📦 Purchase
            </Button>
            <Button
              variant="outline-warning"
              size="sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setDemoCredentials('inventory@erp.com')}
            >
              🏭 Inventory
            </Button>
            <Button
              variant="outline-success"
              size="sm"
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
              onClick={() => setDemoCredentials('finance@erp.com')}
            >
              💵 Finance
            </Button>
          </div>
        </div> */}

        <div className="text-center mt-3 small text-muted">
          Need an account?{" "}
          <Link
            to="/register"
            className="fw-semibold text-primary text-decoration-none"
          >
            Register new employee
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
