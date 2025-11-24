import React from "react";
import AppRoutes from "./AppRoutes";
import { ToastNotification } from "./components/ToastNotification";

const App = () => {
  return (
    <ToastNotification>
      <AppRoutes />
    </ToastNotification>
  );
};

export default App;
