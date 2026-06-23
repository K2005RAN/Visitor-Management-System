import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter as Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
// Import both store and persistor from your store.js
import store, { persistor } from "./redux/store.js"; 
import { PersistGate } from "redux-persist/integration/react";
import ThemeProvider from "./components/ThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      {/* The PersistGate stays here. It 'pauses' the app 
          rendering until your Mycem Cement login data is 
          retrieved from the browser's storage. 
      */}
      <PersistGate loading={null} persistor={persistor}>
        <Routes>
          <ThemeProvider>
            <App />
            <Toaster position="top-center" reverseOrder={false} />
          </ThemeProvider>
        </Routes>
      </PersistGate>
    </Provider>
  </StrictMode>
);