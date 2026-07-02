const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Replace with your Service Account JSON file path (provided by the user)
const keyFilePath = 'C:\\Users\\naimi\\Downloads\\fync-484605-c5224a5fff52.json';
const seoDataPath = path.join(__dirname, '..', 'src', 'data', 'seoPages.json');
const seoData = JSON.parse(fs.readFileSync(seoDataPath, 'utf8'));

const slugs = Object.keys(seoData);
const baseUrl = 'https://vibelly.vercel.app';

// Google allows 200 requests per batch and 200 per day by default
// We will take a random sample of 200 important URLs to push immediately
const shuffledSlugs = slugs.sort(() => 0.5 - Math.random());
const urlsToPing = shuffledSlugs.slice(0, 190).map(s => `${baseUrl}/${s}`);
// Also push the main pages
urlsToPing.push(`${baseUrl}/`);
urlsToPing.push(`${baseUrl}/omegle-alternative`);
urlsToPing.push(`${baseUrl}/ometv-alternative`);
urlsToPing.push(`${baseUrl}/random-video-chat`);

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
    for (let i = 0; i < urlsToPing.length; i++) {
      const url = urlsToPing[i];
      try {
        const response = await indexing.urlNotifications.publish({
          requestBody: {
            url: url,
            type: 'URL_UPDATED',
          },
        });
        console.log(`[${i+1}/${urlsToPing.length}] SUCCESS: Pushed ${url}`);
        successCount++;
        
        // Wait 100ms between requests to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`[${i+1}/${urlsToPing.length}] FAILED: ${url} - ${e.message}`);
      }
    }
    
    console.log(`Finished pushing to Google. Successfully pushed ${successCount} URLs.`);
  } catch (error) {
    console.error('Failed to initialize Google Indexing API:', error.message);
  }
}

submitToGoogle();
