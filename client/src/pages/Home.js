import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { useAuth } from '../context/auth/AuthState';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('https://blogapp-fkb5.onrender.com/posts/getPosts');
        const data = await response.json();
        
        if (response.ok) {
          // Handle both data.posts and direct data array formats
          const postsArray = data.posts || data || [];
          setPosts(Array.isArray(postsArray) ? postsArray : []);
        } else {
          console.error('Failed to fetch posts:', data.message);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err.message);
      }
    };
    fetchPosts();
  }, []);

  return (
    <Container className="py-4">
      {/* Welcome Hero Section */}
      <div className="hero-section text-center py-5 mb-5">
        <div className="glass-card p-5">
          <h1 className="display-4 mb-4 text-gradient">Welcome to Our Blog</h1>
          <p className="lead mb-4">Discover amazing stories and insights from our community</p>
          {isAuthenticated && (user?.role === 'admin' || user?.isAdmin) && (
            <Button 
              as={Link} 
              to="/admin" 
              variant="primary" 
              size="lg"
              className="me-3 text-white"
            >
              Admin Dashboard
            </Button>
          )}
          <Button 
            variant="outline-primary" 
            size="lg"
            onClick={() => {
              const latestPostsSection = document.getElementById('latest-posts');
              latestPostsSection.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Browse Posts
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <Row className="mb-5">
        <Col md={4}>
          <Card className="stats-card text-center h-100">
            <Card.Body>
              <h3 className="text-primary">{posts.length}</h3>
              <p className="text-muted">Published Posts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stats-card text-center h-100">
            <Card.Body>
              <h3 className="text-success">∞</h3>
              <p className="text-muted">Ideas Shared</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stats-card text-center h-100">
            <Card.Body>
              <h3 className="text-info">24/7</h3>
              <p className="text-muted">Community Active</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Latest Posts Section */}
      <div id="latest-posts" className="d-flex justify-content-between align-items-center mb-4">
        <h2>Latest Posts</h2>
      </div>
      
      <Row>
        {posts.length > 0 ? (
          posts.map((post) => (
            <Col md={6} lg={4} key={post._id} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>
                    <Link to={`/post/${post._id}`} className="text-decoration-none">
                      {post.title}
                    </Link>
                  </Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    by {post.author.username}
                  </Card.Subtitle>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <Card>
              <Card.Body>
                <Card.Text className="text-muted text-center">
                  No posts available yet.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default Home;