const functions = require("firebase-functions");
const fetch = require("node-fetch");

const shopName = functions.config().shopify.shop_name;
const accessToken = functions.config().shopify.access_token;

// Fetch location details from Shopify API
// eslint-disable-next-line require-jsdoc
async function fetchLocations() {
  const response = await fetch(
      `https://${shopName}/admin/api/2024-07/locations.json`,
      {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
  );
  if (!response.ok) {
    throw new Error(`Error fetching locations: ${response.statusText}`);
  }
  const data = await response.json();
  return data.locations;
}

// Fetch product data and inventory levels with location names
exports.fetchProduct = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const productId = req.query.id;

    // Fetch product data from Shopify
    const productResponse = await fetch(
        `https://${shopName}/admin/api/2024-07/products/${productId}.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
    );

    if (!productResponse.ok) {
      throw new Error(`Error fetching product: ${productResponse.statusText}`);
    }
    const productData = await productResponse.json();

    // Fetch inventory levels for the product variants
    const inventoryItemIds = productData.product.variants.map(
        (variant) => variant.inventory_item_id,
    );

    const inventoryResponse = await fetch(
        `https://${shopName}/admin/api/2024-07/inventory_levels.json?inventory_item_ids=${inventoryItemIds.join(
            ",",
        )}`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        },
    );

    if (!inventoryResponse.ok) {
      throw new Error(
          `Error fetching inventory levels: ${inventoryResponse.statusText}`,
      );
    }

    const inventoryData = await inventoryResponse.json();

    // Fetch location data
    const locations = await fetchLocations();

    // Map location names to inventory levels
    const inventoryWithLocations = inventoryData.inventory_levels.map(
        (inventory) => {
          const location = locations.find(
              (loc) => loc.id === inventory.location_id,
          );
          return {
            ...inventory,
            location_name: location ? location.name : "Unknown Location",
          };
        },
    );

    res.status(200).json({
      product: productData.product,
      inventory_levels: inventoryWithLocations,
    });
  } catch (error) {
    console.error("Error fetching product or inventory levels:", error);
    res.status(500).send(
        `Error fetching product or inventory levels: ${error.message}`,
    );
  }
});
