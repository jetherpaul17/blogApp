const express = require('express');
const router = express.Router();
const postCtrl = require('../controller/post');
const { verify, verifyAdmin } = require('../auth.js'); // JWT-based auth with admin verification

// 🔧 CRUD operations for blog posts
router.post('/addPost', verify, postCtrl.addPost);
router.get('/getPosts', postCtrl.getAllPosts);
router.get('/getPost/:id', postCtrl.getPostById);
router.patch('/updatePost/:id', verify, postCtrl.updatePost);
router.delete('/deletePost/:id', verify, postCtrl.deletePost);

// 💬 Comment operations
router.patch('/addComment/:id', verify, postCtrl.addComment);
router.get('/getComments/:id', postCtrl.getComments);
router.delete('/deleteComment/:postId/:commentId', verify, postCtrl.deleteComment);

module.exports = router;