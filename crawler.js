const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

const args = process.argv;
const results = [];
const maxRedirects = 2;

if (args.length !== 4) {
  console.error(
    "Please supply website as first arg and depth as 2nd argument when calling crawler"
  );
  process.exit(1);
}

const startUrl = args[2];
const depth = parseInt(args[3]);

if (isNaN(depth) || depth < 0 || depth > 3) {
  console.error("Depth must bepositive integer & can not be greater than 3.");
  process.exit(1);
}

const crawl = async(url, currentDepth, currentRedirects) => {
  if (currentDepth > depth || currentRedirects > maxRedirects) return;

  console.log(
    `Crawling: ${url}, Depth: ${currentDepth}, Redirects: ${currentRedirects}`
  );

  try {
    const response = await axios.get(url, { maxRedirects: 5 });
    const finalUrl = response.request.res.responseUrl;
    const $ = cheerio.load(response.data);

    const images = $("img")
      .map((i, element) => $(element).attr("src"))
      .get();
    const links = $("a")
      .map((i, element) => $(element).attr("href"))
      .get();

    images.forEach((imageUrl) =>
      results.push({ imageUrl, sourceUrl: finalUrl, depth: currentDepth })
    );

    console.log(`Found ${images.length} images at ${url}`);

    for (const link of links) {
      if (link.startsWith("http")) {
        await crawl(link, currentDepth + 1, currentRedirects + 1);
      }
    }
  } catch (error) {
    console.error(`Error crawling ${url}: ${error.message}`);
  }
}

crawl(startUrl, 0, 0)
  .then(() => {
    const data = { results };
    fs.writeFileSync("results.json", JSON.stringify(data, null, 2));
    console.log("Crawling completed.");
  })
  .catch((err) => console.error(`Crawling failed: ${err.message}`));
