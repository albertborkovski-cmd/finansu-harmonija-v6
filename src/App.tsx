import { useState } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard?version=schedule-save-v2';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return <LoginPage onLogin={handleLogin} />;
}

export default App;
