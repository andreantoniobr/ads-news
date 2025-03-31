import { API_KEY, API_URL, RT_API_URL } from "./config.js";

// DOM Elements
const scroller = document.getElementById("scroller");
const loadingIndicator = document.getElementById("loading");

// Cache configuration
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour cache duration
const NYT_CACHE_KEY = "nyt_news_cache";
const RT_CACHE_KEY = "rt_news_cache";

// State management
let isFetching = false;
let nytDataExhausted = false;
let rtDataExhausted = false;
let currentNytOffset = 0;
let currentRtOffset = 0;
const pageSize = 5;
let allNewsItems = [];
let displayedUrls = new Set();

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadInitialItems();
});

// Scroll handler with debouncing
const scrollHandler = debounce(() => {
    if (isFetching) return;

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollPosition = scrollTop + clientHeight;
    const loadThreshold = scrollHeight * 0.5;

    if (scrollPosition >= loadThreshold) {
        if (!nytDataExhausted) {
            loadMoreNytItems();
        } else if (!rtDataExhausted) {
            loadRTData();
        }
    }
}, 200);

window.addEventListener('scroll', scrollHandler);

// Main loading function
async function loadInitialItems() {
    try {
        isFetching = true;
        loadingIndicator.style.display = 'block';
        displayedUrls.clear();

        const cachedData = getCachedData(NYT_CACHE_KEY);
        if (cachedData) {
            allNewsItems = processNewsData(cachedData);
            console.log("Loaded NYT data from cache");
        } else {
            const newsData = await fetchNewsData();
            allNewsItems = processNewsData(newsData);
            cacheData(NYT_CACHE_KEY, newsData);
        }

        const initialItems = allNewsItems.slice(0, pageSize)
            .filter(item => !displayedUrls.has(item.url));

        renderNewsItems(initialItems);
        currentNytOffset = Math.min(pageSize, allNewsItems.length);
        initialItems.forEach(item => displayedUrls.add(item.url));

        if (currentNytOffset >= allNewsItems.length) {
            nytDataExhausted = true;
        }

    } catch (error) {
        console.error("Error loading initial items:", error);
        showErrorToUser();
    } finally {
        isFetching = false;
        loadingIndicator.style.display = 'none';
    }
}

async function loadMoreNytItems() {
    try {
        isFetching = true;
        loadingIndicator.style.display = 'block';
        
        const endOffset = currentNytOffset + pageSize;
        const itemsToShow = allNewsItems.slice(currentNytOffset, endOffset)
            .filter(item => !displayedUrls.has(item.url));

        if (itemsToShow.length > 0) {
            renderNewsItems(itemsToShow);
            currentNytOffset = endOffset;
            itemsToShow.forEach(item => displayedUrls.add(item.url));
        }

        if (currentNytOffset >= allNewsItems.length) {
            nytDataExhausted = true;
        }

    } catch (error) {
        console.error("Error loading more NYT items:", error);
    } finally {
        isFetching = false;
        loadingIndicator.style.display = 'none';
    }
}

// API Fetch functions
async function fetchNewsData() {
    const url = `${API_URL}?api-key=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
}

async function fetchRTData(offset) {
    const url = `${RT_API_URL}?api-key=${API_KEY}&offset=${offset}&limit=${pageSize}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`RT API error! status: ${response.status}`);
    return await response.json();
}

// Data processing
function processNewsData(data) {
    if (!data.results) throw new Error("No results in response");
    
    return data.results
        .filter(news => news.url?.includes("http"))
        .map(news => ({
            section: news.section,
            title: news.title,
            abstract: news.abstract,
            url: news.url,
            imageUrl: getBestImageUrl(news.multimedia)
        }));
}

function processRTData(data) {
    if (!data.results) throw new Error("No results in RT response");
    
    return data.results
        .filter(article => article.url?.includes("http"))
        .map(article => ({
            section: article.section || "RT News",
            title: article.title,
            abstract: article.abstract,
            url: article.url,
            imageUrl: getBestImageUrl(article.multimedia)
        }));
}

// Image handling
function getBestImageUrl(multimedia) {
    if (!multimedia || multimedia.length === 0) {
        return 'https://via.placeholder.com/300x200?text=No+Image+Available';
    }
    
    // Try to find the best quality image first
    const image = multimedia.find(media => media.format === "mediumThreeByTwo440") || 
                 multimedia.find(media => media.format === "Standard Thumbnail") ||
                 multimedia[0];
    
    if (image && image.url) {
        return image.url.startsWith('http') ? image.url : `https://www.nytimes.com/${image.url}`;
    }
    
    return 'https://via.placeholder.com/300x200?text=No+Image+Available';
}

// RT Data loading with duplicate prevention
async function loadRTData() {
    try {
        isFetching = true;
        loadingIndicator.style.display = 'block';
        
        const cachedData = getCachedData(RT_CACHE_KEY);
        let rtData;
        
        if (cachedData) {
            rtData = cachedData;
            console.log("Loaded RT data from cache");
        } else {
            rtData = await fetchRTData(currentRtOffset);
            cacheData(RT_CACHE_KEY, rtData);
        }
        
        const newItems = processRTData(rtData)
            .filter(item => !displayedUrls.has(item.url));

        if (newItems.length > 0) {
            renderNewsItems(newItems);
            currentRtOffset += newItems.length;
            newItems.forEach(item => displayedUrls.add(item.url));
        } else {
            rtDataExhausted = true;
        }

        // If we got less than requested, we've hit the end
        if (newItems.length < pageSize) {
            rtDataExhausted = true;
        }

    } catch (error) {
        console.error("Error loading RT data:", error);
        rtDataExhausted = true;
    } finally {
        isFetching = false;
        loadingIndicator.style.display = 'none';
    }
}

// Caching functions
function cacheData(key, data) {
    const cacheItem = {
        data: data,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
}

function getCachedData(key) {
    const cachedItem = localStorage.getItem(key);
    if (!cachedItem) return null;
    
    const parsed = JSON.parse(cachedItem);
    if (Date.now() - parsed.timestamp > CACHE_EXPIRY) {
        localStorage.removeItem(key);
        return null;
    }
    return parsed.data;
}

// Rendering function
function renderNewsItems(items) {
    items.forEach(item => {
        const newsElement = createNewsElement(item);
        scroller.appendChild(newsElement);
    });
}

function createNewsElement(newsItem) {
    const newsContainer = document.createElement('div');
    newsContainer.className = "col-12 col-sm-6 col-md-12";
    const article = document.createElement('article');
    article.className = 'news-item';
    article.innerHTML = `
        <div class="featured-post-2 mb-4 pb-4 border-bottom">
            <a href="${newsItem.url}" title="${newsItem.title}" target="_blank" rel="noopener">
                <div class="featured-post-container">
                    <div class="featured-post-img">
                        <picture>
                            <img src="${newsItem.imageUrl}" 
                                 alt="${newsItem.title || 'News image'}"
                                 class="news-image"
                                 onerror="this.onerror=null;this.src='https://via.placeholder.com/300x200?text=Image+Not+Available'">
                        </picture>
                    </div>
                    <div class="featured-post-text">
                        <h2>${newsItem.title}</h2>
                        <p class="d-none d-lg-block">${newsItem.abstract}</p>
                        <span>${newsItem.section}</span>
                    </div>
                </div>
            </a>
        </div>
    `;
    newsContainer.appendChild(article);
    return newsContainer;
}

// Error handling
function showErrorToUser(message = 'Failed to load news. Please try again later.') {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    scroller.appendChild(errorElement);
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}