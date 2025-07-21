const Post = require('../models/Post');
const Comment = require('../models/Comment');

module.exports.addPost = async (req, res) => {
  try {
    const post = new Post({
      title: req.body.title,
      content: req.body.content,
      author: req.user.id
    });

    const saved = await post.save();

    res.status(201).json({
      _id: saved._id,
      title: saved.title,
      content: saved.content,
      author: saved.author,
      createdAt: saved.createdAt,
      __v: saved.__v
    });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(400).json({ error: 'Failed to add post', details: err.message });
  }
};

module.exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'username email').sort({ createdAt: -1 });
    res.status(200).json({ posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(400).json({ error: 'Failed to fetch posts', details: err.message });
  }
};

module.exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username')
      .populate('comments', 'userId comment');

    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.status(200).json(post);
  } catch (err) {
    res.status(400).json({ error: 'Failed to fetch post' });
  }
};

module.exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Allow update if user is the author OR if user is admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to update this post' });
    }

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      message: 'Post updated successfully',
      updatedPost: updated
    });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update post' });
  }
};

module.exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    // Allow deletion if user is the author OR if user is admin
    if (post.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete post' });
  }
};

module.exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const newComment = new Comment({
      content: content,
      author: req.user.id,
      post: id
    });

    const savedComment = await newComment.save();

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $push: { comments: savedComment._id } },
      { new: true }
    )
    .populate('author', 'username email')
    .populate('comments');

    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.status(200).json({
      message: 'Comment added successfully',
      updatedPost
    });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(400).json({ error: 'Failed to add comment', details: err.message });
  }
};

module.exports.getComments = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'username email'
        }
      });

    if (!post) return res.status(404).json({ error: 'Post not found' });

    res.status(200).json({ comments: post.comments });
  } catch (err) {
    console.error('Error retrieving comments:', err);
    res.status(400).json({ error: 'Failed to retrieve comments', details: err.message });
  }
};

module.exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    
    // Find the comment first to check ownership
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Allow deletion if user is the comment author OR if user is admin
    if (comment.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }
    
    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId }
    });
    
    // Delete the comment
    await Comment.findByIdAndDelete(commentId);
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(400).json({ error: 'Failed to delete comment', details: err.message });
  }
};