import React, { useState, useEffect } from 'react';
import { 
  Plane, Hotel, Compass, Calendar, MapPin, 
  Plus, LogOut, ArrowRight, ShieldAlert, BarChart3, 
  Map as MapIcon, Sparkles, Clock, AlertCircle, Sun, DollarSign,
  Utensils, Camera, Mountain, Heart, Layers, ListFilter,
  Coins, RefreshCw, Moon, Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const API_BASE = 'http://localhost:8000';

const CURRENCY_SYMBOLS = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AED: 'AED '
};

const getSymbol = (code) => CURRENCY_SYMBOLS[code] || '$';

// Custom Leaflet Marker Icon
const createCustomMarkerIcon = (dayNumber) => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #ec4899);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 800;
        font-size: 12px;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.9);
        border: 2px solid #ffffff;
      ">
        D${dayNumber}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Map Layer Tile Options
const MAP_TILE_PROVIDERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  light: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

// Component to auto-fit Leaflet bounds to pins
function MapRecenter({ mapPins }) {
  const map = useMap();
  useEffect(() => {
    if (mapPins && mapPins.length > 0) {
      const validPins = mapPins.filter(p => p.lat && p.lng);
      if (validPins.length > 0) {
        const bounds = validPins.map(p => [p.lat, p.lng]);
        map.fitBounds(bounds, { padding: [60, 60] });
      }
    }
  }, [mapPins, map]);
  return null;
}

// Direct Gemini LLM Hero Image URL getter without static fallbacks
const getHeroImageUrl = (selectedItinerary) => {
  if (!selectedItinerary || !selectedItinerary.result_json) return '';
  if (typeof selectedItinerary.result_json === 'object' && selectedItinerary.result_json.hero_image_url) {
    return selectedItinerary.result_json.hero_image_url;
  }
  return '';
};

// React Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080e1a', color: '#f8fafc', padding: '24px', textAlign: 'center' }}>
          <div style={{ padding: '20px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', marginBottom: '20px' }}>
            <AlertCircle size={48} color="#fb7185" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '400px', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button 
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            style={{ padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ec4899)', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <RefreshCw size={16} />
            <span>Reload Dashboard</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  // Auth States
  const [token, setToken] = useState(localStorage.getItem('travel_token') || '');
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('travel_username') || '');
  const [authView, setAuthView] = useState('login'); // login, register
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Itinerary Lists & Form States
  const [itineraries, setItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [view, setView] = useState('list'); // list, create, details
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, map
  const [mapLayer, setMapLayer] = useState('dark'); // 'dark', 'satellite', 'light'

  // Form Inputs
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(1000);
  const [style, setStyle] = useState('Adventure');
  const [currency, setCurrency] = useState('USD');

  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Load itineraries on auth
  useEffect(() => {
    if (token) {
      fetchItineraries();
    }
  }, [token]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const fetchItineraries = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/itineraries/list/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) handleLogout();
      const data = await res.json();
      setItineraries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch itineraries', err);
    }
  };

  // Auth Functions
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const endpoint = authView === 'login' ? '/api/token/' : '/api/itineraries/register/';
    const body = authView === 'login'
      ? { username: usernameInput, password: passwordInput }
      : { username: usernameInput, password: passwordInput, email: emailInput };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.error || 'Authentication failed');
      }

      if (authView === 'login') {
        localStorage.setItem('travel_token', data.access);
        localStorage.setItem('travel_username', usernameInput);
        setToken(data.access);
        setCurrentUser(usernameInput);
      } else {
        setAuthView('login');
        setErrorMsg('Registration successful! Please log in.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('travel_token');
    localStorage.removeItem('travel_username');
    setToken('');
    setCurrentUser('');
    setItineraries([]);
    setSelectedItinerary(null);
  };

  // Submit Itinerary Form
  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    if (!destination) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/itineraries/list/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ destination, days, budget, style, currency })
      });
      
      if (res.ok) {
        const newItin = await res.json();
        setItineraries(prev => [newItin, ...prev]);
        setSelectedItinerary(newItin);
        setView('details');
        setActiveTab('timeline');
        
        startPolling(newItin.id);
      }
    } catch (err) {
      console.error('Error creating itinerary', err);
    } finally {
      setIsSubmitting(false);
      setDestination('');
    }
  };

  // Poll Celery status
  const startPolling = (itinId) => {
    if (pollingInterval) clearInterval(pollingInterval);
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/itineraries/list/${itinId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          clearInterval(interval);
          setPollingInterval(null);
          setSelectedItinerary(data);
          fetchItineraries();
        } else {
          setSelectedItinerary(data);
        }
      } catch (err) {
        console.error('Polling error', err);
        clearInterval(interval);
      }
    }, 2000);

    setPollingInterval(interval);
  };

  const selectItinerary = (itin) => {
    setSelectedItinerary(itin);
    setView('details');
    setActiveTab('timeline');
    if (itin.status === 'PENDING' || itin.status === 'PROCESSING') {
      startPolling(itin.id);
    }
  };

  // Recharts Data Processing safely
  const getChartData = () => {
    if (!selectedItinerary || selectedItinerary.status !== 'COMPLETED') return [];
    
    const flight = parseFloat(selectedItinerary.flights_mock_price || 0) || 0;
    const hotel = parseFloat(selectedItinerary.hotels_mock_price || 0) || 0;
    const totalCost = parseFloat(selectedItinerary.total_estimated_cost || 0) || 0;
    const activity = Math.max(0, totalCost - (flight + hotel));
    const budgetVal = parseFloat(selectedItinerary.budget || 0) || 0;
    const remaining = Math.max(0, budgetVal - totalCost);

    return [
      { name: 'Flight Price', value: flight, color: '#38bdf8' },
      { name: 'Hotel Stays', value: hotel, color: '#818cf8' },
      { name: 'Activities/Meals', value: activity, color: '#ec4899' },
      { name: 'Remaining Cash', value: remaining, color: '#34d399' }
    ];
  };

  // Get Days Array safely from dict or array format
  const getDaysArray = () => {
    if (!selectedItinerary || !selectedItinerary.result_json) return [];
    if (Array.isArray(selectedItinerary.result_json)) return selectedItinerary.result_json;
    if (typeof selectedItinerary.result_json === 'object' && selectedItinerary.result_json !== null && selectedItinerary.result_json.days) {
      return selectedItinerary.result_json.days;
    }
    return [];
  };

  // Get Hero Banner Image URL directly from Gemini LLM without static fallbacks
  const getHeroImageUrl = () => {
    if (!selectedItinerary) return '';
    if (selectedItinerary.result_json && typeof selectedItinerary.result_json === 'object' && selectedItinerary.result_json.hero_image_url) {
      return selectedItinerary.result_json.hero_image_url;
    }
    return '';
  };

  // Flatten all activities for Map view safely
  const getAllActivities = () => {
    const daysArr = getDaysArray();
    const pins = [];
    
    daysArr.forEach((day, dIdx) => {
      day.activities?.forEach((act, aIdx) => {
        if (act.lat && act.lng) {
          pins.push({
            ...act,
            day: day.day,
            pinId: `${dIdx}-${aIdx}`
          });
        }
      });
    });

    return pins;
  };

  const chartData = getChartData();
  const daysList = getDaysArray();
  const mapPins = getAllActivities();
  const heroImage = getHeroImageUrl();
  const activeCurrencySymbol = getSymbol(selectedItinerary?.currency || 'USD');

  // Polyline positions for Leaflet route line
  const routePositions = mapPins.map(p => [p.lat, p.lng]);
  const defaultCenter = mapPins.length > 0 ? [mapPins[0].lat, mapPins[0].lng] : [19.0760, 72.8777];
  const activeTileProvider = MAP_TILE_PROVIDERS[mapLayer] || MAP_TILE_PROVIDERS.dark;

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div style={{ padding: '18px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.2))', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Compass size={40} color="#f59e0b" />
            </div>
          </div>
          <h2 className="auth-title">
            {authView === 'login' ? 'Aether Travel Agent' : 'Create Account'}
          </h2>
          <p className="auth-subtitle">
            {authView === 'login' ? 'Sign in to generate AI-powered travel itineraries' : 'Sign up to build custom trips'}
          </p>

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input 
                type="text" 
                required
                className="form-input"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="rushikesh"
              />
            </div>

            {authView === 'register' && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email"
                  required
                  className="form-input"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="name@domain.com"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                required
                className="form-input"
                value={passwordInput}
                onChange={e => setPasswordInput(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {errorMsg && (
              <div className="error-banner">
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn-primary">
              <span>{authView === 'login' ? 'Explore Journeys' : 'Register'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
            {authView === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setAuthView(authView === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
              style={{ background: 'none', border: 'none', color: '#f59e0b', fontWeight: 700, cursor: 'pointer' }}
            >
              {authView === 'login' ? 'Register' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="user-badge">
            <div className="avatar-circle">
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#f8fafc' }}>{currentUser}</div>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>AI Travel Agent</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '8px' }} title="Log Out">
            <LogOut size={18} />
          </button>
        </div>

        <button onClick={() => { setView('create'); setSelectedItinerary(null); }} className="btn-plan-new">
          <Plus size={18} />
          <span>Plan New Trip</span>
        </button>

        <div style={{ padding: '8px 20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>
          My Destinations
        </div>

        <div className="itinerary-list">
          {itineraries.map(itin => (
            <button
              key={itin.id}
              onClick={() => selectItinerary(itin)}
              className={`itinerary-item ${selectedItinerary?.id === itin.id ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc' }}>{itin.destination}</span>
                <span className={`status-badge ${itin.status.toLowerCase()}`}>{itin.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>{itin.days} Days</span>
                <span style={{ fontWeight: 800, color: '#f59e0b' }}>
                  {getSymbol(itin.currency || 'USD')}{parseFloat(itin.budget).toLocaleString()}
                </span>
              </div>
            </button>
          ))}
          {itineraries.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              No itineraries generated yet.
            </div>
          )}
        </div>
      </div>

      {/* MAIN DISPLAY */}
      <div className="main-window">
        
        {/* CREATE TRIP FORM */}
        {view === 'create' && (
          <div className="create-form-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
              <Sparkles size={18} />
              <span>AI Travel Concierge</span>
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#f8fafc', marginBottom: '16px' }}>
              Where do you want to travel?
            </h2>

            {/* Quick Presets */}
            <div className="preset-chip-grid">
              {[
                { name: 'Nashik, India', emoji: '🍷' },
                { name: 'Kyoto, Japan', emoji: '🌸' },
                { name: 'Mumbai, India', emoji: '🏛️' },
                { name: 'Paris, France', emoji: '🏰' },
                { name: 'Bali, Indonesia', emoji: '🏝️' }
              ].map(preset => (
                <button 
                  key={preset.name}
                  type="button"
                  onClick={() => setDestination(preset.name)}
                  className="preset-chip"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateItinerary}>
              <div className="form-group">
                <label className="form-label">Destination City / Country</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} color="#f59e0b" style={{ position: 'absolute', left: '16px', top: '15px' }} />
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Nashik, Mumbai, Kyoto, Paris"
                    className="form-input"
                    style={{ paddingLeft: '48px' }}
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Duration (Days)</label>
                  <input 
                    type="number"
                    min="1"
                    max="10"
                    required
                    className="form-input"
                    value={days}
                    onChange={e => setDays(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Currency Option</label>
                  <select 
                    className="form-input"
                    style={{ background: 'rgba(8, 14, 26, 0.9)', cursor: 'pointer' }}
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="AED">AED (AED)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Budget ({getSymbol(currency)})</label>
                  <input 
                    type="number"
                    min="100"
                    max="5000000"
                    required
                    className="form-input"
                    value={budget}
                    onChange={e => setBudget(parseFloat(e.target.value) || 100)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Travel Style</label>
                <div className="style-grid">
                  {['Adventure', 'Relaxed', 'Historical', 'Culinary'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setStyle(opt)}
                      className={`style-btn ${style === opt ? 'active' : ''}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ marginTop: '28px' }}>
                <Compass size={20} />
                <span>{isSubmitting ? 'Queueing Celery Task...' : 'Generate Itinerary with AI'}</span>
              </button>
            </form>
          </div>
        )}

        {/* DETAILS VIEW WITH HERO BANNER & MAP TABS */}
        {view === 'details' && selectedItinerary && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* VIBRANT HERO BANNER */}
            <div 
              className="hero-banner"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="hero-overlay" />
              <div className="hero-content">
                <div className="hero-title-group">
                  <h1>{selectedItinerary.destination}</h1>
                  <div className="hero-chips">
                    <div className="hero-chip">
                      <Calendar size={14} color="#f59e0b" />
                      <span>{selectedItinerary.days} Days Trip</span>
                    </div>
                    <div className="hero-chip">
                      <Compass size={14} color="#38bdf8" />
                      <span>{selectedItinerary.style} Style</span>
                    </div>
                    <div className="hero-chip">
                      <Coins size={14} color="#34d399" />
                      <span>{selectedItinerary.currency || 'USD'} Currency</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px 20px', borderRadius: '16px', textAlignment: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Total Budget</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#f59e0b' }}>
                    {activeCurrencySymbol}{parseFloat(selectedItinerary.budget).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SWITCHER BAR */}
            {selectedItinerary.status === 'COMPLETED' && (
              <div className="view-tabs-bar">
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                  >
                    <ListFilter size={16} />
                    <span>Day-by-Day Timeline</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('map')}
                    className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`}
                  >
                    <MapIcon size={16} />
                    <span>Interactive OpenStreetMap Route ({mapPins.length} Geocoordinates)</span>
                  </button>
                </div>

                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                  {activeTab === 'timeline' ? 'Showing activity itinerary' : 'Live OpenStreetMap coordinates path'}
                </span>
              </div>
            )}

            {/* STATUS POLLING COVER */}
            {(selectedItinerary.status === 'PENDING' || selectedItinerary.status === 'PROCESSING') ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', padding: '32px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(236, 72, 153, 0.2))', border: '2px solid rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Compass size={40} color="#f59e0b" style={{ animation: 'spin 8s linear infinite' }} />
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: 900, color: '#f8fafc', marginBottom: '8px' }}>Crafting Your Travel Experience</h3>
                <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '420px', marginBottom: '18px' }}>
                  Celery background task active. AI Engine is curating your day-by-day activities, pricing ({selectedItinerary.currency}), and maps...
                </p>
                <div style={{ background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.35)', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', color: '#fbbf24', fontWeight: 800 }}>
                  Status: {selectedItinerary.status} (Task {selectedItinerary.task_id?.substring(0, 8)})
                </div>
              </div>
            ) : activeTab === 'timeline' ? (
              /* TIMELINE & COST SPLIT */
              <div className="details-split-container">
                {/* TIMELINE */}
                <div className="details-timeline">
                  {daysList.map((day, dIdx) => (
                    <div key={dIdx} className="timeline-day">
                      <div className="timeline-dot" />
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc' }}>
                        Day {day.day}: {day.theme}
                      </h3>

                      <div>
                        {day.activities?.map((act, aIdx) => (
                          <div key={aIdx} className="activity-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px' }}>
                                  {act.time}
                                </span>
                              </div>
                              <span className="price-pill">
                                {parseFloat(act.cost) === 0 ? 'Free Activity' : `${activeCurrencySymbol}${parseFloat(act.cost).toLocaleString()}`}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginTop: '10px' }}>{act.title}</h4>
                            <p style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.6 }}>{act.description}</p>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} color="#ec4899" />
                              <span>{act.location} {act.lat && act.lng ? `(${act.lat}, ${act.lng})` : ''}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* METRICS & BUDGET CHART */}
                <div className="details-metrics">
                  <div>
                    <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em', marginBottom: '14px' }}>
                      Price Estimates ({selectedItinerary.currency || 'USD'})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="metric-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 800 }}>
                          <Plane size={14} />
                          <span>Flight Est.</span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#38bdf8', marginTop: '6px' }}>
                          {activeCurrencySymbol}{parseFloat(selectedItinerary.flights_mock_price || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="metric-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#818cf8', textTransform: 'uppercase', fontWeight: 800 }}>
                          <Hotel size={14} />
                          <span>Hotel Est.</span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#818cf8', marginTop: '6px' }}>
                          {activeCurrencySymbol}{parseFloat(selectedItinerary.hotels_mock_price || 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
                      Budget Breakdown ({selectedItinerary.currency || 'USD'})
                    </h4>
                    <div style={{ height: '200px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* REAL OPENSTREETMAP LEAFLET MAP VIEW WITH MULTI-LAYER & BEAUTIFUL POPUPS */
              <div className="map-canvas-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                
                {/* FLOATING MAP LAYER CONTROLS */}
                <div className="map-controls-panel">
                  <button 
                    onClick={() => setMapLayer('dark')}
                    className={`layer-btn ${mapLayer === 'dark' ? 'active' : ''}`}
                    title="Dark Mode Map"
                  >
                    <Moon size={14} />
                    <span>Dark</span>
                  </button>
                  <button 
                    onClick={() => setMapLayer('satellite')}
                    className={`layer-btn ${mapLayer === 'satellite' ? 'active' : ''}`}
                    title="Satellite Imagery"
                  >
                    <Eye size={14} />
                    <span>Satellite</span>
                  </button>
                  <button 
                    onClick={() => setMapLayer('light')}
                    className={`layer-btn ${mapLayer === 'light' ? 'active' : ''}`}
                    title="Light Mode Map"
                  >
                    <Sun size={14} />
                    <span>Light</span>
                  </button>
                </div>

                <MapContainer 
                  center={defaultCenter} 
                  zoom={12} 
                  style={{ width: '100%', height: '100%', background: '#080e1a' }}
                >
                  {/* Dynamic Tile Layer (Dark, Satellite, Light) */}
                  <TileLayer
                    key={mapLayer}
                    attribution={activeTileProvider.attribution}
                    url={activeTileProvider.url}
                  />

                  <MapRecenter mapPins={mapPins} />

                  {/* Route Polyline connecting real lat/lng */}
                  {routePositions.length > 1 && (
                    <Polyline 
                      positions={routePositions} 
                      color="#f59e0b" 
                      weight={4} 
                      opacity={0.85} 
                      dashArray="8, 8"
                    />
                  )}

                  {/* Geographic Markers with Beautiful Popup Cards */}
                  {mapPins.map(pin => (
                    <Marker 
                      key={pin.pinId} 
                      position={[pin.lat, pin.lng]} 
                      icon={createCustomMarkerIcon(pin.day)}
                    >
                      <Popup>
                        <div>
                          <img 
                            src={pin.image_url || heroImage} 
                            alt={pin.title} 
                            className="popup-card-image"
                            onError={(e) => { e.target.src = heroImage; }}
                          />
                          <div className="popup-card-body">
                            <span className="popup-day-pill">
                              Day {pin.day} • {pin.time}
                            </span>
                            <div className="popup-title">{pin.title}</div>
                            <div className="popup-desc">{pin.description}</div>
                            <div className="popup-footer">
                              <span style={{ color: '#ec4899', fontWeight: 700 }}>
                                📍 {pin.location}
                              </span>
                              <span style={{ color: '#34d399', fontWeight: 800, background: 'rgba(16,185,129,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                                {parseFloat(pin.cost) === 0 ? 'Free' : `${activeCurrencySymbol}${parseFloat(pin.cost).toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>
        )}

        {view === 'list' && !selectedItinerary && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyCenter: 'center', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
            <Compass size={56} color="#334155" style={{ marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>Ready to Explore the World?</h3>
            <p style={{ fontSize: '14px', maxWidth: '380px', marginBottom: '24px' }}>Select an itinerary from the left sidebar or click "Plan New Trip" to start.</p>
            <button onClick={() => setView('create')} className="btn-plan-new" style={{ width: 'auto', padding: '12px 24px' }}>
              Plan New Trip
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
