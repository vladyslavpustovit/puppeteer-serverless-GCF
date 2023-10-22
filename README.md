# Serverless Scraping Function built with Puppeteer (GCF deployment)

## Development purpose
### Mostly to get familiar with Puppeteer and Serverless Cloud Functions ;)
`For our movies-website my team has a Database which contains movies list and their information(poster_url, cast, title, dscr etc.).`
`There is an IMDBmovieId property for each movie in the DB, but no movie-teaser source url. https://www.imdb.com/title/${imdbID} navigates to movie page on IMDB and then Puppeteer is coming into action`
### Function response is a movie teaser url.

## Dependencies
`npm i --save @google-cloud/functions-framework puppeteer`

## Deploy to Cloud Functions
`gcloud functions deploy scraper --trigger-http --runtime=nodejs16 --gen2 --memory=1024mb`

## Disable authentication for the cloud function if needed
`gloud functions add-iam-policy-binding scraper --region=europe-west1 --member=allUsers --role=roles/cloudfunctions.invoker`

## Run function on localhost
`functions-framework --targer=scraper`

## .puppeteerrc.cjs file
### Required to fix Puppeteer caching issue in the cloud environment
