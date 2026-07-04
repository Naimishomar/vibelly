const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Replace with your Service Account JSON file path (provided by the user)
const keyFilePath = 'C:\\Users\\naimi\\Downloads\\fync-484605-c5224a5fff52.json';
const baseUrl = 'https://vibelly.fun';
// We will take a random sample of 200 important URLs to push immediately
const keywords = ['omegle-alternative', 'random-video-chat', 'talk-to-strangers', 'anonymous-chat'];
const cities = ["new-york", "los-angeles", "london", "sydney", "tokyo", "mumbai"];
const urlsToPing = [];
for (const kw of keywords) {
  urlsToPing.push(`${baseUrl}/${kw}`);
  for (const city of cities) {
    urlsToPing.push(`${baseUrl}/${kw}-in-${city}`);
  }
}
// Ensure we only ping up to 190 URLs to save rate limits
const finalUrlsToPing = urlsToPing.slice(0, 190);
// Also push the main pages
finalUrlsToPing.push(`${baseUrl}/`);
finalUrlsToPing.push(`${baseUrl}/omegle-alternative`);
finalUrlsToPing.push(`${baseUrl}/ometv-alternative`);
finalUrlsToPing.push(`${baseUrl}/random-video-chat`);

async function submitToGoogle() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    const indexing = google.indexing({ version: 'v3', auth: client });

    console.log(`Authenticating with Google Indexing API...`);
    
    let successCount = 0;
    
    // We can use batch requests, but making them sequentially is safer to not hit rate limit spikes
    for (let i = 0; i < finalUrlsToPing.length; i++) {
      const url = finalUrlsToPing[i];
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`[${i+1}/${finalUrlsToPing.length}] SUCCESS: Pushed ${url}`);
        successCount++;
        
        // Wait 100ms between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`[${i+1}/${finalUrlsToPing.length}] FAILED: ${url} - ${e.message}`);
      }
    }
    
    console.log(`Finished pushing to Google. Successfully pushed ${successCount} URLs.`);
  } catch (error) {
    console.error('Failed to initialize Google Indexing API:', error.message);
  }
}

submitToGoogle();
