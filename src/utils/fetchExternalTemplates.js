/**
 * Utility to fetch trending meme templates from external sources
 * and prepare them for storage in the database
 */

// Try multiple CORS proxies as fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

/**
 * Converts an image URL to base64 data URL
 * Handles CORS issues by using a proxy if needed
 */
async function imageUrlToBase64(url) {
  try {
    // Try direct fetch first
    let response;
    try {
      response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('Direct fetch failed');
    } catch (error) {
      // If direct fetch fails, try with first CORS proxy
      console.log('Direct fetch failed, trying CORS proxy for:', url);
      const proxyUrl = `${CORS_PROXIES[0]}${encodeURIComponent(url)}`;
      response = await fetch(proxyUrl);
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => {
        console.error('FileReader error for:', url);
        reject(new Error('Failed to read blob'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', url, error);
    return null;
  }
}

/**
 * Fetches trending memes from Imgflip API
 */
async function fetchFromImgflip() {
  try {
    const response = await fetch('https://api.imgflip.com/get_memes');
    const data = await response.json();
    
    if (data.success && data.data.memes) {
      return data.data.memes
        .sort((a, b) => b.box_count - a.box_count) // Sort by popularity
        .slice(0, 10) // Get top 10 (Imgflip limit)
        .map((meme) => ({
          name: meme.name,
          url: meme.url,
          source: 'imgflip',
          description: `Popular meme template "${meme.name}" with ${meme.box_count} text boxes`,
          metadata: {
            boxCount: meme.box_count,
            width: meme.width,
            height: meme.height,
            popularity: meme.box_count,
            originalId: meme.id
          }
        }));
    }
  } catch (error) {
    console.error('Error fetching from Imgflip:', error);
  }
  return [];
}

/**
 * Fetches trending memes from Reddit (r/memes)
 * Fetches from a specific endpoint (hot or top)
 * DEBUG MODE: Enhanced logging to diagnose CORS/proxy issues
 * Tries multiple CORS proxies as fallbacks
 */
async function fetchFromRedditEndpoint(endpoint = 'top', limit = 100, timePeriod = 'day') {
  // endpoint can be 'hot' or 'top'
  // For 'top', timePeriod can be: hour, day, week, month, year, all
  let url;
  if (endpoint === 'hot') {
    url = `https://www.reddit.com/r/memes/hot.json?limit=${limit}`;
  } else {
    url = `https://www.reddit.com/r/memes/top.json?limit=${limit}&t=${timePeriod}`;
  }
  console.log('=== REDDIT DEBUG: Starting fetch ===');
  console.log('Reddit URL:', url);
  console.log('Available CORS proxies:', CORS_PROXIES.length);
  
  // Try each CORS proxy in sequence
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const CORS_PROXY = CORS_PROXIES[i];
    console.log(`\n=== REDDIT DEBUG: Trying proxy ${i + 1}/${CORS_PROXIES.length} ===`);
    console.log('Proxy URL:', CORS_PROXY);
    
    try {
      const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
      console.log('=== REDDIT DEBUG: Full Proxy URL ===');
      console.log('Full proxy URL:', proxyUrl);
      console.log('URL length:', proxyUrl.length);
    
    console.log('=== REDDIT DEBUG: Making fetch request ===');
    const fetchStartTime = Date.now();
    
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; MemeGenerator/1.0)'
      },
      mode: 'cors'
    });
    
    const fetchDuration = Date.now() - fetchStartTime;
    console.log('=== REDDIT DEBUG: Fetch completed ===');
    console.log('Fetch duration:', fetchDuration, 'ms');
    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response OK:', response.ok);
    console.log('Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const contentType = response.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('=== REDDIT DEBUG: Response not OK ===');
      console.error('Status:', response.status);
      console.error('Response length:', text.length);
      console.error('Response first 500 chars:');
      console.error(text.substring(0, 500));
      console.error('Response last 200 chars:');
      console.error(text.substring(Math.max(0, text.length - 200)));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('=== REDDIT DEBUG: Reading response text ===');
    const textStartTime = Date.now();
    const text = await response.text();
    const textDuration = Date.now() - textStartTime;
    console.log('Text read duration:', textDuration, 'ms');
    console.log('Response text length:', text.length);
    console.log('Response text first 100 chars:', text.substring(0, 100));
    
    // Check if we got HTML instead of JSON (common with CORS proxies)
    if (text.trim().startsWith('<') || text.includes('<html') || text.includes('<!DOCTYPE')) {
      console.error('=== REDDIT DEBUG: HTML Response Detected ===');
      console.error('Response starts with:', text.substring(0, 50));
      console.error('Full HTML response (first 1000 chars):');
      console.error(text.substring(0, 1000));
      console.error('Possible reasons:');
      console.error('1. The CORS proxy is blocked by Reddit');
      console.error('2. Reddit requires authentication');
      console.error('3. The proxy service is down or returning error page');
      console.error('4. Reddit is rate-limiting the proxy');
      throw new Error('Received HTML instead of JSON');
    }
    
    console.log('=== REDDIT DEBUG: Attempting JSON parse ===');
    let data;
    try {
      data = JSON.parse(text);
      console.log('✓ Direct JSON parse successful');
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
    } catch (parseError) {
      console.warn('Direct JSON parse failed:', parseError.message);
      console.log('Attempting to parse as wrapped JSON...');
      
      // Some proxies wrap JSON in a contents field
      try {
        const wrapper = JSON.parse(text);
        console.log('Wrapper parse successful. Wrapper keys:', Object.keys(wrapper));
        
        if (wrapper.contents) {
          console.log('Found contents field, parsing...');
          data = JSON.parse(wrapper.contents);
          console.log('✓ Wrapped JSON parse successful');
        } else {
          console.error('No contents field in wrapper');
          console.error('Wrapper structure:', wrapper);
          throw parseError;
        }
      } catch (wrapperError) {
        console.error('=== REDDIT DEBUG: JSON Parse Failed ===');
        console.error('Parse error:', wrapperError.message);
        console.error('Response text (first 500 chars):');
        console.error(text.substring(0, 500));
        console.error('Response text (last 200 chars):');
        console.error(text.substring(Math.max(0, text.length - 200)));
        throw new Error(`Invalid JSON response: ${wrapperError.message}`);
      }
    }
    
    console.log('=== REDDIT DEBUG: JSON Parsed Successfully ===');
    console.log('Data keys:', Object.keys(data));
    
    if (data && data.data && data.data.children) {
      const posts = data.data.children
        .filter(post => {
          const url = post.data.url || '';
          return url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                 url.includes('i.redd.it') || 
                 url.includes('imgur.com');
        })
        .slice(0, limit)
        .map((post) => ({
          name: post.data.title.substring(0, 50) || 'Reddit Meme',
          url: post.data.url,
          source: 'reddit',
          description: `${post.data.title} - ${post.data.score} upvotes on r/${post.data.subreddit}`,
          metadata: {
            upvotes: post.data.ups,
            score: post.data.score,
            author: post.data.author,
            subreddit: post.data.subreddit,
            created: post.data.created_utc,
            popularity: post.data.score,
            permalink: `https://reddit.com${post.data.permalink}`
          }
        }));
      
      console.log(`✓ SUCCESS: Fetched ${posts.length} Reddit memes from ${endpoint.toUpperCase()} using proxy ${i + 1}`);
      return posts;
    } else {
      console.warn(`Proxy ${i + 1}: Reddit data structure unexpected:`, data);
      throw new Error('Unexpected Reddit data structure');
    }
    } catch (error) {
      console.error(`\n=== REDDIT DEBUG: Proxy ${i + 1} Failed ===`);
      console.error('Error:', error.message);
      console.error('Error stack:', error.stack);
      
      // If this is the last proxy, log final failure
      if (i === CORS_PROXIES.length - 1) {
        console.error('\n=== REDDIT DEBUG: All Proxies Failed ===');
        console.error('All CORS proxies failed. Reddit fetch unavailable.');
        console.error('Common reasons:');
        console.error('- Reddit blocks most CORS proxies');
        console.error('- Reddit requires proper User-Agent headers');
        console.error('- Reddit may rate-limit requests');
        console.error('- Proxy services may be down');
      } else {
        console.log(`Trying next proxy...`);
      }
      // Continue to next proxy
    }
  }
  
  console.warn('All Reddit CORS proxies failed. Returning empty array.');
  return [];
}

/**
 * Fetches 20 trending meme templates from multiple sources
 * Returns array of template objects with image data and metadata
 */
/**
 * Fetches templates from Reddit only
 */
export async function fetchRedditTemplates() {
  try {
    // Fetch from both Reddit hot and top endpoints
    console.log('=== Fetching from Reddit (hot + top) ===');
    const [redditHotTemplates, redditTopTemplates] = await Promise.allSettled([
      fetchFromRedditEndpoint('hot', 100), // Fetch 100 hot posts
      fetchFromRedditEndpoint('top', 100, 'day') // Fetch 100 top posts from last day
    ]);

    // Combine results
    let allTemplates = [];
    
    if (redditHotTemplates.status === 'fulfilled') {
      console.log('Reddit HOT fetch status: fulfilled, templates:', redditHotTemplates.value?.length || 0);
      allTemplates.push(...(redditHotTemplates.value || []));
    } else {
      console.log('Reddit HOT fetch status: rejected, reason:', redditHotTemplates.reason);
    }
    
    if (redditTopTemplates.status === 'fulfilled') {
      console.log('Reddit TOP fetch status: fulfilled, templates:', redditTopTemplates.value?.length || 0);
      allTemplates.push(...(redditTopTemplates.value || []));
    } else {
      console.log('Reddit TOP fetch status: rejected, reason:', redditTopTemplates.reason);
    }

    // Remove duplicates based on URL
    const uniqueTemplates = [];
    const seenUrls = new Set();
    
    for (const template of allTemplates) {
      if (!seenUrls.has(template.url)) {
        seenUrls.add(template.url);
        uniqueTemplates.push(template);
      }
    }

    // Sort by popularity and take top 20
    const sortedTemplates = uniqueTemplates
      .sort((a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0))
      .slice(0, 20);

    console.log(`Fetched ${sortedTemplates.length} unique templates, converting to base64...`);

    // Convert images to base64 for storage
    const templatesWithData = [];
    for (let i = 0; i < sortedTemplates.length; i++) {
      const template = sortedTemplates[i];
      console.log(`Converting image ${i + 1}/${sortedTemplates.length}: ${template.name}`);
      
      const imageData = await imageUrlToBase64(template.url);
      if (imageData) {
        // Extract file extension from URL
        const urlParts = template.url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
        const fileName = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${i}.${extension}`;
        
        templatesWithData.push({
          name: template.name,
          description: template.description,
          source: template.source,
          originalUrl: template.url, // Store original URL for duplicate detection
          imageData: imageData, // Base64 data URL
          fileName: fileName,
          filePath: `assets/${fileName}`, // Virtual path for reference
          metadata: JSON.stringify(template.metadata || {}),
          fetchedAt: Date.now()
        });
        console.log(`✓ Successfully converted: ${template.name}`);
      } else {
        console.warn(`✗ Failed to convert: ${template.name}`);
      }
    }

    console.log(`Successfully converted ${templatesWithData.length} out of ${sortedTemplates.length} templates`);
    return templatesWithData;
  } catch (error) {
    console.error('Error fetching Reddit templates:', error);
    return [];
  }
}

/**
 * Fetches templates from Imgflip only
 */
export async function fetchImgflipTemplates() {
  try {
    console.log('=== Fetching from Imgflip ===');
    const [imgflipTemplates] = await Promise.allSettled([
      fetchFromImgflip()
    ]);

    // Combine results
    let allTemplates = [];
    
    if (imgflipTemplates.status === 'fulfilled') {
      console.log('Imgflip fetch status: fulfilled, templates:', imgflipTemplates.value?.length || 0);
      allTemplates.push(...(imgflipTemplates.value || []));
    } else {
      console.log('Imgflip fetch status: rejected, reason:', imgflipTemplates.reason);
    }

    // Remove duplicates based on URL
    const uniqueTemplates = [];
    const seenUrls = new Set();
    
    for (const template of allTemplates) {
      if (!seenUrls.has(template.url)) {
        seenUrls.add(template.url);
        uniqueTemplates.push(template);
      }
    }

    // Sort by popularity and take top 20
    const sortedTemplates = uniqueTemplates
      .sort((a, b) => (b.metadata?.popularity || 0) - (a.metadata?.popularity || 0))
      .slice(0, 20);

    console.log(`Fetched ${sortedTemplates.length} unique templates, converting to base64...`);

    // Convert images to base64 for storage
    const templatesWithData = [];
    for (let i = 0; i < sortedTemplates.length; i++) {
      const template = sortedTemplates[i];
      console.log(`Converting image ${i + 1}/${sortedTemplates.length}: ${template.name}`);
      
      const imageData = await imageUrlToBase64(template.url);
      if (imageData) {
        // Extract file extension from URL
        const urlParts = template.url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
        const fileName = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}-${i}.${extension}`;
        
        templatesWithData.push({
          name: template.name,
          description: template.description,
          source: template.source,
          originalUrl: template.url, // Store original URL for duplicate detection
          imageData: imageData, // Base64 data URL
          fileName: fileName,
          filePath: `assets/${fileName}`, // Virtual path for reference
          metadata: JSON.stringify(template.metadata || {}),
          fetchedAt: Date.now()
        });
        console.log(`✓ Successfully converted: ${template.name}`);
      } else {
        console.warn(`✗ Failed to convert: ${template.name}`);
      }
    }

    console.log(`Successfully converted ${templatesWithData.length} out of ${sortedTemplates.length} templates`);
    return templatesWithData;
  } catch (error) {
    console.error('Error fetching Imgflip templates:', error);
    return [];
  }
}

