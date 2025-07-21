import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthState';

const CreatePost = () => {
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const { title, content } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  useEffect(() => {
    if (!isAuthenticated && !localStorage.getItem('token')) {
      navigate('/login');
    } else if (
      isAuthenticated &&
      user &&
      user.role !== 'admin' &&
      !user.isAdmin
    ) {
      setError('Only administrators can create posts.');
      setTimeout(() => navigate('/'), 2000);
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:4000/posts/addPost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data._id) {
        navigate(`/post/${data._id}`);
      } else {
        throw new Error(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Create post failed:', err);
      if (
        err.message.includes('401') ||
        err.message.includes('Unauthorized')
      ) {
        setError('Authentication expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(err.message || 'Failed to create post. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated && localStorage.getItem('token')) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-purple" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking permissions...</p>
        </div>
      </Container>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && user.role !== 'admin' && !user.isAdmin) {
    return (
      <Container className="py-4">
        <Alert variant="warning" className="text-center glass-card">
          <h4>Access Restricted</h4>
          <p>Only administrators can create posts.</p>
          <p>Redirecting to home page...</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <Card className="glass-card">
            <Card.Body>
              <Card.Title as="h1" className="text-center mb-4 reusable-gradient">
                Create New Post
              </Card.Title>

              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={onSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Post Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={title}
                    onChange={onChange}
                    required
                    placeholder="Enter an engaging title for your post..."
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Post Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    name="content"
                    value={content}
                    onChange={onChange}
                    required
                    placeholder="Write your post content here..."
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Tip: Use line breaks to format your content.
                  </Form.Text>
                </Form.Group>

                <div className="d-flex justify-content-between">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="btn-purple"
                    disabled={loading || !title.trim() || !content.trim()}
                  >
                    {loading ? 'Publishing...' : 'Publish Post'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  );
};

export default CreatePost;