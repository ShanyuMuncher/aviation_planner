import {useState} from 'react'
import WeightBalance from './WeightBalance.jsx'
import './App.css'

async function getMetar(airport) {
    const response = await fetch(`/weather/api/data/metar?ids=${encodeURIComponent(airport)}&format=raw`)
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    if (response.status === 204) return ''
    return response.text()
}

export default function App() {
    const [tab, setTab] = useState('balance')
    const [airport, setAirport] = useState('CYVR')
    const [metar, setMetar] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searched, setSearched] = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        setLoading(true);
        setError('');
        setMetar('');
        setSearched(false)
        try {
            const report = await getMetar(airport.trim().toUpperCase())
            setMetar(report.trim());
            setSearched(true)
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return <div className="planner-app">
        <header className="topbar">
            <div className="brand"><span className="brand-mark">AP</span>
                <div><h1>Aviation Planner</h1><span>Your flight, in perspective.</span></div>
            </div>
            <span className="prototype-label">SR20 / PROTOTYPE</span></header>
        <nav className="page-nav" aria-label="Planner sections">
            <button aria-pressed={tab === 'balance'} className={tab === 'balance' ? 'active' : ''}
                    onClick={() => setTab('balance')}>Weight & balance
            </button>
            <button aria-pressed={tab === 'weather'} className={tab === 'weather' ? 'active' : ''}
                    onClick={() => setTab('weather')}>Airport weather
            </button>
        </nav>
        <main className="page-content">
            <div hidden={tab !== 'balance'}><WeightBalance/></div>
            <section hidden={tab !== 'weather'} aria-labelledby="weather-title">
                <div className="section-heading">
                    <div><p className="eyebrow">AIRPORT CONDITIONS</p><h2 id="weather-title">Airport weather</h2><p>Look
                        up the latest available raw METAR.</p></div>
                </div>
                <div className="card weather-card">
                    <form onSubmit={handleSubmit}><label htmlFor="airport">Airport ICAO code</label>
                        <div className="weather-search"><input id="airport" value={airport}
                                                               onChange={e => setAirport(e.target.value.toUpperCase())}
                                                               pattern="[A-Za-z0-9]{4}" maxLength={4} required
                                                               disabled={loading}/>
                            <button className="primary"
                                    disabled={loading}>{loading ? 'Loading...' : 'Get METAR'}</button>
                        </div>
                    </form>
                    <div aria-live="polite">{loading && <p>Loading METAR...</p>}{error &&
                        <p role="alert" className="input-error">Could not load METAR: {error}</p>}{metar &&
                        <pre className="metar-report">{metar}</pre>}{searched && !metar &&
                        <p>No recent METAR available.</p>}</div>
                    <p className="footnote">Source: NOAA Aviation Weather Center. Report times are in UTC.</p></div>
            </section>
        </main>
        <footer className="page-footer">AVIATION PLANNER<span>Learning prototype · verify aircraft data before operational use</span>
        </footer>
    </div>
}
