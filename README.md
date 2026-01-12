# MetroSafe - London Crime Insights

A production-ready, local-first web application providing crime insights for Greater London using official police data and AI-powered safety analysis.

## Features

- 🔍 **Location Search** - Search any London location with autocomplete
- 🗺️ **Interactive Map** - Leaflet map with crime markers and clustering
- 📊 **Statistics Dashboard** - Charts showing crime categories and distribution
- 🤖 **AI Safety Briefing** - Gemini-powered safety analysis and recommendations
- 💾 **Offline Support** - Data persists in IndexedDB across sessions
- 🔒 **Privacy-First** - All data stays in your browser, no server required

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **State**: TanStack Query + Dexie.js (IndexedDB)
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **AI**: Google Gemini API

## Data Sources

- **Crime Data**: [data.police.uk](https://data.police.uk) (UK Police API)
- **Geocoding**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org)
- **AI Analysis**: [Google Gemini](https://ai.google.dev)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/metrosafe.git
cd metrosafe

# Install dependencies
npm install

# Start development server
npm run dev
```

### Adding Your Gemini API Key

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open the app and click the ⚙️ Settings icon
3. Paste your API key and click Save
4. Your key is stored locally in IndexedDB (never sent to any server)

## API Rate Limits

- **Police API**: 15 requests/second (handled automatically)
- **Nominatim**: 1 request/second with User-Agent header
- **Gemini**: Varies by plan (free tier has usage limits)

## License

MIT

## Disclaimer

This application uses publicly available crime data for informational purposes only. Crime statistics do not guarantee safety or predict future incidents. Always exercise personal judgment and awareness.
