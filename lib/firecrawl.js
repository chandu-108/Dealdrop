import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

export async function scrapeProduct(url) {
  try {
    // The SDK historically exposed different method names across versions. Prefer `scrape` if available,
    // otherwise fall back to `scrapeUrl` for compatibility.
    const scrapeFn =
      typeof firecrawl.scrape === "function"
        ? firecrawl.scrape.bind(firecrawl)
        : typeof firecrawl.scrapeUrl === "function"
        ? firecrawl.scrapeUrl.bind(firecrawl)
        : null;

    if (!scrapeFn) {
      throw new Error("Firecrawl client does not expose a scrape method");
    }

    // Use the v2-compatible JSON output format for structured extraction.
    const body = {
      formats: [
        {
          type: "json",
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
      ],
    };

    // Some Firecrawl backends are strict about the request body shape. Pass body as the second argument and options as third.
    const result = await scrapeFn(url, body, { timeoutSecs: 30 });

    // The SDK may return data under different keys depending on the format used.
    const extractedData =
      result.extract ??
      (result.json ? (Array.isArray(result.json) ? result.json[0] : result.json) : null) ??
      (result.data && result.data.extract ? result.data.extract : null);

    if (!extractedData || !extractedData.productName) {
      console.error("Firecrawl returned no extracted data", { url, body, result });
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
    // Log full error details (including non-enumerable props) and the request body to help debugging
    console.error("Firecrawl scrape error:", { error, url, body });
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