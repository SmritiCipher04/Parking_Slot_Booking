/**
 * UserAvatar Component
 * Renders user's custom uploaded or Google profile photo.
 * If no photo is set or image fails to load, gracefully displays
 * a clean circular badge with the user's uppercase initials on royal blue background.
 */

import React, { useState, useEffect } from 'react';

const getInitials = (name = '') => {
  if (!name) return 'U';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const UserAvatar = ({ user, size = 36, style = {} }) => {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(user ? user.name : 'User');
  const picture = user ? user.profilePicture : null;

  useEffect(() => {
    setImageError(false);
  }, [picture]);

  if (picture && !imageError) {
    return (
      <img
        src={picture}
        alt={user ? user.name : 'Avatar'}
        onError={() => setImageError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          display: 'inline-block',
          verticalAlign: 'middle',
          flexShrink: 0,
          ...style
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: `${Math.max(11, Math.round(size * 0.4))}px`,
        letterSpacing: '0.03em',
        border: '2px solid #ffffff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        verticalAlign: 'middle',
        flexShrink: 0,
        userSelect: 'none',
        ...style
      }}
      title={user ? user.name : 'User Avatar'}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
