import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./QrScanner.css"; // Import the CSS file
import TopLeftImage from "./pictures/clb_23_seal_dope_black_rgb_hr.png"; // Adjust the path to your directory
import BottomCenterImage from "./pictures/clb_23_horiz_tag_dope_black_rgb_hr.png"; // Adjust the path to your directory

const QrScanner = () => {
  const [productData, setProductData] = useState(null);
  const [showInventory, setShowInventory] = useState(false); // State to control inventory dropdown
  const [currentLocation, setCurrentLocation] = useState(""); // State for current location
  const [availableLocations, setAvailableLocations] = useState([]); // State for unique locations
  const [showPopup, setShowPopup] = useState(false); // State for popup visibility
  const [priceRange, setPriceRange] = useState(null); // State for dynamic price range

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

        // Extract unique locations and exclude "Overstock"
        const uniqueLocations = [
          ...new Set(
            data.inventory_levels
              .map((level) => level.location_name)
              .filter((name) => name !== "Overstock") // Exclude "Overstock"
          ),
        ];
        setAvailableLocations(uniqueLocations);

        // Calculate the price range
        const prices = data.product.variants.map((variant) =>
          parseFloat(variant.price)
        );
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setPriceRange(
          minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} - $${maxPrice}`
        );
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

  // Helper function to group inventory levels by variant and filter by location
  const getInventoryBySize = (product, inventoryLevels) => {
    // Filter inventory levels for the current location and exclude "Overstock"
    const filteredInventoryLevels = inventoryLevels.filter(
      (level) =>
        level.location_name !== "Overstock" &&
        level.location_name === currentLocation
    );

    return product.variants.map((variant) => {
      const variantInventory = filteredInventoryLevels.filter(
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

  // Toggles the dropdown for the inventory section
  const handleInventoryClick = () => {
    if (!currentLocation) {
      setShowPopup(true); // Show popup if no location is selected
      return;
    }
    setShowInventory((prevShowInventory) => !prevShowInventory);
  };

  return (
    <div className="qr-scanner-container">
      {/* Header with logo and title */}
      <div className="qr-scanner-header">
        <img src={TopLeftImage} alt="Store Logo" className="header-logo" />
        <h1>QR Code Scanner</h1>
      </div>
      <div id="reader"></div>

      {/* Location Selector */}
      {availableLocations.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="location-select"></label>
          <select
            id="location-select"
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            <option value="">-- Select Location --</option>
            {availableLocations.map((location, index) => (
              <option key={index} value={location}>
                {location}
              </option>
            ))}
          </select>
        </div>
      )}

      {productData && (
        <div id="product-info">
          <h2>Product Information</h2>
          <p>
            <strong>Product Title:</strong> {productData.product.title}
          </p>
          <p>
            <strong>Price Range:</strong> {priceRange || "Loading..."}
          </p>
          <img
            src={productData.product.image.src}
            alt={productData.product.title}
            style={{ width: "300px", height: "auto" }}
          />

          {/* Inventory Dropdown */}
          <h3>Inventory Levels</h3>
          <button
            onClick={handleInventoryClick}
            style={{ marginBottom: "10px", cursor: "pointer" }}
          >
            {showInventory ? "Hide" : "Show"} Inventory Levels
          </button>

          {showInventory && currentLocation && (
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

      {/* Popup Modal */}
      {showPopup && (
        <div className="popup">
          <div className="popup-content">
            <p>
              Please select a location above before viewing inventory levels.
            </p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}
      {/* Bottom-center branding image */}
      <img
        src={BottomCenterImage}
        alt="Store Branding"
        className="bottom-center-logo"
      />
    </div>
  );
};

export default QrScanner;
