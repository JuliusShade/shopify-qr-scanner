// src/App.js

import React from "react";
import "./App.css";
import QrScanner from "./QrScanner"; // Import the QR scanner component

function App() {
  return (
    <div className="App">
      <h1>Welcome to the QR Code Scanner App</h1>
      {/* Include the QrScanner component */}
      <QrScanner />
    </div>
  );
}

export default App;
