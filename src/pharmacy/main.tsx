import React from "react";
import ReactDOM from "react-dom/client";
import PharmacyApp from "./PharmacyApp";
import "../theme.css";
import "./pharmacy.css";

document.documentElement.lang = "uz";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><PharmacyApp /></React.StrictMode>
);
