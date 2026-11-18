import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import ConsumerApp from "./ConsumerApp";
import "../theme.css";
import "../components/passport.css";
import "./consumer.css";
import "../components/product-extras.css";

document.documentElement.lang = "uz";
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><ConsumerApp /></React.StrictMode>
);
