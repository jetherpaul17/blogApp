import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import { useAuth } from '../context/auth/AuthState';

const Post = () => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showEditPost, setShowEditPost] = useState(false);
  const [editPost, setEditPost] = useState({ title: '', content: '' });
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:4000/posts/getPost/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setPost(data);
          setEditPost({ title: data.title, content: data.content });
        } else {
          throw new Error(data.message || 'Failed to load post');
        }
      } catch (err) {
        console.error('Failed to load post:', err.message);
        setError('Failed to load post');
      }
    };

    const fetchComments = async () => {
      try {
        const response = await fetch(`http://localhost:4000/posts/getComments/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          const commentsArray = Array.isArray(data.comments) ? data.comments : (Array.isArray(data) ? data : []);
          setComments(commentsArray);
        } else {
          console.error('Failed to load comments:', data.message);
          setComments([]);
        }
      } catch (err) {
        console.error('Failed to load comments:', err.message);
        setComments([]);
      }
    };

    if (id) {
      fetchPost();
      fetchComments();
    }
  }, [id]);

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch(`http://localhost:4000/posts/deletePost/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          navigate('/');
        } else {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete post');
        }
      } catch (err) {
        console.error('Failed to delete post:', err.message);
        setError('Failed to delete post');
      }
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:4000/posts/updatePost/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editPost)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPost(data);
        setShowEditPost(false);
      } else {
        throw new Error(data.message || 'Failed to update post');
      }
    } catch (err) {
      console.error('Failed to update post:', err.message);
      setError('Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`http://localhost:4000/posts/addComment/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPost(data.updatedPost);
        setComments(data.updatedPost.comments || []);
        setNewComment('');
      } else {
        throw new Error(data.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Failed to add comment:', err.message);
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch(`http://localhost:4000/posts/deleteComment/${id}/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setComments(comments.filter(comment => comment._id !== commentId));
        } else {
          const data = await response.json();
          console.error('Failed to delete comment:', data.message);
        }
      } catch (err) {
        console.error('Failed to delete comment:', err.message);
      }
    }
  };

  if (!post) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <Card.Title as="h1">{post.title}</Card.Title>
              <Card.Subtitle className="text-muted mb-3">
                by {post.author?.username || 'Unknown'}
              </Card.Subtitle>
            </div>
          </div>
          <Card.Text style={{ whiteSpace: 'pre-wrap' }}>{post.content}</Card.Text>
        </Card.Body>
      </Card>
      
      <Card className="mb-4">
        <Card.Header>
          <h2>Comments</h2>
        </Card.Header>
        <Card.Body>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <Card key={comment._id} className="mb-3">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <Card.Text style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</Card.Text>
                      <Card.Subtitle className="text-muted">
                        by {comment.author?.username || 'Unknown'}
                      </Card.Subtitle>
                    </div>
                    {isAuthenticated && (user?.username === comment.author?.username || user?.role === 'admin') && (
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))
          ) : (
            <p className="text-muted">No comments yet. Be the first to comment!</p>
          )}
        </Card.Body>
      </Card>
      
      {isAuthenticated ? (
        <Card>
          <Card.Header>
            <h3>Leave a Comment</h3>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleAddComment}>
              <Form.Group className="mb-3">
                <Form.Control
                  as="textarea"
                  rows={5}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment here..."
                  disabled={loading}
                />
              </Form.Group>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Comment'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body className="text-center">
            <Card.Text className="text-muted">
              Please <a href="/login">login</a> to leave a comment.
            </Card.Text>
          </Card.Body>
        </Card>
      )}

      {/* Edit Post Modal */}
      <Modal show={showEditPost} onHide={() => setShowEditPost(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditPost}>
            <Form.Group className="mb-3">
              <Form.Label>Post Title</Form.Label>
              <Form.Control
                type="text"
                value={editPost.title}
                onChange={(e) => setEditPost({ ...editPost, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Post Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={editPost.content}
                onChange={(e) => setEditPost({ ...editPost, content: e.target.value })}
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditPost(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Post'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Post;