import React from 'react';

const Modal = ({ isOpen, onClose, children, maxWidth = 480 }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-content" style={{ maxWidth: `${maxWidth}px` }}>
        <button type="button" className="modal-close" onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
