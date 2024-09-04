// backend/server.js

import express from "express";
import dotenv from "dotenv";
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_products"],
  hostName: process.env.HOST_NAME,
});

// Function to fetch product data from Shopify
const getProduct = async (productId) => {
  try {
    // Create a session object with the shop name and access token
    const session = {
      shop: process.env.SHOP_NAME, // Your Shopify store name
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN, // The access token obtained from OAuth flow
    };

    // Instantiate a new Rest client with the session object
    const client = new shopify.clients.Rest({
      session: session, // Pass the session object directly
    });

    // Make a GET request to fetch product data
    const product = await client.get({
      path: `products/${productId}.json`, // Ensure to include .json
      headers: {
        "X-Shopify-Access-Token": session.accessToken, // Explicitly set the access token header
      },
    });

    console.log("Product Data:", product.body); // Log the product data
    return product.body;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

// Route to handle GET request for a product
app.get("/api/product/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const productData = await getProduct(productId);
    res.json(productData);
  } catch (error) {
    res.status(500).send("Error fetching product");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
