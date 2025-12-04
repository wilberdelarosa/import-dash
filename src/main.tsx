import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeNativeApp } from "./lib/capacitor";

// Inicializar plugins nativos de Capacitor
initializeNativeApp();

createRoot(document.getElementById("root")!).render(<App />);
