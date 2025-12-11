import React, { useState, useCallback, useMemo } from 'react';

// --- API Configuration ---
// !!! IMPORTANT: The key provided here ('1b051b5639028a9ce14c73f49b15a912') is assumed to be YOUR valid key.
// If the error persists, the key may not be active yet (can take 1-2 hours).
const API_KEY = '1b051b5639028a9ce14c73f49b15a912'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// --- Icons (using inline SVG for simplicity) ---

// Weather condition icons
const SunIcon = () => (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>);
const CloudIcon = () => (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>);
const RainIcon = () => (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v4m0 0l-2-2m2 2l2-2m-2-12v4m0 0l-2 2m2-2l2 2m-2 4v4m0 0l-2-2m2 2l2-2M7 16a4 4 0 01-4-4 4 4 0 014-4h9a5 5 0 0110 0v1a5 5 0 01-5 5h-7a4 4 0 01-4-4z"></path></svg>);
const DefaultIcon = () => (<svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>);

// Other icons
const SearchIcon = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>);
const LocationIcon = () => (<svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>);

// --- Helper Components from Demo (Adapted) ---

const Title = ({ children }) => (
    <h1 className="title-style">
        {children}
    </h1>
);

// Custom Modal (same structure as demo)
const MessageModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title">Error</h3>
                    <button className="modal-close" onClick={onClose}><SunIcon /></button>
                </div>
                <p className="modal-body">{message}</p>
                <div className="modal-footer">
                    <button onClick={onClose} className="button-base button-primary w-auto px-6 py-2">
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Weather Component Logic ---

const Weather = () => {
    const [city, setCity] = useState('');
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);

    // Determines which icon to display based on OpenWeatherMap icon code
    const getWeatherIcon = useCallback((iconCode) => {
        if (!iconCode) return <DefaultIcon />;
        const prefix = iconCode.substring(0, 2);
        
        switch (prefix) {
            case '01': // Clear
            case '02': // Few Clouds (Day/Night)
                return <SunIcon />;
            case '03': // Scattered Clouds
            case '04': // Broken Clouds
            case '50': // Mist
                return <CloudIcon />;
            case '09': // Shower Rain
            case '10': // Rain
            case '11': // Thunderstorm
                return <RainIcon />;
            default:
                return <DefaultIcon />;
        }
    }, []);

    // Memoized weather display values (converted from Kelvin to Celsius/Fahrenheit)
    const displayWeather = useMemo(() => {
        // Added safety check for the key data structures
        if (!weatherData || !weatherData.main || !weatherData.weather || weatherData.weather.length === 0) return null;

        const tempK = weatherData.main.temp;
        const tempC = (tempK - 273.15).toFixed(1);
        const tempF = ((tempK - 273.15) * 9/5 + 32).toFixed(1);
        
        return {
            city: weatherData.name,
            country: weatherData.sys.country,
            tempC: tempC,
            tempF: tempF,
            condition: weatherData.weather[0].description.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            iconCode: weatherData.weather[0].icon,
        };
    }, [weatherData]);

    // Fetch Weather Function
    const fetchWeather = useCallback(async (searchCity) => {
        // Check if city name is missing 
        if (!searchCity) {
            setModalMessage("Please enter a city name to search for the weather.");
            return;
        }
        // Added check for API key length to catch cases where the placeholder is still used
        if (API_KEY.length < 32) {
            setModalMessage("Error: The OpenWeatherMap API key is missing or invalid. Please ensure it is correctly set.");
            return;
        }

        setLoading(true);
        setWeatherData(null);
        
        try {
            const url = `${BASE_URL}?q=${searchCity}&appid=${API_KEY}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod === 200) {
                setWeatherData(data);
            } else if (data.cod === 401) {
                // Specific error for unauthorized key (key not active or wrong)
                setModalMessage("API Key Error (401): The key is either invalid or not yet activated by OpenWeatherMap. Please wait 1-2 hours after generating it.");
            } else {
                // Display error from API (e.g., city not found)
                setModalMessage(data.message || `Could not find weather for "${searchCity}". Please check the spelling.`);
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setModalMessage("An unexpected error occurred while fetching data. Check your network connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle Form Submission
    const handleSearch = (e) => {
        e.preventDefault();
        fetchWeather(city);
    };

    return (
        <div className="weather-container">
            <Title>SkyLine</Title> {/* Catchy name for the weather app */}

            {/* --- Search Bar for User Input --- */}
            <form onSubmit={handleSearch} className="search-bar-grid mb-8">
                <input 
                    type="text" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name (e.g., London, Tokyo)"
                    className="input-field search-input"
                    maxLength="50"
                    required
                />
                <button 
                    type="submit" 
                    className="button-base button-primary search-button"
                    disabled={loading}
                >
                    {loading ? (
                        <span className="spinner"></span> 
                    ) : (
                        <><SearchIcon /> Search</>
                    )}
                </button>
            </form>

            {/* --- Weather Display Area --- */}
            <div className="content-area">
                {loading && <p className="loading-message">Loading weather data...</p>}

                {!loading && displayWeather && (
                    <div className="weather-display-card">
                        <div className="location-header">
                            <LocationIcon />
                            <h2 className="location-name">{displayWeather.city}, {displayWeather.country}</h2>
                        </div>
                        
                        <div className="weather-details-grid">
                            {/* Icon & Condition */}
                            <div className="icon-condition-box">
                                <div className="weather-icon">
                                    {getWeatherIcon(displayWeather.iconCode)}
                                </div>
                                <p className="condition-text">{displayWeather.condition}</p>
                            </div>

                            {/* Temperature */}
                            <div className="temp-box">
                                <p className="temperature-large">{displayWeather.tempC}°C</p>
                                <p className="temperature-small">({displayWeather.tempF}°F)</p>
                            </div>
                        </div>

                        <div className="info-footer">
                            <p>Data provided by OpenWeatherMap.</p>
                            <p>Last updated: {new Date().toLocaleTimeString()}</p>
                        </div>
                    </div>
                )}
                
                {!loading && !displayWeather && (
                    <div className="weather-placeholder">
                        <DefaultIcon />
                        <p>Search for a city to see the current weather.</p>
                    </div>
                )}
            </div>
            
            {/* Custom Alert Modal */}
            <MessageModal message={modalMessage} onClose={() => setModalMessage(null)} />
        </div>
    );
}

export default Weather;