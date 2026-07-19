import { useState } from 'react'
import { formatCoordinate } from '../utils/format.js'

const SENSOR_TYPES = ['EO', 'SAR', 'RF']
const CLASSIFICATION_LEVELS = ['CUI_IL5', 'SECRET_IL6']
const PROVIDERS = ['Maxar', 'Planet', 'BlackSky', 'Umbra', 'ICEYE']
const PRIORITIES = ['Routine', 'Priority', 'High', 'Immediate']

function validate(form) {
  const errors = {}
  if (!form.area_of_interest_name.trim()) errors.area_of_interest_name = 'Area of interest is required.'
  if (!form.mission_justification.trim()) errors.mission_justification = 'Mission justification is required.'
  const lat = Number(form.target_latitude)
  const lon = Number(form.target_longitude)
  if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.target_latitude = 'Latitude must be between -90 and 90.'
  if (Number.isNaN(lon) || lon < -180 || lon > 180) errors.target_longitude = 'Longitude must be between -180 and 180.'
  if (!form.requested_time_window.trim()) errors.requested_time_window = 'Requested time window is required.'
  return errors
}

export default function TaskRequestForm({ form, onChange, onSubmit, submitting, disabled, role }) {
  const [touched, setTouched] = useState(false)
  const errors = validate(form)
  const hasErrors = Object.keys(errors).length > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!hasErrors) onSubmit()
  }

  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value })
  const showError = (key) => touched && errors[key]

  return (
    <section className="panel" aria-labelledby="task-form-heading">
      <h2 id="task-form-heading">New Collection Request</h2>
      <p className="panel__description">
        Submit a tasking request for Zero Trust policy evaluation and provider routing.
      </p>
      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="form-group">
          <legend>Mission</legend>
          <label className="field">
            <span className="field__label">Area of interest</span>
            <input
              value={form.area_of_interest_name}
              onChange={set('area_of_interest_name')}
              placeholder="e.g. Pacific Maritime Corridor"
              aria-invalid={Boolean(showError('area_of_interest_name'))}
            />
            {showError('area_of_interest_name') && (
              <span className="field__error">{errors.area_of_interest_name}</span>
            )}
          </label>
          <label className="field field--wide">
            <span className="field__label">Mission justification</span>
            <textarea
              value={form.mission_justification}
              onChange={set('mission_justification')}
              placeholder="Operational rationale for this collection request"
              rows={2}
              aria-invalid={Boolean(showError('mission_justification'))}
            />
            {showError('mission_justification') && (
              <span className="field__error">{errors.mission_justification}</span>
            )}
          </label>
          <label className="field">
            <span className="field__label">Mission priority</span>
            <select value={form.mission_priority} onChange={set('mission_priority')}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="form-group">
          <legend>Collection</legend>
          <label className="field">
            <span className="field__label">Sensor type</span>
            <select value={form.sensor_type} onChange={set('sensor_type')}>
              {SENSOR_TYPES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field field--wide">
            <span className="field__label">Requested time window (ISO interval)</span>
            <input
              value={form.requested_time_window}
              onChange={set('requested_time_window')}
              placeholder="2026-07-07T12:00:00Z/2026-07-07T18:00:00Z"
              aria-invalid={Boolean(showError('requested_time_window'))}
            />
            {showError('requested_time_window') && (
              <span className="field__error">{errors.requested_time_window}</span>
            )}
          </label>
          <label className="field">
            <span className="field__label">Provider preference</span>
            <select value={form.commercial_provider_preference} onChange={set('commercial_provider_preference')}>
              {PROVIDERS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset className="form-group">
          <legend>Security</legend>
          <label className="field">
            <span className="field__label">Classification level</span>
            <select value={form.classification_level} onChange={set('classification_level')}>
              {CLASSIFICATION_LEVELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="field__label">Submitting authorization context</span>
            <p className="field__static">{role || 'Not authenticated'}</p>
          </div>
        </fieldset>

        <fieldset className="form-group">
          <legend>Location</legend>
          <label className="field">
            <span className="field__label">Latitude</span>
            <input
              type="number"
              step="any"
              value={form.target_latitude}
              onChange={set('target_latitude')}
              aria-invalid={Boolean(showError('target_latitude'))}
            />
            {showError('target_latitude') && <span className="field__error">{errors.target_latitude}</span>}
          </label>
          <label className="field">
            <span className="field__label">Longitude</span>
            <input
              type="number"
              step="any"
              value={form.target_longitude}
              onChange={set('target_longitude')}
              aria-invalid={Boolean(showError('target_longitude'))}
            />
            {showError('target_longitude') && <span className="field__error">{errors.target_longitude}</span>}
          </label>
          <div className="coordinate-preview" aria-label="Coordinate preview">
            <span className="coordinate-preview__label">Coordinate preview</span>
            <span className="coordinate-preview__value">
              {formatCoordinate(form.target_latitude, 'lat')}, {formatCoordinate(form.target_longitude, 'lon')}
            </span>
          </div>
        </fieldset>

        <div className="task-form__actions">
          <button type="submit" className="button button--primary" disabled={disabled || submitting}>
            {submitting ? 'Submitting…' : 'Submit Task'}
          </button>
          {disabled && !submitting && <span className="field__hint">Sign in to submit tasking requests.</span>}
        </div>
      </form>
    </section>
  )
}
