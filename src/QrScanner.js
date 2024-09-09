// src/QrScanner.js

import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode"; // Ensure this is installed: npm install html5-qrcode

const QrScanner = () => {
  useEffect(() => {
    const html5QrCodeScanner = new Html5QrcodeScanner("reader", {
      fps: 10, // Scans per second
      qrbox: { width: 250, height: 250 }, // Scanning box size
    });

    // Set up the QR code scanning success and error handlers
    const onScanSuccess = (decodedText) => {
      console.log(`Scanned URL: ${decodedText}`);

      // Map the Ngrok URL to the local backend for testing
      const ngrokUrl = "insert backend url"; // Your Ngrok URL
      const localUrl = "insert local host"; // Your local backend URL

      // Replace the Ngrok URL with localhost for local testing
      let apiUrl = decodedText.replace(ngrokUrl, localUrl);

      // Fetch data from the modified local URL
      fetch(apiUrl, {
        headers: {
          "ngrok-skip-browser-warning": "true", // Add this header to bypass Ngrok warning if needed
        },
      })
        .then((response) => {
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            throw new Error("Response is not JSON");
          }
          return response.json();
        })
        .then((data) => {
          const product = data.product;
          const productInfo = document.getElementById("product-info");

          // Extract the required details from the response
          const title = product.title;
          const price = product.variants[0].price;
          const imageUrl = product.image.src;

          // Update the UI with the product information
          productInfo.innerHTML = `
            <h2>Product Information</h2>
            <p><strong>Product Title:</strong> ${title}</p>
            <p><strong>Price:</strong> $${price}</p>
            <img src="${imageUrl}" alt="${title}" style="width: 300px; height: auto;" />
          `;
        })
        .catch((error) => console.error("Error fetching product data:", error));
    };

    const onScanError = () => {
      // No error will be logged if no QR code is detected
    };

    // Start scanning using Html5QrcodeScanner
    html5QrCodeScanner.render(onScanSuccess, onScanError);

    // Clean up the scanner when the component is unmounted
    return () => {
      html5QrCodeScanner.clear();
    };
  }, []);

  return (
    <div>
      <h1>QR Code Scanner</h1>
      <div id="reader" style={{ width: "500px", margin: "0 auto" }}></div>
      <div id="product-info" style={{ marginTop: "20px" }}></div>
    </div>
  );
};

export default QrScanner;
