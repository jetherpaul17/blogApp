import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthState';

const AdminDashboard = () => {
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [postCommentCounts, setPostCommentCounts] = useState({});
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showEditPost, setShowEditPost] = useState(false);
  const [showViewPost, setShowViewPost] = useState(false);
  const [showViewComments, setShowViewComments] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedPostComments, setSelectedPostComments] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [editPostData, setEditPostData] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Check admin access
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  // Fetch posts and comment counts
  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:4000/posts/getPosts');
      const data = await response.json();

      if (response.ok) {
        const postsArray = data.posts || data || [];
        setPosts(Array.isArray(postsArray) ? postsArray : []);
        await fetchCommentCounts(postsArray);
      } else {
        console.error('Fetch posts failed:', data.message);
        setError('Failed to load posts');
      }
    } catch (err) {
      console.error('Fetch posts failed:', err.message);
      setError('Failed to load posts');
    }
  };

  const fetchCommentCounts = async (postsArray = posts) => {
    const commentCounts = {};
    for (const post of postsArray) {
      try {
        const commentsResponse = await fetch(`http://localhost:4000/posts/getComments/${post._id}`);
        const commentsData = await commentsResponse.json();
        // Extract comments from the response object, same fix as loadComments
        const commentsArray = Array.isArray(commentsData.comments) ? commentsData.comments : (Array.isArray(commentsData) ? commentsData : []);
        commentCounts[post._id] = commentsArray.length;
      } catch (err) {
        console.error(`Failed to fetch comments for post ${post._id}:`, err);
        commentCounts[post._id] = 0;
      }
    }
    setPostCommentCounts(commentCounts);
  };

  const refreshData = async () => {
    await fetchPosts();
  };

  useEffect(() => {
    if (!isAuthenticated || (user && !(user.role === 'admin' || user.isAdmin))) {
      return;
    }

    fetchPosts();

    const interval = setInterval(() => {
      fetchCommentCounts();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const deletePost = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:4000/posts/deletePost/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPosts(posts.filter((post) => post._id !== id));
        console.log('Post deleted successfully');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Delete post failed:', err.message);
      setError('Failed to delete post');
    }
  };

  const createPost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:4000/posts/addPost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPost)
      });

      const data = await response.json();

      if (response.ok) {
        setPosts([data, ...posts]);
        setNewPost({ title: '', content: '' });
        setShowCreatePost(false);
        console.log('Post created successfully:', data);
      } else {
        throw new Error(data.message || 'Failed to create post');
      }
    } catch (err) {
      console.error('Create post failed:', err.message);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const editPost = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:4000/posts/updatePost/${selectedPost._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editPostData)
      });

      const data = await response.json();

      if (response.ok) {
        const updatedPosts = posts.map((post) => {
          if (post._id === selectedPost._id) {
            return { ...post, title: editPostData.title, content: editPostData.content };
          }
          return post;
        });
        setPosts(updatedPosts);
        setEditPostData({ title: '', content: '' });
        setShowEditPost(false);
        console.log('Post edited successfully:', data);
      } else {
        throw new Error(data.message || 'Failed to edit post');
      }
    } catch (err) {
      console.error('Edit post failed:', err.message);
      setError('Failed to edit post');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPost = (post) => {
    setSelectedPost(post);
    setShowViewPost(true);
  };

  // Simplified comment loading like Post.js
  const loadComments = async (postId) => {
    try {
      const response = await fetch(`http://localhost:4000/posts/getComments/${postId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Extract comments from the response object
        const commentsArray = Array.isArray(data.comments) ? data.comments : (Array.isArray(data) ? data : []);
        setSelectedPostComments(commentsArray);
        // Update comment count immediately like Post.js does
        setPostCommentCounts(prev => ({
          ...prev,
          [postId]: commentsArray.length
        }));
      } else {
        console.error('Failed to load comments:', data.message);
        setSelectedPostComments([]);
        setPostCommentCounts(prev => ({
          ...prev,
          [postId]: 0
        }));
      }
    } catch (err) {
      console.error('Failed to load comments:', err.message);
      setSelectedPostComments([]);
      setPostCommentCounts(prev => ({
        ...prev,
        [postId]: 0
      }));
    }
  };

  const handleViewComments = async (post) => {
    setSelectedPost(post);
    await loadComments(post._id);
    setShowViewComments(true);
  };

  // Add comment deletion functionality like Post.js
  const handleDeleteComment = async (commentId, postId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required. Please log in again.');
          return;
        }

        const response = await fetch(`http://localhost:4000/posts/deleteComment/${postId}/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Update comments immediately like Post.js
          const updatedComments = selectedPostComments.filter(comment => comment._id !== commentId);
          setSelectedPostComments(updatedComments);
          // Update comment count immediately
          setPostCommentCounts(prev => ({
            ...prev,
            [postId]: updatedComments.length
          }));
        } else {
          const data = await response.json();
          console.error('Failed to delete comment:', data.message);
          setError('Failed to delete comment');
        }
      } catch (err) {
        console.error('Failed to delete comment:', err.message);
        setError('Failed to delete comment');
      }
    }
  };

  const handleEditPost = (post) => {
    setSelectedPost(post);
    setEditPostData({ title: post.title, content: post.content });
    setShowEditPost(true);
  };

  if (!isAuthenticated || (user && user.role !== 'admin')) {
    return null; // Will redirect
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Admin Dashboard</h1>
        <Button variant="success" onClick={() => setShowCreatePost(true)}>
          Create New Post
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Header>
              <h2>Posts Management</h2>
            </Card.Header>
            <Card.Body>
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Card key={post._id} className="mb-3">
                    <Card.Body className="d-flex justify-content-between align-items-center">
                      <div>
                        <Card.Title as="h5">{post.title}</Card.Title>
                        <Card.Subtitle className="text-muted">
                          by {post.author?.username || 'Unknown'}
                        </Card.Subtitle>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deletePost(post._id)}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="info"
                          size="sm"
                          onClick={() => handleViewPost(post)}
                        >
                          View Post
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleViewComments(post)}
                        >
                          View Comments ({postCommentCounts[post._id] || 0})
                        </Button>
                        <Button
                          variant="warning"
                          size="sm"
                          onClick={() => handleEditPost(post)}
                        >
                          Edit
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                ))
              ) : (
                <Alert variant="info">No posts available.</Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Post Modal */}
      <Modal show={showCreatePost} onHide={() => setShowCreatePost(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create New Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createPost}>
            <Form.Group className="mb-3">
              <Form.Label>Post Title</Form.Label>
              <Form.Control
                type="text"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                required
                placeholder="Enter post title..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Post Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                required
                placeholder="Write your post content here..."
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreatePost(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create Post'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Post Modal */}
      <Modal show={showEditPost} onHide={() => setShowEditPost(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Post</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={editPost}>
            <Form.Group className="mb-3">
              <Form.Label>Post Title</Form.Label>
              <Form.Control
                type="text"
                value={editPostData.title}
                onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
                required
                placeholder="Enter post title..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Post Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={8}
                value={editPostData.content}
                onChange={(e) => setEditPostData({ ...editPostData, content: e.target.value })}
                required
                placeholder="Write your post content here..."
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditPost(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Editing...' : 'Edit Post'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Post Modal */}
      <Modal show={showViewPost} onHide={() => setShowViewPost(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedPost?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{selectedPost?.content}</p>
          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* View Comments Modal */}
      <Modal show={showViewComments} onHide={() => setShowViewComments(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Comments for {selectedPost?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-between mb-3">
            <span>Total Comments: {postCommentCounts[selectedPost?._id] || 0}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => loadComments(selectedPost._id)}
            >
              Refresh Comments
            </Button>
          </div>
          {selectedPostComments.length > 0 ? (
            selectedPostComments.map((comment) => (
              <Card key={comment._id} className="mb-3">
                <Card.Body>
                  <Card.Title as="h5">{comment.author?.username || 'Unknown'}</Card.Title>
                  <Card.Text>{comment.content}</Card.Text>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteComment(comment._id, selectedPost._id)}
                  >
                    Delete Comment
                  </Button>
                </Card.Body>
              </Card>
            ))
          ) : (
            <Alert variant="info">No comments available.</Alert>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;
