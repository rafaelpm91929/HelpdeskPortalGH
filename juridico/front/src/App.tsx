import React, { useState } from 'react';
import { ExecutiveLogin } from './components/ExecutiveLogin';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';

export const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  return (
    <main>
      {isLoggedIn ? (
        <ExecutiveDashboard onLogout={() => setIsLoggedIn(false)} />
      ) : (
        <ExecutiveLogin onLoginSuccess={() => setIsLoggedIn(true)} />
      )}
    </main>
  );
};

export default App;
