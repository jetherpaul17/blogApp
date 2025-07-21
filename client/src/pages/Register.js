import React, { useState } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { useAuth } from '../context/auth/AuthState';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');

  const { username, email, password } = formData;
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = await register(formData);
      if (data.token) {
        // Registration successful, redirect to login
        navigate('/login', { 
          state: { message: 'Registration successful! Please log in with your credentials.' }
        });
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Unable to connect to server. Please try again later.');
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center min-vh-100">
      <Card className="form-container" style={{ width: '400px' }}>
        <Card.Body>
          <Card.Title as="h1" className="text-center mb-4">Register</Card.Title>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Username"
                name="username"
                value={username}
                onChange={onChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="email"
                placeholder="Email Address"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Control
                type="password"
                placeholder="Password"
                name="password"
                value={password}
                onChange={onChange}
                minLength="6"
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" className="w-100" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;