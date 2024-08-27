import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import express from "express";

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_products"],
  hostName: process.env.HOST_NAME,
});

const app = express();

// Define an async function to get the product
const getProduct = async (productId) => {
  try {
    // Simulate getting a session object. Replace this with your actual session retrieval logic.
    const session = {}; // Replace with actual session logic

    const client = new shopify.clients.Rest({ session });

    const product = await client.get({
      path: `products/${productId}`,
      query: { id: 1, title: "title" },
    });

    console.log(product.body);
    return product.body;
  } catch (error) {
    console.error("Error fetching product:", error);
  }
};

// Define a route in your Express app to call the getProduct function
app.get("/product/:id", async (req, res) => {
  const productId = req.params.id;
  const productData = await getProduct(productId);

  res.send(productData);
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
