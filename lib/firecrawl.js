import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function scrapeProduct(url) {
  try {
    // Use the v4+ API format for structured extraction
    const options = {
      formats: ["extract"],
      extract: {
        prompt:
          "Extract the product name as 'productName', current price as a number as 'currentPrice', currency code (USD, EUR, etc) as 'currencyCode', and product image URL as 'productImageUrl' if available",
        schema: {
          type: "object",
          properties: {
            productName: { type: "string" },
            currentPrice: { type: "number" },
            currencyCode: { type: "string" },
            productImageUrl: { type: "string" },
          },
          required: ["productName", "currentPrice"],
        },
      },
      timeout: 30000,
    };

    // Use the current SDK API
    const result = await firecrawl.scrapeUrl(url, options);

    // The SDK returns data under the extract key for v4+
    const extractedData = result.extract;

    if (!extractedData || !extractedData.productName) {
      console.error("Firecrawl returned no extracted data", { url, options, result });
      throw new Error("No data extracted from URL");
    }

    // Normalize fields -- different prompts or SDK versions may return slightly different keys
    const normalized = {
      productName: extractedData.productName ?? extractedData.name ?? extractedData.title ?? null,
      currentPrice:
        extractedData.currentPrice ?? extractedData.productPrice ?? extractedData.price ?? null,
      currencyCode:
        extractedData.currencyCode ?? extractedData.currency ?? extractedData.productCurrency ?? "USD",
      productImageUrl: extractedData.productImageUrl ?? extractedData.image ?? null,
    };

    return normalized;
  } catch (error) {
    // Log full error details (including non-enumerable props) and the request options to help debugging
    console.error("Firecrawl scrape error:", { error, url, options });
    try {
      console.error(
        "Firecrawl error (full):",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
      );
    } catch (e) {
      console.error("Failed to stringify Firecrawl error", e);
    }

    if (error?.details) {
      try {
        console.error("Firecrawl error details:", JSON.stringify(error.details, null, 2));
      } catch (e) {
        console.error("Failed to stringify Firecrawl error.details", e);
      }
    }

    // If the error includes a response body, log it too
    if (error?.response) {
      try {
        console.error("Firecrawl response:", JSON.stringify(error.response, Object.getOwnPropertyNames(error.response), 2));
      } catch (e) {
        console.error("Failed to stringify Firecrawl error.response", e);
      }
    }

    // Surface a clear message for the calling function
    throw new Error(`Failed to scrape product: ${error?.message || String(error)}`);
  }
}