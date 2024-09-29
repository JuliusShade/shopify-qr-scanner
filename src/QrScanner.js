import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./QrScanner.css"; // Import the CSS file

const QrScanner = () => {
  const [productData, setProductData] = useState(null);
  const [showInventory, setShowInventory] = useState(false); // State to control inventory dropdown

  useEffect(() => {
    let html5QrCodeScanner;
    if (!html5QrCodeScanner) {
      html5QrCodeScanner = new Html5QrcodeScanner("reader", {
        fps: 10, // Scans per second
        qrbox: { width: 250, height: 250 }, // Scanning box size
      });
    }

    const onScanSuccess = async (decodedText) => {
      console.log(`Scanned URL: ${decodedText}`);

      const productId = extractProductId(decodedText);
      if (!productId) {
        console.error("Failed to extract product ID from the scanned URL.");
        return;
      }

      const fetchProductUrl = `https://us-central1-shopify-qr-scanner.cloudfunctions.net/fetchProduct?id=${productId}`;

      try {
        const response = await fetch(fetchProductUrl, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch product data: ${response.status}`);
        }

        const data = await response.json();
        setProductData(data);
      } catch (error) {
        console.error("Error fetching product data:", error);
      }
    };

    const onScanError = () => {
      // Handle scan errors here
    };

    html5QrCodeScanner.render(onScanSuccess, onScanError);

    return () => {
      if (html5QrCodeScanner) {
        html5QrCodeScanner.clear();
      }
    };
  }, []);

  const extractProductId = (url) => {
    const match = url.match(/id=(\d+)/);
    return match ? match[1] : null;
  };

  // Helper function to group inventory levels by variant and location
  const getInventoryBySize = (product, inventoryLevels) => {
    return product.variants.map((variant) => {
      const variantInventory = inventoryLevels.filter(
        (level) => level.inventory_item_id === variant.inventory_item_id
      );

      return {
        size: variant.title,
        locations: variantInventory.map((inventory) => ({
          location_name: inventory.location_name, // Assuming location_name is part of the response from the backend
          available: inventory.available,
        })),
      };
    });
  };

  // Toggles the dropdown for the entire inventory section
  const toggleInventoryDropdown = () => {
    setShowInventory((prevShowInventory) => !prevShowInventory);
  };

  return (
    <div className="qr-scanner-container">
      <h1>QR Code Scanner</h1>
      <div id="reader"></div>

      {productData && (
        <div id="product-info">
          <h2>Product Information</h2>
          <p>
            <strong>Product Title:</strong> {productData.product.title}
          </p>
          <p>
            <strong>Price:</strong> ${productData.product.variants[0].price}
          </p>
          <img
            src={productData.product.image.src}
            alt={productData.product.title}
            style={{ width: "300px", height: "auto" }}
          />

          {/* Inventory Dropdown */}
          <h3>Inventory Levels</h3>
          <button
            onClick={toggleInventoryDropdown}
            style={{ marginBottom: "10px", cursor: "pointer" }}
          >
            {showInventory ? "Hide" : "Show"} Inventory Levels
          </button>

          {showInventory && (
            <div className="inventory-details" style={{ marginLeft: "20px" }}>
              {getInventoryBySize(
                productData.product,
                productData.inventory_levels
              ).map((variant) => (
                <div key={variant.size}>
                  <strong>Size: {variant.size}</strong>
                  <ul>
                    {variant.locations.map((location, index) => (
                      <li key={index}>
                        Location: {location.location_name}, Available:{" "}
                        {location.available}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QrScanner;
