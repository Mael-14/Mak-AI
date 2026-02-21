import React, { createContext, useState, useContext } from 'react';
import CustomAlert from '../components/CustomAlert';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  const showModal = (title, message) => {
    setModal({ visible: true, title, message });
  };

  const hideModal = () => {
    setModal({ visible: false, title: '', message: '' });
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      <CustomAlert
        visible={modal.visible}
        onClose={hideModal}
        title={modal.title}
        message={modal.message}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => useContext(ModalContext);