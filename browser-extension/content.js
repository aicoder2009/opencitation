// OpenCitation Browser Extension - Content Script
// Extracts metadata from web pages for citation generation

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACT_PAGE_INFO") {
    const pageInfo = extractPageInfo();
    sendResponse(pageInfo);
  }
  return true;
});

function extractPageInfo() {
  const info = {
    url: window.location.href,
    title: document.title,
    description: null,
    author: null,
    publishDate: null,
    siteName: null,
    language: document.documentElement.lang || null,
  };

  // Extract Open Graph metadata
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogSiteName = document.querySelector('meta[property="og:site_name"]');

  if (ogTitle) info.title = ogTitle.content;
  if (ogDescription) info.description = ogDescription.content;
  if (ogSiteName) info.siteName = ogSiteName.content;

  // Extract standard meta tags
  const metaDescription = document.querySelector('meta[name="description"]');
  const metaAuthor = document.querySelector('meta[name="author"]');

  if (!info.description && metaDescription) {
    info.description = metaDescription.content;
  }
  if (metaAuthor) {
    info.author = metaAuthor.content;
  }

  // Extract article metadata
  const articlePublished = document.querySelector('meta[property="article:published_time"]');
  const articleAuthor = document.querySelector('meta[property="article:author"]');

  if (articlePublished) {
    info.publishDate = articlePublished.content;
  }
  if (articleAuthor && !info.author) {
    info.author = articleAuthor.content;
  }

  // Extract Schema.org metadata (JSON-LD)
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent);
      if (data["@type"] === "Article" || data["@type"] === "NewsArticle" || data["@type"] === "BlogPosting") {
        if (data.headline && !info.title) info.title = data.headline;
        if (data.author) {
          if (typeof data.author === "string") {
            info.author = data.author;
          } else if (data.author.name) {
            info.author = data.author.name;
          }
        }
        if (data.datePublished && !info.publishDate) {
          info.publishDate = data.datePublished;
        }
        if (data.publisher?.name && !info.siteName) {
          info.siteName = data.publisher.name;
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  });

  // Extract date from common selectors
  if (!info.publishDate) {
    const timeEl = document.querySelector("time[datetime]");
    if (timeEl) {
      info.publishDate = timeEl.getAttribute("datetime");
    }
  }

  // Extract site name from common patterns
  if (!info.siteName) {
    // Try to extract from URL
    const hostname = window.location.hostname.replace(/^www\./, "");
    info.siteName = hostname.split(".")[0].charAt(0).toUpperCase() + hostname.split(".")[0].slice(1);
  }

  return info;
}

// Auto-extract on load (for future use)
const pageInfo = extractPageInfo();
console.log("OpenCitation: Page info extracted", pageInfo);
