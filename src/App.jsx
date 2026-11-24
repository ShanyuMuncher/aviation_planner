import {useState} from 'react'
import WeightBalance from './WeightBalance.jsx'
import './App.css'

async function getWeatherReport(type, airport) {
    const response = await fetch(`/weather/api/data/${type}?ids=${encodeURIComponent(airport)}&format=raw`, {
        signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new Error(`Request failed: ${response.status}`)
    if (response.status === 204) return ''
    return (await response.text()).trim()
}

const EMPTY_REPORT = {text: '', error: ''}

function reportResult(result) {
    if (result.status === 'fulfilled') return {text: result.value, error: ''}
    return {
        text: '',
        error: result.reason?.name === 'TimeoutError'
            ? 'The request timed out. Please try again.'
            : result.reason?.message || 'Unable to retrieve this report. Please try again.',
    }
}

function WeatherReport({type, airport, report, loading}) {
    const title = type.toUpperCase()
    return (
        <section className="weather-report" aria-labelledby={type + '-heading'}>
            <div className="card-heading">
                <h3 id={type + '-heading'}>{title} · {airport}</h3>
                <span className="small-tag">{type === 'taf' ? 'FORECAST' : 'OBSERVATION'}</span>
            </div>
            {loading ? <p className="weather-message">Loading {title}...</p>
                : report.error ? <p role="alert" className="input-error">Could not load {title}: {report.error}</p>
                    : report.text ? <pre className="metar-report">{report.text}</pre>
                        : <p className="weather-message">{type === 'taf'
                            ? 'No TAF available for ' + airport + '. Not all airports issue a TAF.'
                            : 'No recent METAR available for ' + airport + '.'}</p>}
        </section>
    )
}

export default function App() {
    const [tab, setTab] = useState('balance')
    const [airport, setAirport] = useState('CYVR')
    const [metar, setMetar] = useState(EMPTY_REPORT)
    const [taf, setTaf] = useState(EMPTY_REPORT)
    const [loading, setLoading] = useState(false)
    const [searchedAirport, setSearchedAirport] = useState('')

    async function handleSubmit(event) {
        event.preventDefault()
        if (loading) return
        const code = airport.trim().toUpperCase()
        if (!/^[A-Z0-9]{4}$/.test(code)) return
        setAirport(code)
        setSearchedAirport(code)
        setLoading(true)
        setMetar(EMPTY_REPORT)
        setTaf(EMPTY_REPORT)
        try {
            // Keep each result independent: a missing forecast must not hide the observation.
            const [metarResult, tafResult] = await Promise.allSettled([
                getWeatherReport('metar', code),
                getWeatherReport('taf', code),
            ])
            setMetar(reportResult(metarResult))
            setTaf(reportResult(tafResult))
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
                        up the latest available METAR and TAF.</p></div>
                </div>
                <div className="card weather-card">
                    <form onSubmit={handleSubmit}><label htmlFor="airport">Airport ICAO code</label>
                        <div className="weather-search"><input id="airport" value={airport}
                                                               onChange={e => setAirport(e.target.value.toUpperCase())}
                                                               pattern="[A-Za-z0-9]{4}" maxLength={4} required
                                                               disabled={loading}/>
                            <button className="primary"
                                    disabled={loading}>{loading ? 'Loading...' : 'Get weather'}</button>
                        </div>
                    </form>
                    <div aria-live="polite" aria-busy={loading}>
                        {searchedAirport && <>
                            <WeatherReport type="metar" airport={searchedAirport} report={metar} loading={loading}/>
                            <WeatherReport type="taf" airport={searchedAirport} report={taf} loading={loading}/>
                        </>}
                    </div>
                    <p className="footnote">Source: NOAA Aviation Weather Center. Report times are in UTC.</p></div>
            </section>
        </main>
        <footer className="page-footer">AVIATION PLANNER<span>Learning prototype · verify aircraft data before operational use</span>
        </footer>
    </div>
}
