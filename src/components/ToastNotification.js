import React, { createContext, useContext, useState, useCallback } from "react";
import { Toast, ToastContainer, Badge } from "react-bootstrap";

const ToastContext = createContext();

export const useToast = () => {
  const { showToast } = useContext(ToastContext);
  return { showToast };
};

export const ToastNotification = ({ children }) => {
  const [toastList, setToastList] = useState([]);

  const hideToast = useCallback((id) => {
    setToastList((prevList) => prevList.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, variant = "success", delay = 3000) => {
      const id = Date.now();
      const newToast = {
        id,
        message,
        variant,
        delay,
      };

      setToastList((prevList) => [...prevList, newToast]);
      setTimeout(() => {
        hideToast(id);
      }, delay);
    },
    [hideToast]
  );

  const getIcon = (variant) => {
    switch (variant) {
      case "success":
        return "✅";
      case "danger":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  const contextValue = { showToast };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 1080 }}
      >
        {toastList.map((toastItem) => (
          <Toast
            key={toastItem.id}
            show={true}
            onClose={() => hideToast(toastItem.id)}
            bg={toastItem.variant === "danger" ? "danger" : toastItem.variant}
          >
            <Toast.Header closeButton>
              <Badge pill bg={toastItem.variant} className="me-2">
                {getIcon(toastItem.variant)}
              </Badge>
              <strong className="me-auto text-dark">Thông báo</strong>
            </Toast.Header>
            <Toast.Body
              className={
                toastItem.variant === "danger" ? "text-white" : "text-dark"
              }
            >
              {toastItem.message}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
