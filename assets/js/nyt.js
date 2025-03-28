import { API_KEY, API_URL } from "./config.js";

// DOM Elements
const scroller = document.getElementById("scroller");
const loadingIndicator = document.getElementById("loading");

// State management
let isLoading = false;
let currentPage = 0;
const pageSize = 5; // Number of items to load per scroll
let allNewsItems = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadInitialItems();
});

// Improved scroll handler with debouncing
const scrollHandler = debounce(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    
    // Check if we're near bottom and not already loading
    if (scrollTop + clientHeight >= scrollHeight - 4000 && !isLoading) {
        loadMoreItems();
    }
}, 200);

window.addEventListener('scroll', scrollHandler);

// Main loading function
async function loadInitialItems() {
    try {
        loadingIndicator.style.display = 'block';
        isLoading = true;
        
        const newsData = await fetchNewsData();
        allNewsItems = processNewsData(newsData);
        
        renderNewsItems(allNewsItems.slice(0, pageSize));
        currentPage++;
        
        console.log("Initial load successful");
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
        
        // Calculate which items to show
        const startIndex = currentPage * pageSize;
        const endIndex = startIndex + pageSize;
        const itemsToShow = allNewsItems.slice(startIndex, endIndex);
        
        if (itemsToShow.length > 0) {
            renderNewsItems(itemsToShow);
            currentPage++;
        } else {
            // No more items to load
            window.removeEventListener('scroll', scrollHandler);
            console.log("All items loaded");
        }
    } catch (error) {
        console.error("Error loading more items:", error);
    } finally {
        loadingIndicator.style.display = 'none';
        isLoading = false;
    }
}

// API Fetch function
async function fetchNewsData() {
    const url = `${API_URL}?api-key=${API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
            // Add any additional fields you need
        }));
}

// Rendering function
function renderNewsItems(items) {
    items.forEach(item => {
        const newsElement = createNewsElement(item);
        scroller.appendChild(newsElement);
    });
}

function createNewsElement(newsItem) {
    const article = document.createElement('article');
    article.className = 'news-item';
    
    article.innerHTML = `
        <h2>${newsItem.title}</h2>
        <p class="section">${newsItem.section}</p>
        <p class="abstract">${newsItem.abstract}</p>
        <a href="${newsItem.url}" target="_blank">Read more</a>
    `;
    
    return article;
}

// Error handling
function showErrorToUser() {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = 'Failed to load news. Please try again later.';
    scroller.prepend(errorElement);
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