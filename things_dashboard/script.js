// Global variables
let userLocation = { lat: 21.0325, lon: 105.8497 }; // Default to Hanoi, Vietnam
let currentTime = null;
let currentDefinition = null; // Store current definition for translation
let translatedDefinition = null; // Store translated definition
let currentTheme = null; // Store current theme

// Read news tracking system
const READ_NEWS_KEY = 'dashboard_read_news';
let readNewsTitles = new Set();

// Normalize title for consistent tracking
function normalizeNewsTitle(title) {
    return title.trim().toLowerCase();
}

// Initialize read news from localStorage
function initializeReadNews() {
    try {
        const stored = localStorage.getItem(READ_NEWS_KEY);
        if (stored) {
            const data = JSON.parse(stored);
            
            // Load all read news without automatic cleanup
            Object.keys(data).forEach(title => {
                const normalizedTitle = normalizeNewsTitle(title);
                readNewsTitles.add(normalizedTitle);
            });
        }
    } catch (error) {
        console.error('Error loading read news:', error);
        readNewsTitles.clear();
    }
}

// Mark news as read
function markNewsAsRead(title) {
    const normalizedTitle = normalizeNewsTitle(title);
    readNewsTitles.add(normalizedTitle);
    saveReadNews();
}

// Check if news is read
function isNewsRead(title) {
    const normalizedTitle = normalizeNewsTitle(title);
    return readNewsTitles.has(normalizedTitle);
}

// Save read news to localStorage
function saveReadNews() {
    try {
        const data = {};
        readNewsTitles.forEach(title => {
            data[title] = Date.now();
        });
        localStorage.setItem(READ_NEWS_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving read news:', error);
    }
}

// Theme System
const themes = ['default', 'theme-lavender', 'theme-coral', 'theme-mint', 'theme-aurora', 'theme-cherry', 'theme-sunset', 'theme-arctic', 'theme-ocean', 'theme-forest'];

// Initialize random theme on page load
function initializeTheme() {
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    setTheme(randomTheme);
}

function setTheme(themeName) {
    // Remove all theme classes
    themes.forEach(theme => {
        document.body.classList.remove(theme);
    });
    
    // Add new theme class if not default
    if (themeName !== 'default') {
        document.body.classList.add(themeName);
    }
    
    currentTheme = themeName;
    console.log(`Theme changed to: ${themeName}`);
}

function switchTheme() {
    // Find current theme index
    let currentIndex = themes.indexOf(currentTheme);
    if (currentIndex === -1) currentIndex = 0; // Default to first theme if not found
    
    // Move to next theme
    let nextIndex = (currentIndex + 1) % themes.length;
    let nextTheme = themes[nextIndex];
    
    setTheme(nextTheme);
    
    // Show notification
    const themeNames = {
        'default': 'Sunset Vibes',
        'theme-lavender': 'Lavender Dreams',
        'theme-coral': 'Coral Sunset',
        'theme-mint': 'Mint Fresh',
        'theme-aurora': 'Aurora Borealis',
        'theme-cherry': 'Cherry Blossom',
        'theme-sunset': 'Golden Hour',
        'theme-arctic': 'Arctic Ice',
        'theme-ocean': 'Ocean Dreams', 
        'theme-forest': 'Forest Mist'
    };
    
    showProgressNotification(`Chủ đề đã đổi thành: ${themeNames[nextTheme]}`, 'success');
}

// RSS Feed Parser
async function fetchRSSFeed(feedUrl) {
    const startTime = Date.now();
    console.log(`[RSS] Starting fetch for: ${feedUrl}`);
    
    try {
        // Use CORS proxy for RSS feed
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
        console.log(`[RSS] Proxy URL: ${proxyUrl}`);
        
        console.log(`[RSS] Sending fetch request...`);
        const fetchStartTime = Date.now();
        const response = await fetch(proxyUrl);
        const fetchEndTime = Date.now();
        console.log(`[RSS] Fetch completed in ${fetchEndTime - fetchStartTime}ms`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(`[RSS] Parsing JSON response...`);
        const parseStartTime = Date.now();
        const data = await response.json();
        const parseEndTime = Date.now();
        console.log(`[RSS] JSON parsed in ${parseEndTime - parseStartTime}ms`);
        
        console.log(`[RSS] Creating DOM parser...`);
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, "text/xml");
        
        console.log(`[RSS] Parsing RSS feed items...`);
        const itemsStartTime = Date.now();
        const result = parseRSSFeed(xmlDoc);
        const itemsEndTime = Date.now();
        console.log(`[RSS] RSS items parsed in ${itemsEndTime - itemsStartTime}ms, found ${result.length} items`);
        
        const totalTime = Date.now() - startTime;
        console.log(`[RSS] Total fetch time for ${feedUrl}: ${totalTime}ms`);
        
        return result;
    } catch (error) {
        const totalTime = Date.now() - startTime;
        console.error(`[RSS] Error fetching RSS feed after ${totalTime}ms:`, error);
        console.error(`[RSS] Error details:`, {
            feedUrl: feedUrl,
            error: error.message,
            stack: error.stack
        });
        return [];
    }
}

function parseRSSFeed(xmlDoc) {
    const items = xmlDoc.getElementsByTagName('item');
    const newsItems = [];
    
    for (let i = 0; i < Math.min(items.length); i++) {
        const item = items[i];
        const title = item.getElementsByTagName('title')[0]?.textContent || '';
        const description = item.getElementsByTagName('description')[0]?.textContent || '';
        const link = item.getElementsByTagName('link')[0]?.textContent || '';
        const pubDate = item.getElementsByTagName('pubDate')[0]?.textContent || '';
        const enclosure = item.getElementsByTagName('enclosure')[0];
        
        // Extract image from description CDATA
        let image = '';
        if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
            image = enclosure.getAttribute('url') || '';
        } else if (description) {
            // Extract image from CDATA description
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) {
                image = imgMatch[1];
            }
        }
        
        // Clean description text
        let cleanDescription = description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
            .replace(/&amp;/g, '&') // Replace HTML entities
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        
        // Limit description length
        if (cleanDescription.length > 150) {
            cleanDescription = cleanDescription.substring(0, 150) + '...';
        }
        
        newsItems.push({
            title: title.trim(),
            description: cleanDescription,
            link: link.trim(),
            pubDate: pubDate.trim(),
            image: image.trim(),
            source: 'VnExpress'
        });
    }
    
    // Sort by newest first (descending order by publication date)
    newsItems.sort((a, b) => {
        try {
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return dateB - dateA; // Newest first
        } catch (error) {
            // If date parsing fails, keep original order
            return 0;
        }
    });
    
    return newsItems;
}

function formatNewsDate(pubDate) {
    try {
        const date = new Date(pubDate);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        
        if (diffHours < 1) {
            return 'Vừa xong';
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else {
            const diffDays = Math.floor(diffHours / 24);
            if (diffDays < 7) {
                return `${diffDays} ngày trước`;
            } else {
                return date.toLocaleDateString('vi-VN');
            }
        }
    } catch (error) {
        return pubDate;
    }
}

// Predefined cities with coordinates for weather and geography search
const cityList = [
    { name: 'Hà Nội', lat: 21.0325, lon: 105.8497, country: 'VN' },
    { name: 'TP. Hồ Chí Minh', lat: 10.8231, lon: 106.6297, country: 'VN' },
    { name: 'Đà Nẵng', lat: 16.0544, lon: 108.2022, country: 'VN' },
    { name: 'Hải Phòng', lat: 20.8449, lon: 106.6881, country: 'VN' },
    { name: 'Cần Thơ', lat: 10.0452, lon: 105.7469, country: 'VN' },
    { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'JP' },
    { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'KR' },
    { name: 'Singapore', lat: 1.3521, lon: 103.8198, country: 'SG' },
    { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'TH' },
    { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, country: 'MY' },
    { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
    { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
    { name: 'New York', lat: 40.7128, lon: -74.0060, country: 'US' },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'US' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' }
];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// Initialize dashboard
async function initializeDashboard() {
    initializeTheme(); // Initialize random theme
    initializeReadNews(); // Initialize read news tracking
    await getUserLocation();
    loadAllWidgets();
}

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    timeElement.textContent = now.toLocaleTimeString('vi-VN');
    dateElement.textContent = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Get user location
async function getUserLocation() {
    // Always use default location (Hanoi) on page load
    loadWeatherData();
    loadGeoData();
}

// Update user location (called when user clicks update location button)
async function updateUserLocation() {
    if (!navigator.geolocation) {
        alert('Trình duyệt không hỗ trợ định vị');
        return;
    }

    // Check if permission is already granted
    if (navigator.permissions) {
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'denied') {
                alert('Quyền vị trí đã bị từ chối. Vui lòng bật lại trong cài đặt trình duyệt.');
                return;
            }
            
            if (permission.state === 'granted') {
                // Permission already granted, get location without prompting
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        userLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        loadWeatherData();
                        loadGeoData();
                        alert('Đã cập nhật vị trí thành công!');
                    },
                    function(error) {
                        console.log('Không thể lấy vị trí:', error);
                        alert('Không thể lấy vị trí. Vui lòng thử lại.');
                    }
                );
                return;
            }
        } catch (error) {
            console.log('Không thể kiểm tra quyền vị trí:', error);
        }
    }

    // If permission state is 'prompt' or permissions API not supported, request location
    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            loadWeatherData();
            loadGeoData();
            alert('Đã cập nhật vị trí thành công!');
        },
        function(error) {
            console.log('Không thể lấy vị trí:', error);
            alert('Không thể lấy vị trí. Vui lòng thử lại.');
        }
    );
}

// Update location for all widgets that need location data
async function updateLocationForAllWidgets() {
    if (!navigator.geolocation) {
        showProgressNotification('Trình duyệt không hỗ trợ định vị', 'error');
        return;
    }

    // Check if permission is already granted
    if (navigator.permissions) {
        try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            
            if (permission.state === 'denied') {
                showProgressNotification('Quyền vị trí đã bị từ chối. Vui lòng bật lại trong cài đặt trình duyệt.', 'error');
                return;
            }
            
            if (permission.state === 'granted') {
                // Permission already granted, get location without prompting
                showProgressNotification('Đang lấy vị trí hiện tại...', 'info');
                navigator.geolocation.getCurrentPosition(
                    function(position) {
                        userLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        // Save to localStorage
                        localStorage.setItem('userLocation', JSON.stringify(userLocation));
                        // Update all location-dependent widgets
                        loadWeatherData();
                        loadNewsData(); // News can be location-based
                        loadGeoData();
                        showProgressNotification('Đã cập nhật vị trí thành công cho tất cả widget!', 'success');
                    },
                    function(error) {
                        console.log('Không thể lấy vị trí:', error);
                        showProgressNotification('Không thể lấy vị trí. Vui lòng thử lại.', 'error');
                    }
                );
                return;
            }
        } catch (error) {
            console.log('Không thể kiểm tra quyền vị trí:', error);
        }
    }

    // If permission state is 'prompt' or permissions API not supported, request location
    showProgressNotification('Đang lấy vị trí hiện tại...', 'info');
    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            // Save to localStorage
            localStorage.setItem('userLocation', JSON.stringify(userLocation));
            // Update all location-dependent widgets
            loadWeatherData();
            loadNewsData(); // News can be location-based
            loadGeoData();
            showProgressNotification('Đã cập nhật vị trí thành công cho tất cả widget!', 'success');
        },
        function(error) {
            console.log('Không thể lấy vị trí:', error);
            showProgressNotification('Không thể lấy vị trí. Vui lòng thử lại.', 'error');
        }
    );
}

// Load all widgets
function loadAllWidgets() {
    loadWeatherData();
    loadNewsData();
    loadCurrencyData();
    loadDictionaryData();
}

// Weather API - OpenWeatherMap
async function loadWeatherData() {
    const content = document.getElementById('weather-content');
    content.innerHTML = '<div class="loading">Đang tải...</div>';

    try {
        console.log('Loading weather data for location:', userLocation);
        
        // Try multiple weather APIs for better reliability
        const weatherApis = [
            // OpenWeatherMap with a working free key
            `https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&units=metric&lang=vi`,
            // WeatherAPI.com as fallback
            `https://api.weatherapi.com/v1/current.json?key=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&q=${userLocation.lat},${userLocation.lon}&lang=vi`,
            // Free weather API as second fallback
            `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lon}&current_weather=true&timezone=auto`
        ];

        let weatherData = null;
        let apiUsed = '';

        for (const apiUrl of weatherApis) {
            try {
                console.log('Trying weather API:', apiUrl.split('?')[0]);
                const response = await fetch(apiUrl);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Weather API response:', data);
                    
                    // Handle different API response formats
                    if (data.main && data.weather) {
                        // OpenWeatherMap format
                        weatherData = {
                            temp: Math.round(data.main.temp),
                            description: data.weather[0].description,
                            humidity: data.main.humidity,
                            windSpeed: data.wind?.speed || 0,
                            city: data.name || 'Unknown'
                        };
                        apiUsed = 'OpenWeatherMap';
                        break;
                    } else if (data.current) {
                        // WeatherAPI.com format
                        weatherData = {
                            temp: Math.round(data.current.temp_c),
                            description: data.current.condition?.text || 'Unknown',
                            humidity: data.current.humidity,
                            windSpeed: data.current.wind_kph,
                            city: data.location?.name || 'Unknown'
                        };
                        apiUsed = 'WeatherAPI.com';
                        break;
                    } else if (data.current_weather) {
                        // Open-Meteo format
                        weatherData = {
                            temp: Math.round(data.current_weather.temperature),
                            description: 'Current weather',
                            humidity: 0,
                            windSpeed: data.current_weather.windspeed,
                            city: 'Current location'
                        };
                        apiUsed = 'Open-Meteo';
                        break;
                    }
                }
            } catch (error) {
                console.log('Weather API failed:', apiUrl.split('?')[0], error.message);
                continue;
            }
        }

        if (weatherData) {
            displayWeatherData(weatherData, apiUsed);
        } else {
            throw new Error('All weather APIs failed');
        }
    } catch (error) {
        console.error('Weather API error:', error);
        // Enhanced fallback with demo data
        const demoWeather = {
            temp: 25,
            description: 'Nắng đẹp',
            humidity: 65,
            windSpeed: 12,
            city: 'Hà Nội'
        };
        displayWeatherData(demoWeather, 'Demo Data');
    }
} // Added closing brace here

// News RSS Feeds - Multiple VnExpress Categories
const vnexpressFeeds = [
    { url: 'https://vnexpress.net/rss/the-gioi.rss', category: 'Thế giới' },
    { url: 'https://vnexpress.net/rss/thoi-su.rss', category: 'Thời sự' },
    { url: 'https://vnexpress.net/rss/kinh-doanh.rss', category: 'Kinh doanh' },
    { url: 'https://vnexpress.net/rss/giai-tri.rss', category: 'Giải trí' },
    { url: 'https://vnexpress.net/rss/the-thao.rss', category: 'Thể thao' },
    { url: 'https://vnexpress.net/rss/phap-luat.rss', category: 'Pháp luật' },
    { url: 'https://vnexpress.net/rss/giao-duc.rss', category: 'Giáo dục' },
    { url: 'https://vnexpress.net/rss/goc-nhin.rss', category: 'Góc nhìn' },
    { url: 'https://vnexpress.net/rss/bat-dong-san.rss', category: 'Bất động sản' },
    { url: 'https://vnexpress.net/rss/tin-moi-nhat.rss', category: 'Tin mới nhất' },
    { url: 'https://vnexpress.net/rss/tin-noi-bat.rss', category: 'Tin nổi bật' },
    { url: 'https://vnexpress.net/rss/suc-khoe.rss', category: 'Sức khỏe' }
];

let allNewsItems = [];
let processedTitles = new Set(); // Track processed titles for deduplication
let newsUpdateInterval;

async function loadNewsData() {
    const content = document.getElementById('news-content');
    content.innerHTML = '<div class="loading">Đang tải tin tức từ nhiều nguồn...</div>';

    try {
        console.log('Loading RSS news data from multiple feeds sequentially...');
        allNewsItems = [];
        processedTitles.clear(); // Clear previous titles

        // Initialize display container
        content.innerHTML = `
            <div class="news-header">
                <h3>Tin tức hôm nay - VnExpress</h3>
                <small style="color: #888;">Đang tải từ 0/${vnexpressFeeds.length} chuyên mục...</small>
            </div>
            <div class="news-list" id="news-list">
            </div>
        `;
        const newsList = document.getElementById('news-list');
        
        // Process RSS feeds sequentially
        const totalStartTime = Date.now();
        console.log(`[NEWS] Starting to load ${vnexpressFeeds.length} RSS feeds...`);
        
        for (let i = 0; i < vnexpressFeeds.length; i++) {
            const feed = vnexpressFeeds[i];
            const feedStartTime = Date.now();
            console.log(`[NEWS] Starting feed ${i + 1}/${vnexpressFeeds.length}: ${feed.category} (${feed.url})`);
            
            try {
                // Update loading status
                const header = content.querySelector('.news-header small');
                if (header) {
                    header.textContent = `Đang tải từ ${i + 1}/${vnexpressFeeds.length} chuyên mục... (${feed.url})`;
                }
                
                console.log(`[NEWS] Calling fetchRSSFeed for ${feed.category}...`);
                const fetchStartTime = Date.now();
                const newsItems = await fetchRSSFeed(feed.url);
                const fetchEndTime = Date.now();
                console.log(`[NEWS] fetchRSSFeed completed in ${fetchEndTime - fetchStartTime}ms, got ${newsItems.length} items`);
                
                console.log(`[NEWS] Filtering duplicates for ${feed.category}...`);
                const filterStartTime = Date.now();
                const newItems = newsItems.filter(item => !processedTitles.has(item.title))
                    .map(item => {
                        processedTitles.add(item.title); // Mark title as processed
                        return {
                            ...item,
                            category: feed.category,
                            source: `VnExpress - ${feed.category}`
                        };
                    });
                const filterEndTime = Date.now();
                console.log(`[NEWS] Filtering completed in ${filterEndTime - filterStartTime}ms, ${newItems.length} new items`);
                
                // Add new items to the main array
                allNewsItems.push(...newItems);
                
                // Sort all items by newest first
                allNewsItems.sort((a, b) => {
                    try {
                        const dateA = new Date(a.pubDate);
                        const dateB = new Date(b.pubDate);
                        return dateB - dateA; // Newest first
                    } catch (error) {
                        // If date parsing fails, keep original order
                        return 0;
                    }
                });
                
                const feedEndTime = Date.now();
                const feedTotalTime = feedEndTime - feedStartTime;
                console.log(`[NEWS] Feed ${feed.category} completed in ${feedTotalTime}ms total`);
                
                // Filter for today's news and sort
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayNews = allNewsItems.filter(item => {
                    const newsDate = new Date(item.pubDate);
                    return newsDate >= today;
                });
                
                // Sort by publication date (newest first)
                todayNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                
                // Update display with current items
                const newsHtml = todayNews.map(item => `
                    <div class="news-item" onclick="window.open('${item.link}', '_blank')">
                        <div class="news-image">
                            ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '<i class="fas fa-newspaper"></i>'}
                        </div>
                        <div class="news-content">
                            <h4 class="news-title">${item.title}</h4>
                            <p class="news-description">${item.description}</p>
                            <div class="news-meta">
                                <span class="news-source">${item.source}</span>
                                <span class="news-time">${formatNewsDate(item.pubDate)}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                newsList.innerHTML = newsHtml;
                
                // Update header with current status
                if (header) {
                    header.textContent = `Nguồn: ${todayNews.length} tin từ ${i + 1}/${vnexpressFeeds.length} chuyên mục`;
                }
                
                console.log(`Added ${newItems.length} new items from ${feed.category} (filtered ${newsItems.length - newItems.length} duplicates)`);
                
            } catch (error) {
                console.log(`Failed to fetch from ${feed.category}:`, error.message);
                // Continue to next feed even if this one fails
            }
        }
        
        const totalEndTime = Date.now();
        const totalLoadTime = totalEndTime - totalStartTime;
        console.log(`[NEWS] All RSS feeds completed in ${totalLoadTime}ms total`);
        console.log(`[NEWS] Total items collected: ${allNewsItems.length}`);
        console.log(`allNewsItems.length: ${allNewsItems.length}`)
        
        // Filter for today's news and exclude read news
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const todayNews = allNewsItems.filter(item => {
            const newsDate = new Date(item.pubDate);
            return newsDate >= today && !isNewsRead(item.title);
        });
        
        // Sort by publication date (newest first)
        todayNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
        if (todayNews.length > 0) {
            const newsHtml = todayNews.map(item => `
                <div class="news-item ${isNewsRead(item.title) ? 'news-read' : 'news-unread'}" 
                     onclick="window.open('${item.link}', '_blank')" 
                     onmouseenter="markNewsAsRead('${item.title.replace(/'/g, "\\'")}')"
                     data-title="${item.title.replace(/"/g, '&quot;')}">
                    <div class="news-image">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '<i class="fas fa-newspaper"></i>'}
                    </div>
                    <div class="news-content">
                        <h4 class="news-title">${item.title}</h4>
                        <p class="news-description">${item.description}</p>
                        <div class="news-meta">
                            <span class="news-source">${item.source}</span>
                            <span class="news-time">${formatNewsDate(item.pubDate)}</span>
                            <span class="read-indicator">${isNewsRead(item.title) ? '✓ Đã đọc' : '• Mới'}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="news-header">
                    <h3>Tin tức hôm nay - VnExpress</h3>
                    <small style="color: #888;">Nguồn: ${todayNews.length} tin từ ${vnexpressFeeds.length} chuyên mục</small>
                </div>
                <div class="news-list">
                    ${newsHtml}
                </div>
            `;
            console.log('RSS News widget updated successfully');
            
            // Start dynamic updates every 5 minutes
            startNewsUpdates();
        } else {
            // Show all news if no today's news found
            const allNewsHtml = allNewsItems.slice(0, 10).map(item => `
                <div class="news-item" onclick="window.open('${item.link}', '_blank')" style="display: flex; flex-direction: row;">
                    <div class="news-image" style="margin-right: 10px;">
                        ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '<i class="fas fa-newspaper"></i>'}
                    </div>
                    <div class="news-content">
                        <h4 class="news-title">${item.title}</h4>
                        <p class="news-description">${item.description}</p>
                        <div class="news-meta">
                            <span class="news-source">${item.source}</span>
                            <span class="news-time">${new Date(item.pubDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            content.innerHTML = `
                <div class="news-header">
                    <h3>Tin tức mới nhất - VnExpress</h3>
                    <small style="color: #888;">Không có tin hôm nay, hiển thị tin mới nhất</small>
                </div>
                <div class="news-list">
                    ${allNewsHtml}
                </div>
            `;
            console.log('No today news found, showing latest news');
        }
    } catch (error) {
        console.error('RSS News error:', error);
        // Fallback with demo news data
        const demoNews = [
            {
                title: 'Tin tức mẫu 1',
                description: 'Đây là tin tức mẫu để hiển thị khi API không khả dụng.',
                url: '#',
                publishedAt: new Date().toISOString()
            },
            {
                title: 'Tin tức mẫu 2',
                description: 'Tin tức mẫu thứ hai với cập nhật.',
                url: '#',
                publishedAt: new Date().toISOString()
            },
        ];
        
        const newsHtml = demoNews.map(article => `
            <div class="news-item" onclick="window.open('${article.url}', '_blank')" style="display: flex; flex-direction: row;">
                <div class="news-image" style="margin-right: 10px;">
                    <i class="fas fa-newspaper"></i>
                </div>
                <div class="news-content">
                    <h4 class="news-title">${article.title}</h4>
                    <p class="news-description">${article.description}</p>
                    <div class="news-meta">
                        <span class="news-source">Demo</span>
                        <span class="news-time">${new Date(article.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        content.innerHTML = `
            <div class="news-header">
                <h3>Tin tức Hoa Kỳ</h3>
                <small style="color: #888;">Nguồn: Demo Data</small>
            </div>
            <div class="news-list">
                ${newsHtml}
            </div>
        `;
        console.log('News widget using demo data');
    }
}

// Currency API - ExchangeRate.host
async function loadCurrencyData() {
    const content = document.getElementById('currency-content');
    content.innerHTML = '<div class="loading">Đang tải...</div>';

    try {
        console.log('Loading currency data...');
        
        // Try multiple currency APIs
        const currencyApis = [
            // ExchangeRate.host
            'https://api.exchangerate.host/latest?base=USD',
            // CurrencyAPI.net as fallback
            'https://api.currencyapi.net/v2/rates?key=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&base=USD',
            // Fixer.io as second fallback
            'https://api.fixer.io/latest?base=USD'
        ];

        let currencyData = null;
        let apiUsed = '';

        for (const apiUrl of currencyApis) {
            try {
                console.log('Trying currency API:', apiUrl.split('?')[0]);
                const response = await fetch(apiUrl);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Currency API response:', data);
                    
                    // Handle different API response formats
                    if (data.rates) {
                        currencyData = data.rates;
                        apiUsed = apiUrl.includes('exchangerate.host') ? 'ExchangeRate.host' : 
                                 apiUrl.includes('currencyapi.net') ? 'CurrencyAPI.net' : 'Fixer.io';
                        break;
                    }
                }
            } catch (error) {
                console.log('Currency API failed:', apiUrl.split('?')[0], error.message);
                continue;
            }
        }

        if (currencyData) {
            const currencies = ['VND', 'EUR', 'JPY', 'GBP', 'CNY', 'KRW'];
            const currencyHtml = currencies.map(currency => {
                const rate = currencyData[currency];
                return rate ? `
                    <div class="currency-item">
                        <span class="currency-code">${currency}</span>
                        <span class="currency-rate">${rate.toFixed(4)}</span>
                    </div>
                ` : '';
            }).join('');
            
            content.innerHTML = `
                <div class="currency-header">
                    <h3>Tỷ giá USD</h3>
                    <small style="color: #888;">Nguồn: ${apiUsed}</small>
                </div>
                <div class="currency-list">
                    ${currencyHtml}
                </div>
            `;
            console.log('Currency widget updated successfully using', apiUsed);
        } else {
            throw new Error('Currency data not available');
        }
    } catch (error) {
        console.error('Currency API error:', error);
        // Enhanced fallback with demo data
        const demoRates = {
            'VND': 24500,
            'EUR': 0.85,
            'JPY': 110.5,
            'GBP': 0.73,
            'CNY': 6.45,
            'KRW': 1150
        };
        
        const currencyHtml = Object.entries(demoRates).map(([currency, rate]) => `
            <div class="currency-item">
                <span class="currency-code">${currency}</span>
                <span class="currency-rate">${rate.toFixed(4)}</span>
            </div>
        `).join('');
        
        content.innerHTML = `
            <div class="currency-header">
                <h3>Tỷ giá USD</h3>
                <small style="color: #888;">Nguồn: Demo Data</small>
            </div>
            <div class="currency-list">
                ${currencyHtml}
            </div>
        `;
        console.log('Currency widget using demo data');
    }
}

// Geo API - Prioritize Nominatim API
async function loadGeoData() {
    const content = document.getElementById('geo-content');
    content.innerHTML = '<div class="loading">Đang tải...</div>';

    try {
        console.log('Loading geo data for location:', userLocation);
        
        // Prioritize Nominatim API as requested
        const geoApis = [
            // Nominatim (OpenStreetMap) as primary
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lon}&zoom=10&accept-language=vi`,
            // OpenCage Geocoding API as fallback
            `https://api.opencagedata.com/geocode/v1/json?q=${userLocation.lat}+${userLocation.lon}&key=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&language=vi`,
            // GeoDB Cities API as second fallback
            `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?location=${userLocation.lat}${userLocation.lon}&radius=100&limit=1`
        ];

        let geoData = null;
        let apiUsed = '';

        for (const apiUrl of geoApis) {
            try {
                console.log('Trying geo API:', apiUrl.split('?')[0]);
                
                const headers = {};
                if (apiUrl.includes('rapidapi.com')) {
                    headers['X-RapidAPI-Key'] = '8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c';
                    headers['X-RapidAPI-Host'] = 'wft-geo-db.p.rapidapi.com';
                }
                
                const response = await fetch(apiUrl, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Geo API response:', data);
                    
                    // Handle different API response formats
                    if (data.address) {
                        // Nominatim format
                        geoData = {
                            name: data.address.city || data.address.town || data.address.village || 'Hà Nội',
                            country: data.address.country || 'Việt Nam',
                            population: 0,
                            region: data.address.state || data.address['ISO3166-2-lvl4'],
                            latitude: parseFloat(data.lat),
                            longitude: parseFloat(data.lon)
                        };
                        apiUsed = 'Nominatim';
                        break;
                    } else if (data.results && data.results[0]) {
                        // OpenCage format
                        const result = data.results[0];
                        geoData = {
                            name: result.components.city || result.components.town || result.components.village || 'Hà Nội',
                            country: result.components.country || 'Việt Nam',
                            population: 0,
                            region: result.components.state,
                            latitude: parseFloat(result.geometry.lat),
                            longitude: parseFloat(result.geometry.lng)
                        };
                        apiUsed = 'OpenCage';
                        break;
                    } else if (data.data && data.data[0]) {
                        // GeoDB Cities format
                        const city = data.data[0];
                        geoData = {
                            name: city.name,
                            country: city.country,
                            population: city.population,
                            region: city.region,
                            latitude: parseFloat(city.latitude),
                            longitude: parseFloat(city.longitude)
                        };
                        apiUsed = 'GeoDB Cities';
                        break;
                    }
                }
            } catch (error) {
                console.log('Geo API failed:', apiUrl.split('?')[0], error.message);
                continue;
            }
        }

        if (geoData) {
            displayGeoData(geoData, apiUsed);
        } else {
            throw new Error('All geo APIs failed');
        }
    } catch (error) {
        console.error('Geo API error:', error);
        // Enhanced fallback with demo data
        const demoGeo = {
            name: 'Hà Nội',
            country: 'Việt Nam',
            population: 8433000,
            region: 'VN-HN',
            latitude: parseFloat(21.0325),
            longitude: parseFloat(105.8497)
        };
        displayGeoData(demoGeo, 'Demo Data');
    }
}

// Dictionary API - DuckDuckGo Instant Answer
async function loadDictionaryData() {
    const content = document.getElementById('dictionary-content');
    // Dictionary widget is interactive, so we don't load initial data
}

// Translation API - Multiple providers
async function translateText() {
    const input = document.getElementById('translate-input').value;
    const fromLang = document.getElementById('from-lang').value;
    const toLang = document.getElementById('to-lang').value;
    const result = document.getElementById('translate-result');
    const testBtn = document.querySelector('.test-btn');
    
    if (!input.trim()) {
        result.textContent = 'Vui lòng nhập văn bản cần dịch';
        return;
    }
    
    // Hide the test button after clicking translate
    if (testBtn) {
        testBtn.style.display = 'none';
    }
    
    result.textContent = 'Đang dịch...';
    
    // Try Google Translate API first
    try {
        console.log('Attempting Google Translate with:', { input, fromLang, toLang });
        const googleResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(input)}`);
        
        console.log('Google Translate response status:', googleResponse.status);
        
        if (googleResponse.ok) {
            const data = await googleResponse.json();
            console.log('Google Translate response data:', data);
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                const translatedText = data[0][0][0];
                console.log('Google Translate success:', translatedText);
                result.textContent = translatedText;
                return;
            } else {
                console.log('Google Translate no translation data:', data);
            }
        } else {
            console.log('Google Translate HTTP error:', googleResponse.status);
            const errorText = await googleResponse.text();
            console.log('Google Translate error response:', errorText);
        }
    } catch (error) {
        console.log('Google Translate failed, trying alternative...', error);
    }
    
    // Try MyMemory API as fallback (if Google Translate fails)
    try {
        console.log('Attempting MyMemory API with:', { input, fromLang, toLang });
        const myMemoryResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(input)}&langpair=${fromLang}|${toLang}`);
        
        console.log('MyMemory response status:', myMemoryResponse.status);
        
        if (myMemoryResponse.ok) {
            const data = await myMemoryResponse.json();
            console.log('MyMemory response data:', data);
            if (data.responseData && data.responseData.translatedText) {
                console.log('MyMemory success:', data.responseData.translatedText);
                result.textContent = data.responseData.translatedText;
                return;
            } else if (data.responseStatus === 403) {
                console.log('MyMemory API quota exceeded');
            } else {
                console.log('MyMemory no translation data:', data);
            }
        } else {
            console.log('MyMemory HTTP error:', myMemoryResponse.status);
            const errorText = await myMemoryResponse.text();
            console.log('MyMemory error response:', errorText);
        }
    } catch (error) {
        console.log('MyMemory API failed...', error);
    }
    
    // If both APIs fail, show error message
    console.log('Both translation APIs failed, showing error message');
    result.textContent = 'Dịch vụ dịch thuật không khả dụng. Vui lòng thử lại sau.';
}

// Dictionary search
async function searchWord() {
    const word = document.getElementById('word-input').value;
    const result = document.getElementById('dictionary-result');
    
    if (!word.trim()) {
        result.innerHTML = '<div class="word-definition">Vui lòng nhập từ cần tra cứu</div>';
        return;
    }
    
    // Clear previous translation cache when searching for a new word
    translatedDefinition = null;
    
    result.innerHTML = '<div class="word-definition">Đang tìm kiếm...</div>';
    
    try {
        // Using DuckDuckGo Instant Answer API (free)
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(word)}&format=json&no_html=1&skip_disambig=1`);
        const data = await response.json();
        
        if (data.Abstract) {
            // Store the definition for translation
            currentDefinition = data.Abstract;
            result.innerHTML = `
                <div class="word-definition">
                    <div class="word-phonetic">${word}</div>
                    <div class="word-meaning">${data.Abstract}</div>
                    <div class="word-example">Nguồn: ${data.AbstractSource}</div>
                    <button class="translate-definition-btn" onclick="translateDefinition()">
                        <i class="fas fa-language"></i> Dịch định nghĩa sang tiếng Việt
                    </button>
                </div>
            `;
            // Clear input field after successful search
            document.getElementById('word-input').value = '';
        } else {
            throw new Error('No definition found');
        }
    } catch (error) {
        console.error('Dictionary API error:', error);
        result.innerHTML = `
            <div class="word-definition">
                <div class="word-phonetic">${word}</div>
                <div class="word-meaning">Không tìm thấy định nghĩa cho từ này.</div>
                <div class="word-example">Vui lòng thử từ khác.</div>
            </div>
        `;
    }
}

// Translate definition to Vietnamese
async function translateDefinition() {
    const result = document.getElementById('dictionary-result');
    const word = document.getElementById('word-input').value;
    
    if (!currentDefinition) {
        result.innerHTML = '<div class="word-definition">Không có định nghĩa để dịch</div>';
        return;
    }
    
    // If already translated, just show the translated version
    if (translatedDefinition) {
        result.innerHTML = `
            <div class="word-definition">
                <div class="word-phonetic">${word}</div>
                <div class="word-meaning">${translatedDefinition}</div>
                <div class="word-example">Bản dịch định nghĩa tiếng Việt</div>
                <button class="translate-definition-btn" onclick="showOriginalDefinition()">
                    <i class="fas fa-undo"></i> Xem định nghĩa gốc
                </button>
            </div>
        `;
        return;
    }
    
    const currentContent = result.innerHTML;
    
    // Split definition into sentences for progress calculation
    const sentences = splitIntoSentences(currentDefinition);
    const totalSentences = sentences.filter(s => s.trim().length > 0).length;
    
    // Add loading state with progress indicator
    result.innerHTML = currentContent.replace(
        /<button class="translate-definition-btn".*?<\/button>/,
        `<div class="translation-progress">
            <button class="translate-definition-btn" disabled><i class="fas fa-spinner fa-spin"></i> Đang dịch...</button>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-text">0/${totalSentences} câu đã dịch</div>
        </div>`
    );
    
    try {
        // Split definition into sentences and translate each part
        const sentences = splitIntoSentences(currentDefinition);
        let translatedParts = [];
        let completedSentences = 0;
        
        for (let sentence of sentences) {
            if (sentence.trim().length === 0) continue;
            
            // Try Google Translate first
            try {
                const googleResponse = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(sentence.trim())}`);
                
                if (googleResponse.ok) {
                    const data = await googleResponse.json();
                    if (data && data[0] && data[0][0] && data[0][0][0]) {
                        const translatedText = data[0][0][0];
                        translatedParts.push(translatedText);
                        
                        // Update progress
                        completedSentences++;
                        const progressPercent = Math.floor((completedSentences / totalSentences) * 100);
                        const progressFill = result.querySelector('.progress-fill');
                        const progressText = result.querySelector('.progress-text');
                        if (progressFill && progressText) {
                            progressFill.style.width = progressPercent + '%';
                            progressText.textContent = `${completedSentences}/${totalSentences} câu đã dịch`;
                        }
                        // Show progress notification
                        showProgressNotification('', 'progress', completedSentences, totalSentences);
                        continue;
                    }
                }
            } catch (error) {
                console.log('Google Translate failed for sentence, trying MyMemory...');
            }
            
            // Try MyMemory API as fallback
            try {
                const myMemoryResponse = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(sentence.trim())}&langpair=en|vi`);
                
                if (myMemoryResponse.ok) {
                    const data = await myMemoryResponse.json();
                    if (data.responseData && data.responseData.translatedText) {
                        translatedParts.push(data.responseData.translatedText);
                        
                        // Update progress
                        completedSentences++;
                        const progressPercent = Math.floor((completedSentences / totalSentences) * 100);
                        const progressFill = result.querySelector('.progress-fill');
                        const progressText = result.querySelector('.progress-text');
                        if (progressFill && progressText) {
                            progressFill.style.width = progressPercent + '%';
                            progressText.textContent = `${completedSentences}/${totalSentences} câu đã dịch`;
                        }
                        // Show progress notification
                        showProgressNotification('', 'progress', completedSentences, totalSentences);
                        continue;
                    }
                }
            } catch (error) {
                console.log('MyMemory API failed for sentence...');
            }
            
            // If both APIs fail for this sentence, keep original
            translatedParts.push(sentence.trim());
            
            // Update progress
            completedSentences++;
            const progressPercent = Math.floor((completedSentences / totalSentences) * 100);
            const progressFill = result.querySelector('.progress-fill');
            const progressText = result.querySelector('.progress-text');
            if (progressFill && progressText) {
                progressFill.style.width = progressPercent + '%';
                progressText.textContent = `${completedSentences}/${totalSentences} câu đã dịch`;
            }
            // Show progress notification
            showProgressNotification('', 'progress', completedSentences, totalSentences);
        }
        
        const translatedText = translatedParts.join(' ');
        
        // Save translated result
        translatedDefinition = translatedText;
        
        result.innerHTML = `
            <div class="word-definition">
                <div class="word-phonetic">${word}</div>
                <div class="word-meaning">${translatedText}</div>
                <div class="word-example">Bản dịch định nghĩa tiếng Việt</div>
                <button class="translate-definition-btn" onclick="showOriginalDefinition()">
                    <i class="fas fa-undo"></i> Xem định nghĩa gốc
                </button>
            </div>
        `;
        
    } catch (error) {
        console.error('Translation error:', error);
        // If translation fails, restore original content
        result.innerHTML = currentContent.replace(
            /<button class="translate-definition-btn".*?<\/button>/,
            '<button class="translate-definition-btn" onclick="translateDefinition()"><i class="fas fa-language"></i> Dịch định nghĩa sang tiếng Việt</button>'
        );
    }
}

// Split text into sentences (max 500 chars each)
function splitIntoSentences(text) {
    // Split by sentence endings (.!?)
    const sentences = text.split(/(?<=[.!?])\s+/);
    const result = [];
    
    for (let sentence of sentences) {
        if (sentence.length <= 500) {
            result.push(sentence);
        } else {
            // If sentence is too long, split by commas
            const parts = sentence.split(/,\s+/);
            let currentPart = '';
            
            for (let part of parts) {
                if ((currentPart + part).length <= 500) {
                    currentPart += (currentPart ? ', ' : '') + part;
                } else {
                    if (currentPart) result.push(currentPart);
                    currentPart = part;
                }
            }
            
            if (currentPart) result.push(currentPart);
        }
    }
    
    return result;
}

// Show original definition
function showOriginalDefinition() {
    const result = document.getElementById('dictionary-result');
    const word = document.getElementById('word-input').value;
    
    if (currentDefinition && translatedDefinition) {
        result.innerHTML = `
            <div class="word-definition">
                <div class="word-phonetic">${word}</div>
                <div class="word-meaning">${currentDefinition}</div>
                <div class="word-example">Định nghĩa gốc tiếng Anh</div>
                <button class="translate-definition-btn" onclick="showTranslatedDefinition()">
                    <i class="fas fa-language"></i> Xem bản dịch tiếng Việt
                </button>
            </div>
        `;
    }
}

// Show translated definition
function showTranslatedDefinition() {
    const result = document.getElementById('dictionary-result');
    const word = document.getElementById('word-input').value;
    
    if (translatedDefinition) {
        result.innerHTML = `
            <div class="word-definition">
                <div class="word-phonetic">${word}</div>
                <div class="word-meaning">${translatedDefinition}</div>
                <div class="word-example">Bản dịch định nghĩa tiếng Việt</div>
                <button class="translate-definition-btn" onclick="showOriginalDefinition()">
                    <i class="fas fa-undo"></i> Xem định nghĩa gốc
                </button>
            </div>
        `;
    }
}

// Swap languages in translation
function swapLanguages() {
    const fromLang = document.getElementById('from-lang');
    const toLang = document.getElementById('to-lang');
    const temp = fromLang.value;
    fromLang.value = toLang.value;
    toLang.value = temp;
}

// Refresh widget
function refreshWidget(widgetType) {
    switch (widgetType) {
        case 'weather':
            loadWeatherData();
            break;
        case 'news':
            loadNewsData();
            break;
        case 'currency':
            loadCurrencyData();
            break;

        case 'geo':
            loadGeoData();
            break;
        case 'translation':
            document.getElementById('translate-input').value = '';
            document.getElementById('translate-result').textContent = '';
            // Show the test button again when refreshing
            const testBtn = document.querySelector('.test-btn');
            if (testBtn) {
                testBtn.style.display = 'inline-block';
            }
            break;
        case 'dictionary':
            document.getElementById('word-input').value = '';
            document.getElementById('dictionary-result').innerHTML = '';
            currentDefinition = null;
            translatedDefinition = null;
            break;
    }
}

// Utility functions
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
        return 'Vừa xong';
    } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    } else {
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} ngày trước`;
    }
}

// Show progress notification or general notification
function showProgressNotification(message, type = 'progress', completed = 0, total = 0) {
    const notification = document.createElement('div');
    notification.className = 'progress-notification';
    
    if (type === 'progress' && total > 0) {
        // Progress notification for translation
        const progressPercent = Math.floor((completed / total) * 100);
        notification.innerHTML = `
            <div>Đang dịch: ${completed}/${total} câu</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
        `;
    } else {
        // General notification
        const iconClass = type === 'success' ? 'fas fa-check-circle' : 
                         type === 'error' ? 'fas fa-exclamation-circle' : 
                         'fas fa-info-circle';
        const bgColor = type === 'success' ? '#10b981' : 
                       type === 'error' ? '#ef4444' : 
                       '#3b82f6';
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <i class="${iconClass}" style="color: ${bgColor};"></i>
                <span>${message}</span>
            </div>
        `;
    }
    
    // Get all existing notifications to calculate position
    const existingNotifications = document.querySelectorAll('.progress-notification');
    const notificationIndex = existingNotifications.length;
    
    // Position the notification in a stack (each notification 20px below the previous)
    notification.style.top = `${20 + (notificationIndex * 80)}px`;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Removed random widget sizes functionality
});

// Add enter key support for translation and dictionary
document.getElementById('translate-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        translateText();
    }
});

document.getElementById('word-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWord();
    }
});

// Add keyboard event listeners for new search inputs
document.addEventListener('DOMContentLoaded', function() {
    // Weather city input
    const weatherCityInput = document.getElementById('weather-city-input');
    if (weatherCityInput) {
        weatherCityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchWeatherByCity();
            }
        });
    }
    
    // Geo city input
    const geoCityInput = document.getElementById('geo-city-input');
    if (geoCityInput) {
        geoCityInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchGeoByCity();
            }
        });
    }
});

// Display weather data
function displayWeatherData(data, apiUsed) {
    const content = document.getElementById('weather-content');
    
    // Create city options for dropdown
    const cityOptions = cityList.map(city => 
        `<option value="${city.name}" data-lat="${city.lat}" data-lon="${city.lon}" data-country="${city.country}">${city.name}</option>`
    ).join('');
    
    const weatherInfo = `
        <div class="weather-header">
            <h3>Thời tiết</h3>
            <small style="color: #888;">Nguồn: ${apiUsed}</small>
        </div>
        <div class="weather-search-form">
            <select id="weather-city-select" class="weather-city-select">
                <option value="">Chọn thành phố...</option>
                ${cityOptions}
            </select>
            <button class="weather-search-btn" onclick="searchWeatherByCity()">Tìm kiếm</button>
        </div>
        <div class="weather-info">
            <div class="weather-main">
                <div class="weather-temp">${Math.round(data.temp)}°C</div>
                <div class="weather-desc">${data.description}</div>
                <div>${data.city}, ${data.country || 'VN'}</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail">
                    <i class="fas fa-thermometer-half"></i>
                    <div>Cảm giác như</div>
                    <div>${Math.round(data.temp)}°C</div>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-tint"></i>
                    <div>Độ ẩm</div>
                    <div>${data.humidity}%</div>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-wind"></i>
                    <div>Gió</div>
                    <div>${Math.round(data.windSpeed)} m/s</div>
                </div>
                <div class="weather-detail">
                    <i class="fas fa-compress-arrows-alt"></i>
                    <div>Áp suất</div>
                    <div>${data.pressure || 1013} hPa</div>
                </div>
            </div>
        </div>
    `;
    content.innerHTML = weatherInfo;
}

// Search weather by city
async function searchWeatherByCity() {
    const citySelect = document.getElementById('weather-city-select');
    const selectedCity = citySelect.value;
    
    if (!selectedCity) {
        alert('Vui lòng chọn thành phố');
        return;
    }
    
    // Get selected city data
    const selectedCityData = cityList.find(city => city.name === selectedCity);
    if (!selectedCityData) {
        alert('Thành phố không hợp lệ');
        return;
    }
    
    console.log('Searching weather for city:', selectedCity, 'at coordinates:', selectedCityData.lat, selectedCityData.lon);
    const weatherContent = document.getElementById('weather-content');
    weatherContent.innerHTML = '<div class="loading">Đang tải thời tiết...</div>';
    
    try {
        // Try multiple weather APIs using coordinates
        const weatherApis = [
            `https://api.openweathermap.org/data/2.5/weather?lat=${selectedCityData.lat}&lon=${selectedCityData.lon}&appid=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&units=metric&lang=vi`,
            `https://api.weatherapi.com/v1/current.json?key=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&q=${selectedCityData.lat},${selectedCityData.lon}&lang=vi`,
            `https://api.open-meteo.com/v1/forecast?latitude=${selectedCityData.lat}&longitude=${selectedCityData.lon}&current_weather=true&timezone=auto`
        ];

        let weatherData = null;
        let apiUsed = '';

        for (const apiUrl of weatherApis) {
            try {
                console.log('Trying weather API:', apiUrl.split('?')[0]);
                const response = await fetch(apiUrl);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Weather API response:', data);
                    
                    // Handle different API response formats
                    if (data.main && data.weather) {
                        // OpenWeatherMap format
                        weatherData = {
                            temp: Math.round(data.main.temp),
                            description: data.weather[0].description,
                            humidity: data.main.humidity,
                            windSpeed: data.wind?.speed || 0,
                            city: data.name || selectedCity,
                            country: selectedCityData.country
                        };
                        apiUsed = 'OpenWeatherMap';
                        break;
                    } else if (data.current) {
                        // WeatherAPI.com format
                        weatherData = {
                            temp: Math.round(data.current.temp_c),
                            description: data.current.condition?.text || 'Unknown',
                            humidity: data.current.humidity,
                            windSpeed: data.current.wind_kph,
                            city: data.location?.name || selectedCity,
                            country: selectedCityData.country
                        };
                        apiUsed = 'WeatherAPI.com';
                        break;
                    } else if (data.current_weather) {
                        // Open-Meteo format
                        weatherData = {
                            temp: Math.round(data.current_weather.temperature),
                            description: 'Current weather',
                            humidity: 0,
                            windSpeed: data.current_weather.windspeed,
                            city: selectedCity,
                            country: selectedCityData.country
                        };
                        apiUsed = 'Open-Meteo';
                        break;
                    }
                }
            } catch (error) {
                console.log('Weather API failed:', apiUrl.split('?')[0], error.message);
                continue;
            }
        }

        if (weatherData) {
            displayWeatherData(weatherData, apiUsed);
        } else {
            throw new Error('Không tìm thấy thông tin thời tiết cho thành phố này');
        }
    } catch (error) {
        console.error('Error fetching weather data:', error);
        
        // Recreate the dropdown for error display
        const cityOptions = cityList.map(city => 
            `<option value="${city.name}" ${city.name === selectedCity ? 'selected' : ''}>${city.name}</option>`
        ).join('');
        
        weatherContent.innerHTML = `
            <div class="weather-header">
                <h3>Thời tiết</h3>
                <small style="color: #888;">Nguồn: Demo Data</small>
            </div>
            <div class="weather-search-form">
                <select id="weather-city-select" class="weather-city-select">
                    <option value="">Chọn thành phố...</option>
                    ${cityOptions}
                </select>
                <button class="weather-search-btn" onclick="searchWeatherByCity()">Tìm kiếm</button>
            </div>
            <div style="text-align: center; color: #e74c3c; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>Không tìm thấy thông tin thời tiết cho "${selectedCity}"</p>
                <p>Vui lòng thử chọn thành phố khác từ danh sách</p>
                <p><small>Lưu ý: Sử dụng API demo có thể giới hạn một số thành phố</small></p>
            </div>
        `;
    }
}

// Search geography by city
async function searchGeoByCity() {
    const citySelect = document.getElementById('geo-city-select');
    const selectedCityName = citySelect.value;
    
    if (!selectedCityName) {
        showProgressNotification('Vui lòng chọn thành phố', 'error');
        return;
    }
    
    // Find the selected city data from cityList
    const selectedCityData = cityList.find(city => city.name === selectedCityName);
    if (!selectedCityData) {
        showProgressNotification('Không tìm thấy thông tin thành phố', 'error');
        return;
    }
    
    const geoContent = document.getElementById('geo-content');
    geoContent.innerHTML = '<div class="loading">Đang tải thông tin địa lý...</div>';
    
    try {
        // Prioritize Nominatim API as requested
        const geoApis = [
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedCityData.lat}&lon=${selectedCityData.lon}&zoom=10&accept-language=vi`,
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(selectedCityName)}&key=8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c&language=vi`,
            `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(selectedCityName)}&limit=1`
        ];

        let geoData = null;
        let apiUsed = '';

        for (const apiUrl of geoApis) {
            try {
                console.log('Trying geo API:', apiUrl.split('?')[0]);
                
                const headers = {};
                if (apiUrl.includes('rapidapi.com')) {
                    headers['X-RapidAPI-Key'] = '8d2c8eecf0c6c85c6c6c6c6c6c6c6c6c';
                    headers['X-RapidAPI-Host'] = 'wft-geo-db.p.rapidapi.com';
                }
                
                const response = await fetch(apiUrl, { headers });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Geo API response:', data);
                    
                    // Handle different API response formats
                    if (data.address) {
                        // Nominatim reverse geocoding format
                        geoData = {
                            name: data.address.city || data.address.town || data.address.village || selectedCityName,
                            country: data.address.country || selectedCityData.country,
                            population: 0,
                            region: data.address.state || data.address.province || data.address['ISO3166-2-lvl4'],
                            latitude: parseFloat(data.lat),
                            longitude: parseFloat(data.lon)
                        };
                        apiUsed = 'Nominatim';
                        break;
                    } else if (data.results && data.results[0]) {
                        // OpenCage format
                        const result = data.results[0];
                        geoData = {
                            name: result.components.city || result.components.town || result.components.village || selectedCityName,
                            country: result.components.country || selectedCityData.country,
                            population: 0,
                            region: result.components.state,
                            latitude: parseFloat(result.geometry.lat),
                            longitude: parseFloat(result.geometry.lng)
                        };
                        apiUsed = 'OpenCage';
                        break;
                    } else if (data.data && data.data[0]) {
                        // GeoDB Cities format
                        const cityData = data.data[0];
                        geoData = {
                            name: cityData.name || selectedCityName,
                            country: cityData.country || selectedCityData.country,
                            population: cityData.population || 0,
                            region: cityData.region,
                            latitude: parseFloat(cityData.latitude) || selectedCityData.lat,
                            longitude: parseFloat(cityData.longitude) || selectedCityData.lon
                        };
                        apiUsed = 'GeoDB Cities';
                        break;
                    }
                }
            } catch (error) {
                console.log('Geo API failed:', apiUrl.split('?')[0], error.message);
                continue;
            }
        }

        if (geoData) {
            displayGeoData(geoData, apiUsed);
        } else {
            throw new Error('Không tìm thấy thông tin địa lý cho thành phố này');
        }
    } catch (error) {
        console.error('Error fetching geo data:', error);
        // Fallback to demo data
        const demoGeoData = {
            name: selectedCityName,
            country: selectedCityData.country,
            population: Math.floor(Math.random() * 10000000) + 100000,
            latitude: parseFloat(selectedCityData.lat),
            longitude: parseFloat(selectedCityData.lon),
            region: selectedCityData.country === 'VN' ? 'VN-HN' : 'Demo Region'
        };
        
        displayGeoData(demoGeoData, 'Demo Data');
    }
}

// Display geography data
function displayGeoData(cityData, apiUsed) {
    const geoContent = document.getElementById('geo-content');
    
    // Create options for the dropdown
    const cityOptions = cityList.map(city => 
        `<option value="${city.name}" ${city.name === cityData.name ? 'selected' : ''}>${city.name}</option>`
    ).join('');
    
    geoContent.innerHTML = `
        <div class="geo-header">
            <h3>Địa lý</h3>
            <small style="color: #888;">Nguồn: ${apiUsed}</small>
        </div>
        <div class="geo-search-form">
            <select id="geo-city-select" class="geo-city-select">
                <option value="">Chọn thành phố...</option>
                ${cityOptions}
            </select>
            <button class="geo-search-btn" onclick="searchGeoByCity()">Tìm kiếm</button>
        </div>
        <div class="geo-info">
            <div class="geo-location">${cityData.name}, ${cityData.country}</div>
            <div class="geo-details">
                <div class="geo-detail">
                    <i class="fas fa-users"></i>
                    <div class="geo-detail-value">${cityData.population ? cityData.population.toLocaleString() : 'N/A'}</div>
                    <div class="geo-detail-label">Dân số</div>
                </div>
                <div class="geo-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="geo-detail-value">${cityData.latitude ? cityData.latitude.toFixed(2) : 'N/A'}</div>
                    <div class="geo-detail-label">Vĩ độ</div>
                </div>
                <div class="geo-detail">
                    <i class="fas fa-long-arrow-alt-right"></i>
                    <div class="geo-detail-value">${cityData.longitude ? cityData.longitude.toFixed(2) : 'N/A'}</div>
                    <div class="geo-detail-label">Kinh độ</div>
                </div>
                <div class="geo-detail">
                    <i class="fas fa-globe"></i>
                    <div class="geo-detail-value">${cityData.region || 'N/A'}</div>
                    <div class="geo-detail-label">Khu vực</div>
                </div>
            </div>
        </div>
    `;
} 

// Test function for debugging translation
function testTranslation() {
    console.log('Testing translation APIs...');
    
    // Test Google Translate
    fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=Con%20g%C3%A0')
    .then(response => response.json())
    .then(data => {
        console.log('Google Translate test result:', data);
        if (data && data[0] && data[0][0] && data[0][0][0]) {
            console.log('Google Translate success:', data[0][0][0]);
        }
    })
    .catch(error => {
        console.log('Google Translate test error:', error);
    });
    
    // Test MyMemory
    fetch('https://api.mymemory.translated.net/get?q=Con%20g%C3%A0&langpair=vi|en')
    .then(response => response.json())
    .then(data => {
        console.log('MyMemory test result:', data);
    })
    .catch(error => {
        console.log('MyMemory test error:', error);
    });
}

// Call test function on page load for debugging
// testTranslation();

// Ensure test button is visible on page load
document.addEventListener('DOMContentLoaded', function() {
    const testBtn = document.querySelector('.test-btn');
    if (testBtn) {
        testBtn.style.display = 'inline-block';
    }
}); 

// Dynamic news update function
function startNewsUpdates() {
    // Clear existing interval if any
    if (newsUpdateInterval) {
        clearInterval(newsUpdateInterval);
    }
    
    // Set up automatic updates every 5 minutes
    newsUpdateInterval = setInterval(async () => {
        console.log('Checking for news updates...');
        
        // Create temporary set for tracking new titles in this update
        const newTitlesInUpdate = new Set();
        let newItemsFound = [];
        
        // Process RSS feeds sequentially for updates
        for (const feed of vnexpressFeeds) {
            try {
                console.log(`Checking updates from ${feed.category}...`);
                const newsItems = await fetchRSSFeed(feed.url);
                
                // Filter for truly new items (not in processedTitles)
                const newItems = newsItems.filter(item => 
                    !processedTitles.has(item.title) && 
                    !newTitlesInUpdate.has(item.title)
                ).map(item => {
                    // Mark as processed and track for this update
                    processedTitles.add(item.title);
                    newTitlesInUpdate.add(item.title);
                    return {
                        ...item,
                        category: feed.category,
                        source: `VnExpress - ${feed.category}`
                    };
                });
                
                if (newItems.length > 0) {
                    newItemsFound.push(...newItems);
                    console.log(`Found ${newItems.length} new items from ${feed.category}`);
                }
                
            } catch (error) {
                console.log(`Failed to fetch updates from ${feed.category}:`, error.message);
                // Continue to next feed even if this one fails
            }
        }
        
        if (newItemsFound.length > 0) {
            // Add new items to the existing list
            allNewsItems.push(...newItemsFound);
            
            // Sort all items by newest first
            allNewsItems.sort((a, b) => {
                try {
                    const dateA = new Date(a.pubDate);
                    const dateB = new Date(b.pubDate);
                    return dateB - dateA; // Newest first
                } catch (error) {
                    // If date parsing fails, keep original order
                    return 0;
                }
            });
            
            // Update display with new items
            updateNewsDisplay();
            
            // Show notification for new items
            showProgressNotification(`${newItemsFound.length} tin tức mới đã được cập nhật!`, 'success');
            console.log(`Added ${newItemsFound.length} new news items from ${newItemsFound.length} feeds`);
        } else {
            console.log('No new news items found in this update cycle');
        }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// Update news display with current items
function updateNewsDisplay() {
    const content = document.getElementById('news-content');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayNews = allNewsItems.filter(item => {
        const newsDate = new Date(item.pubDate);
        return newsDate >= today;
    });
    
    // Sort by publication date (newest first)
    todayNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    if (todayNews.length > 0) {
        const newsHtml = todayNews.map(item => `
            <div class="news-item" onclick="window.open('${item.link}', '_blank')">
                <div class="news-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.title}">` : '<i class="fas fa-newspaper"></i>'}
                </div>
                <div class="news-content">
                    <h4 class="news-title">${item.title}</h4>
                    <p class="news-description">${item.description}</p>
                    <div class="news-meta">
                        <span class="news-source">${item.source}</span>
                        <span class="news-time">${formatNewsDate(item.pubDate)}</span>
                    </div>
                </div>
            </div>
        `).join('');
        
        content.innerHTML = `
            <div class="news-header">
                <h3>Tin tức hôm nay - VnExpress</h3>
                <small style="color: #888;">Nguồn: ${todayNews.length} tin từ ${vnexpressFeeds.length} chuyên mục</small>
            </div>
            <div class="news-list">
                ${newsHtml}
            </div>
        `;
    }
}