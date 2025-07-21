import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Post from './pages/Post';
import CreatePost from './pages/CreatePost';
import AdminDashboard from './pages/AdminDashboard';
import AppNavbar from './components/Navbar';
import AuthState from './context/auth/AuthState';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <AuthState>
      <Router>
        <div className="App">
          <AppNavbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/post/:id" element={<Post />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </div>
      </Router>
    </AuthState>
  );
}

export default App;
