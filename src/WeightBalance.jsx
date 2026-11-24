import {useState} from 'react'
import {DEMO, INITIAL, calculate} from './wb-model.mjs'

const number = (value, digits = 0) => value.toLocaleString('en-CA', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
})

function LoadingInput({name, label, detail, value, max, unit, onChange}) {
    return <div className="load-row">
        <div className="load-label"><label htmlFor={name}>{label}</label><span>{detail}</span></div>
        <div className="load-controls">
            <div className="number-box"><input id={name} type="number" min="0" max={max} step="any" value={value}
                                               onChange={e => onChange(name, e.target.value)}/><span>{unit}</span></div>
            <input className="slider" type="range" aria-label={`${label} slider`} min="0" max={max} step="1"
                   value={value === '' ? 0 : Math.min(max, Math.max(0, Number(value) || 0))}
                   onChange={e => onChange(name, e.target.value)}/>
        </div>
    </div>
}

function EnvelopeGraph({result}) {
    const points = result.error ? [] : [result.departure, result.landing]
    const xMin = Math.min(134, ...points.map(p => Math.floor(p.cg - 3)))
    const xMax = Math.max(156, ...points.map(p => Math.ceil(p.cg + 3)))
    const yMin = 1900
    const yMax = Math.max(3500, ...points.map(p => Math.ceil((p.weight + 150) / 100) * 100))
    const x = v => 78 + (v - xMin) / (xMax - xMin) * 490
    const y = v => 375 - (v - yMin) / (yMax - yMin) * 325
    return <svg className="envelope-chart" viewBox="0 0 620 440" role="img" aria-labelledby="graph-title graph-desc">
        <title id="graph-title">Demo weight and centre of gravity envelope</title>
        <desc id="graph-desc">Fictional envelope, not approved SR20
            data. {result.error ? 'Enter valid inputs to plot loading.' : `Departure: ${number(result.departure.weight)} pounds at ${number(result.departure.cg, 2)} inches. Landing: ${number(result.landing.weight)} pounds at ${number(result.landing.cg, 2)} inches.`}</desc>
        {Array.from({length: 6}, (_, i) => {
            const weight = yMin + (yMax - yMin) * i / 5
            const arm = xMin + (xMax - xMin) * i / 5
            return <g key={i}>
                <line x1="78" x2="568" y1={y(weight)} y2={y(weight)} className="grid-line"/>
                <text x="65" y={y(weight) + 4} textAnchor="end">{number(weight)}</text>
                <line x1={x(arm)} x2={x(arm)} y1="50" y2="375" className="grid-line"/>
                <text x={x(arm)} y="399" textAnchor="middle">{number(arm, 1)}</text>
            </g>
        })}
        <polygon points={DEMO.envelope.map(([cg, weight]) => `${x(cg)},${y(weight)}`).join(' ')}
                 className="demo-envelope"/>
        <text x={x(145.7)} y={y(2450)} textAnchor="middle" className="envelope-label">DEMO ENVELOPE</text>
        <text x="323" y="430" textAnchor="middle">Centre of gravity · inches aft of demo datum</text>
        <text transform="translate(19 215) rotate(-90)" textAnchor="middle">Aircraft weight · lb</text>
        {!result.error && <g>
            <line x1={x(result.departure.cg)} y1={y(result.departure.weight)} x2={x(result.landing.cg)}
                  y2={y(result.landing.weight)} className="fuel-line"/>
            <circle cx={x(result.departure.cg)} cy={y(result.departure.weight)} r="8" className="departure-dot"/>
            <path d={`M ${x(result.landing.cg)} ${y(result.landing.weight) - 9} l 9 9 l -9 9 l -9 -9 Z`}
                  className="landing-dot"/>
            <text x={x(result.departure.cg) + 14} y={y(result.departure.weight) - 12} className="point-label">DEP</text>
            <text x={x(result.landing.cg) + 14} y={y(result.landing.weight) + 20} className="point-label">LDG</text>
        </g>}
    </svg>
}

export default function WeightBalance() {
    const [values, setValues] = useState({...INITIAL})
    const result = calculate(values)
    const update = (name, value) => setValues(previous => ({...previous, [name]: value}))
    return <section aria-labelledby="wb-title">
        <div className="section-heading">
            <div><p className="eyebrow">AIRCRAFT LOADING</p><h2 id="wb-title">Weight & balance</h2><p>See how every seat
                and gallon changes your loading.</p></div>
            <button className="secondary" onClick={() => setValues({...INITIAL})}>Reset loading</button>
        </div>
        <div className="demo-notice"><strong>SR20 interface prototype · fictional data</strong><span>All weights, arms, capacities and envelope limits are examples. Not for flight planning.</span>
        </div>
        <div className="wb-layout">
            <div className="card loading-card">
                <div className="card-heading"><h3>Load your aircraft</h3><span className="small-tag">lb / US gal</span>
                </div>
                <div className="aircraft-base">
                    <div><strong>SR20</strong><span>Example aircraft profile</span></div>
                    <div><strong>{number(DEMO.emptyWeight)} lb</strong><span>Demo empty weight</span></div>
                </div>
                <p className="group-label">OCCUPANTS & BAGGAGE</p>
                {DEMO.stations.map(s => <LoadingInput key={s.key} name={s.key} label={s.label} detail={s.detail}
                                                      value={values[s.key]} max={s.max} unit="lb" onChange={update}/>)}
                <p className="group-label fuel-heading">FUEL PLAN</p>
                <LoadingInput name="fuel" label="Departure fuel" detail="Fuel onboard at departure" value={values.fuel}
                              max={DEMO.maxFuel} unit="gal" onChange={update}/>
                <LoadingInput name="burn" label="Planned fuel burn" detail="From departure to landing"
                              value={values.burn} max={DEMO.maxFuel} unit="gal" onChange={update}/>
                <p className="footnote">Demo conversion: {DEMO.fuelDensity} lb per US gallon. Slider ranges are
                    interface limits, not aircraft limitations.</p>
            </div>
            <div className="results-column">
                <div className="card graph-card">
                    <div className="card-heading">
                        <div><h3>Loading envelope</h3><p>Weight versus centre of gravity</p></div>
                        <span className="small-tag">LIVE</span></div>
                    <EnvelopeGraph result={result}/>
                    <div className="legend"><span><i className="legend-dep"/>Departure</span><span><i
                        className="legend-ldg"/>Landing</span><span className="muted">Dashed line: fuel change</span>
                    </div>
                </div>
                <div aria-live="polite" aria-atomic="true">
                    {result.error ? <div className="input-error" role="alert">{result.error}</div> : <>
                        <div
                            className="summary-grid">{[['Departure', result.departure], ['Landing', result.landing]].map(([label, p]) =>
                            <div className="card summary-card" key={label}><p
                                className="group-label">{label.toUpperCase()}</p><strong
                                className="weight-value">{number(p.weight)} <small>lb</small></strong>
                                <p>CG <strong>{number(p.cg, 2)} in</strong></p><span
                                    className={p.inside ? 'status within' : 'status outside'}>{p.inside ? 'Inside demo envelope' : 'Outside demo envelope'}</span>
                            </div>)}</div>
                        <div className="card detail-strip">
                            <div><span>Payload</span><strong>{number(result.payload)} lb</strong></div>
                            <div><span>Landing fuel</span><strong>{number(result.remaining, 1)} gal</strong></div>
                            <div><span>Demo weight margin*</span><strong
                                className={DEMO.maxWeight - result.departure.weight < 0 ? 'negative' : ''}>{number(DEMO.maxWeight - result.departure.weight)} lb</strong>
                            </div>
                        </div>
                        <p className="footnote">*Against the fictional {number(DEMO.maxWeight)} lb maximum. Envelope
                            labels describe only the plotted endpoints, not an operational approval.</p>
                    </>}
                </div>
            </div>
        </div>
    </section>
}
