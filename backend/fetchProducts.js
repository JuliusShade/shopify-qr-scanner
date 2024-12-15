import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { parse } from "json2csv";
import { fileURLToPath } from "url";

// Load environment variables from the .env file
dotenv.config();

// Create __dirname equivalent for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to fetch all products
const fetchAllProducts = async () => {
  try {
    const shopName = process.env.SHOP_NAME; // Shopify store name from .env
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN; // Shopify access token from .env

    let allProducts = [];
    let nextPage = null;
    let url = `https://${shopName}/admin/api/2024-07/productss.json?limit=250`; // Shopify API endpoint

    while (url) {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-Shopify-Access-Token": accessToken, // Use access token for authentication
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.statusText}`);
      }

      const data = await response.json();
      allProducts = allProducts.concat(data.products);

      // Check if there's a next page (pagination)
      const linkHeader = response.headers.get("link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextPage = matches ? matches[1] : null;
        url = nextPage;
      } else {
        url = null; // No more pages
      }
    }

    return allProducts;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

// Save product IDs to a CSV file
const saveProductsToCSV = (products) => {
  const productIds = products.map((product) => ({
    id: product.id,
    title: product.title,
    price: product.variants[0].price,
  }));

  const fields = ["id", "title", "price"];
  const opts = { fields };

  try {
    const csv = parse(productIds, opts);
    const filePath = path.join(__dirname, "productIds.csv");
    fs.writeFileSync(filePath, csv);
    console.log("Product IDs saved to CSV:", filePath);
  } catch (err) {
    console.error("Error creating CSV:", err);
  }
};

// Fetch all products and save their IDs to a CSV file
fetchAllProducts().then((products) => {
  if (products && products.length > 0) {
    saveProductsToCSV(products);
  } else {
    console.log("No products found or an error occurred.");
  }
});
