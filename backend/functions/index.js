const functions = require("firebase-functions");
const fetch = require("node-fetch");

// Function to fetch product data from Shopify with CORS handling
exports.fetchProduct = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const shopName = functions.config().shopify.shop_name;
    const accessToken = functions.config().shopify.access_token;
    const productId = req.query.id;

    const response = await fetch(
        `https://${shopName}/admin/api/2024-07/products/${productId}.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
    );

    if (!response.ok) {
      throw new Error(`Error fetching product: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data); // Ensure the response is sent as JSON
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send(`Error fetching product: ${error.message}`);
  }
});

// Updated proxy function with CORS headers
exports.proxyScannedUrl = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight request
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const scannedUrl = req.query.url;

    if (!scannedUrl) {
      return res.status(400).send("URL parameter is required.");
    }

    // Fetch data from the scanned URL
    const response = await fetch(scannedUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
          `Error fetching data from scanned URL: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).send(data);
  } catch (error) {
    console.error("Error following the scanned URL:", error);
    res.status(500).send(`Error following the scanned URL: ${error.message}`);
  }
});
