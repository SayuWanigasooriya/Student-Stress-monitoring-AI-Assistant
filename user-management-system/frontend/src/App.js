import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserProfile from './pages/UserProfile';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setAuth={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/profile" 
          element={isAuthenticated ? <UserProfile setAuth={setIsAuthenticated} /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
