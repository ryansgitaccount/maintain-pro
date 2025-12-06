import React, { useState, useCallback } from 'react';

const ToastContext = React.createContext();

export const useToast = () => React.useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback(({ title, description, variant = 'default' }) => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, title, description, variant }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);
    
    const value = { toast, toasts };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};