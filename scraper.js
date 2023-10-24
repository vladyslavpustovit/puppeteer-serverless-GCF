const puppeteer = require('puppeteer');
const cors = require('cors')();

exports.scraper = async (req, res) => {
    // Wrap with CORS
    cors(req, res, async () => {
        let browser;

        try {
            const imdbId = req.query.title;
            const url = `https://www.imdb.com/title/${imdbId}/`;
            console.log(`Received request for IMDb ID: ${imdbId}`);

            browser = await puppeteer.launch({
                args:[
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-setuid-sandbox',
                        '--disable-infobars',
                        '--no-first-run',
                        '--blink-settings=imagesEnabled=false'
                     ],
                headless: "new",
                // Uncomment to run script on local
                // executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            });

            const context = await browser.createIncognitoBrowserContext();
            const page = await context.newPage();

            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (request.resourceType() === 'image' ||
                    request.resourceType() === 'stylesheet' ||
                    request.resourceType() === 'font' ||
                    request.resourceType() === 'video') {
                    request.abort();
                } else {
                    request.continue();
                }
            });

            // Set a modern user agent
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36');

            // Navigate to the IMDb page
            await page.goto(url);

            // Wait for the IMDb page to load fully
            await page.waitForSelector('script[type="application/ld+json"]');

            // Extract the "trailer" object
            const trailerData = await page.evaluate(() => {
                const scriptElement = document.querySelector('script[type="application/ld+json"]');
                const movieData = JSON.parse(scriptElement.textContent);
                return movieData['trailer'];
            });

            const trailerURL = trailerData.url;

            if (trailerURL) {
                // Navigate to the trailer URL
                await page.goto(trailerURL);
                console.log(`Navigated to ${trailerURL}`);

                // Wait for the page to load
                await page.waitForSelector('script#__NEXT_DATA__');

                // Extract the JSON data
                const videoObject = await page.evaluate(() => {
                    const videoObject = document.querySelector('script#__NEXT_DATA__');
                    return videoObject ? videoObject.textContent : null;
                });

                if (videoObject) {
                    // Parse the JSON data
                    const jsonData = JSON.parse(videoObject);
                    const playbackURLs = jsonData.props.pageProps.videoPlaybackData.video.playbackURLs;
                    res.status(200).json(playbackURLs);
                } else {
                    throw new Error('Video not found');
                }
            } else {
                throw new Error('No teaser info found');
            }

        } catch (error) {
            console.error(error);
            res.status(404).json({ error: error.message });
        } finally {
            // Close the browser and context if they were opened
            if (browser) {
                await browser.close();
                console.log('Browser closed successfully');
            }
        }
    });
};
