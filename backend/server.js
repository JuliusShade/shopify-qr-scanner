// backend/server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors"; // Import the cors package
import "@shopify/shopify-api/adapters/node";
import { shopifyApi } from "@shopify/shopify-api";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ["read_products"],
  hostName: process.env.HOST_NAME,
});

// Function to fetch product data from Shopify
const getProduct = async (productId) => {
  try {
    const session = {
      shop: process.env.SHOP_NAME,
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    };

    const client = new shopify.clients.Rest({ session });
    const product = await client.get({
      path: `products/${productId}.json`,
      headers: {
        "X-Shopify-Access-Token": session.accessToken,
      },
    });

    console.log("Product Data:", product.body);
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
