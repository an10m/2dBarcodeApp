import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./theme.css";
import "./components/passport.css";
import "./styles.css";
import "./components/product-extras.css";

document.documentElement.lang = "uz";
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
