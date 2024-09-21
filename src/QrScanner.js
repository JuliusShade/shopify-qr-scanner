import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./QrScanner.css"; // Import the CSS file

const QrScanner = () => {
  useEffect(() => {
    // Initialize only once
    let html5QrCodeScanner;
    if (!html5QrCodeScanner) {
      html5QrCodeScanner = new Html5QrcodeScanner("reader", {
        fps: 10, // Scans per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
      });
    }

    // Set up the QR code scanning success and error handlers
    const onScanSuccess = async (decodedText) => {
      console.log(`Scanned URL: ${decodedText}`);

      // Extract the product ID directly from the scanned URL
      const productId = extractProductId(decodedText);

      if (!productId) {
        console.error("Failed to extract product ID from the scanned URL.");
        return;
      }

      // Construct the Firebase function URL using the extracted product ID
      const fetchProductUrl = `https://us-central1-shopify-qr-scanner.cloudfunctions.net/fetchProduct?id=${productId}`;

      try {
        // Fetch data directly from the Firebase function URL
        const response = await fetch(fetchProductUrl, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Log the full response details for debugging
        console.log("Fetch Response:", response);

        // Check if the response status is OK
        if (!response.ok) {
          // Log the error response status and status text for clarity
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch product data: ${response.status} - ${response.statusText}. Details: ${errorText}`
          );
        }

        // Parse the JSON response body
        const data = await response.json();
        if (!data || !data.product) {
          throw new Error("No product data received");
        }

        console.log("Product Data:", data);

        // Display the product information
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

        // Add animation class to make the product info flow into view
        productInfo.classList.add("show");
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    const onScanError = () => {
      // No error will be logged if no QR code is detected
    };

    // Start scanning using Html5QrcodeScanner
    html5QrCodeScanner.render(onScanSuccess, onScanError);

    // Clean up the scanner when the component is unmounted to avoid duplication
    return () => {
      if (html5QrCodeScanner) {
        html5QrCodeScanner.clear();
      }
    };
  }, []);

  // Function to extract product ID from the scanned URL
  const extractProductId = (url) => {
    // Modify this regex based on the actual structure of your QR code URLs
    const match = url.match(/id=(\d+)/); // Extract ID directly from query parameter
    return match ? match[1] : null;
  };

  return (
    <div className="qr-scanner-container">
      <h1>QR Code Scanner</h1>
      <div id="reader"></div>
      <div id="product-info"></div>
    </div>
  );
};

export default QrScanner;
