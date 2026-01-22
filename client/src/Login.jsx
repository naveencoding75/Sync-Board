import React, { useState } from 'react';
import axios from 'axios';

function Login({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? 'register' : 'login';
    
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, {
        email,
        password
      });

      if (!isRegistering) {
        // If login successful, save token
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
      } else {
        alert("Account created! Now please login.");
        setIsRegistering(false);
      }
    } catch (err) {
      alert(err.response?.data?.error || "An error occurred");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <h1>{isRegistering ? "Sign Up" : "Login"} to SyncBoard</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: '300px', margin: '0 auto', gap: '10px' }}>
        <input 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>
          {isRegistering ? "Sign Up" : "Login"}
        </button>
      </form>
      
      <p onClick={() => setIsRegistering(!isRegistering)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
        {isRegistering ? "Already have an account? Login" : "Need an account? Sign Up"}
      </p>
    </div>
  );
}

export default Login;