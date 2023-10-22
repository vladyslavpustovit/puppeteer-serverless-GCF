# Serverless Scraping Function built with Puppeteer (GCF deployment)

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