import React from 'react';
import { useUser } from './UserContext';

function User() {
  const { user } = useUser();

  if (!user) {
    return <p>No user is logged in.</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <p>Your Document ID: {user.userDocId}</p>
    </div>
  );
}

export default User;
