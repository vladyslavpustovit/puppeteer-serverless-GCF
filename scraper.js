// const puppeteer = require('puppeteer');
//
// let browserPromise = puppeteer.launch({
//     args: [
//         '--no-sandbox'
//     ],
//     headless: "new"
// });
//
// exports.scraper = async (req, res) => {
//     const imdbId = req.query.title;
//     const url= `https://www.imdb.com/title/${imdbId}/`
//     console.log(`Received request for IMDb ID: ${imdbId}`);
//
//
//     const browser = await browserPromise;
//     const context = await browser.createIncognitoBrowserContext();
//     const page = await context.newPage();
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36');
//
//     await page.goto(url);
//
//     function handleNotFound(errorMessage) {
//         console.log(errorMessage);
//         context.close();
//         res.status(404).json({ error: errorMessage });
//     }
//
//     await page.waitForSelector('script[type="application/ld+json"]');
//
//     // Extract the "trailer" object
//     const trailerData = await page.evaluate(() => {
//         const scriptElement = document.querySelector('script[type="application/ld+json"]');
//         const movieData = JSON.parse(scriptElement.textContent);
//         return movieData['trailer'];
//     });
//     const trailerURL = trailerData.url;
//
//     if (trailerURL) {
//         await page.goto(trailerURL);
//         console.log(`Navigated to ${trailerURL}`);
//     } else {
//         return handleNotFound('No teaser info found');
//     }
//
//     // Extract the video info object
//     const videoObject = await page.evaluate(() => {
//         // This function runs within the context of the web page
//         const videoObject = document.querySelector('script#__NEXT_DATA__');
//         return videoObject ? videoObject.textContent : null;
//     });
//
//     // Parse the JSON data
//     if (videoObject) {
//         const jsonData = JSON.parse(videoObject);
//         const teaserURL = jsonData.props.pageProps.videoPlaybackData.video.playbackURLs[1].url
//         res.status(200).json({ teaserURL });
//         await context.close();
//         console.log('Browser closed successfully');
//     } else {
//         return handleNotFound('Video not found');
//     }
// }

const puppeteer = require('puppeteer');

exports.scraper = async (req, res) => {
    let browser;

    try {
        const imdbId = req.query.title;
        const url = `https://www.imdb.com/title/${imdbId}/`;
        console.log(`Received request for IMDb ID: ${imdbId}`);

        browser = await puppeteer.launch({
            args: ['--no-sandbox'],
            headless: "new",
        });

        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();

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
                const teaserURL = jsonData.props.pageProps.videoPlaybackData.video.playbackURLs[1].url;
                res.status(200).json({ teaserURL });
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
};
