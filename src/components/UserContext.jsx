import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const loginUser = (username, userDocId) => {
    const userData = { username, userDocId };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
