import { API_KEY, API_URL, RT_API_URL } from "./config.js";

// DOM Elements
const scroller = document.getElementById("scroller");
const loadingIndicator = document.getElementById("loading");

// Cache configuration
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour cache duration
const NYT_CACHE_KEY = "nyt_news_cache";
const RT_CACHE_KEY = "rt_news_cache";

// State management
let isFetchingRT = false;
let hasMoreRTData = true;
let rtCurrentOffset = 0;
const rtPageSize = 5;
let isLoading = false;
let currentOffset = 0;
const pageSize = 5;
let allNewsItems = [];
let allRTItems = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadInitialItems();
});

// Scroll handler with debouncing
const scrollHandler = debounce(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    const scrollPosition = scrollTop + clientHeight;
    
    if (scrollPosition >= scrollHeight - 800 && !isLoading && !isFetchingRT) {
        const remainingNytItems = allNewsItems.length - currentOffset;
        
        if (remainingNytItems > 0) {
            loadMoreItems();
        } else if (hasMoreRTData) {
            loadRTData();
        }
    }
}, 200);

window.addEventListener('scroll', scrollHandler);

// Main loading function
async function loadInitialItems() {
    try {
        loadingIndicator.style.display = 'block';
        isLoading = true;
        
        // Try to load from cache first
        const cachedData = getCachedData(NYT_CACHE_KEY);
        if (cachedData) {
            allNewsItems = processNewsData(cachedData);
            console.log("Loaded NYT data from cache");
        } else {
            const newsData = await fetchNewsData();
            allNewsItems = processNewsData(newsData);
            cacheData(NYT_CACHE_KEY, newsData);
        }
        
        renderNewsItems(allNewsItems.slice(0, pageSize));
        currentOffset = pageSize;
        
    } catch (error) {
        console.error("Error loading initial items:", error);
        showErrorToUser();
    } finally {
        loadingIndicator.style.display = 'none';
        isLoading = false;
    }
}

async function loadMoreItems() {
    try {
        loadingIndicator.style.display = 'block';
        isLoading = true;
        
        const endOffset = currentOffset + pageSize;
        const itemsToShow = allNewsItems.slice(currentOffset, endOffset);
        
        if (itemsToShow.length > 0) {
            renderNewsItems(itemsToShow);
            currentOffset = endOffset;
        }
    } catch (error) {
        console.error("Error loading more items:", error);
    } finally {
        loadingIndicator.style.display = 'none';
        isLoading = false;
    }
}

// API Fetch function with caching
async function fetchNewsData() {
    const url = `${API_URL}?api-key=${API_KEY}&limit=20`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

async function fetchRTData() {
    const url = `${RT_API_URL}?api-key=${API_KEY}&offset=${rtCurrentOffset}&limit=${rtPageSize}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`RT API error! status: ${response.status}`);
    }
    
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
        }));
}

// RT Data loading with caching
async function loadRTData() {
    try {
        isFetchingRT = true;
        loadingIndicator.style.display = 'block';
        
        // Try cache first
        const cachedData = getCachedData(RT_CACHE_KEY);
        let rtData;
        
        if (cachedData) {
            rtData = cachedData;
            console.log("Loaded RT data from cache");
        } else {
            rtData = await fetchRTData();
            cacheData(RT_CACHE_KEY, rtData);
        }
        
        const newRTItems = processRTData(rtData);
        
        if (newRTItems.length > 0) {
            allRTItems = [...allRTItems, ...newRTItems];
            renderNewsItems(newRTItems);
            rtCurrentOffset += rtPageSize;
        } else {
            hasMoreRTData = false;
        }
    } catch (error) {
        console.error("Error loading RT data:", error);
        showErrorToUser("Failed to load additional news");
    } finally {
        isFetchingRT = false;
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
            <a href="${newsItem.url}" title="${newsItem.title}">
                                            <div class="featured-post-container">
                                                <div class="featured-post-img">
                                                    <picture>
                                                        <img src="assets/images/01.jpg" alt="">
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
    return article;
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