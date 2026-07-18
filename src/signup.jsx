import { useState } from 'react';
import { supabase } from '../../services/database'; // Ensure this points to your initialized client

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });
    if (error) alert(error.message);
    else alert('Check your email for confirmation (if enabled) or proceed to Login!');
  };

  return (
    <form onSubmit={handleSignUp}>
      <input type="email" onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
