import { describe, it, expect } from 'vitest'
import {
  shortId,
  taskStatusTone,
  policyDecisionTone,
  policyDecisionLabel,
  auditStatusTone,
  formatLatency,
  formatCoordinate,
  formatTimeWindow,
} from '../format.js'

describe('format helpers', () => {
  it('shortens long ids and passes through short ones', () => {
    expect(shortId('123456789012')).toBe('12345678…')
    expect(shortId('abc')).toBe('abc')
    expect(shortId(undefined)).toBe('—')
  })

  it('maps task status to tone', () => {
    expect(taskStatusTone('Approved')).toBe('success')
    expect(taskStatusTone('Rejected')).toBe('danger')
    expect(taskStatusTone('Flagged')).toBe('warning')
    expect(taskStatusTone('Submitted')).toBe('neutral')
  })

  it('maps policy decision to tone and label', () => {
    expect(policyDecisionTone('Approved')).toBe('success')
    expect(policyDecisionTone('Rejected')).toBe('danger')
    expect(policyDecisionLabel('FlaggedForReview')).toBe('Flagged for review')
  })

  it('maps audit status to tone', () => {
    expect(auditStatusTone('Valid')).toBe('success')
    expect(auditStatusTone('Invalid')).toBe('danger')
  })

  it('formats latency and coordinates', () => {
    expect(formatLatency(182.4)).toBe('182 ms')
    expect(formatLatency(undefined)).toBe('—')
    expect(formatCoordinate('36.7', 'lat')).toBe('36.7000° N')
    expect(formatCoordinate('-122.2', 'lon')).toBe('122.2000° W')
  })

  it('splits a requested time window into readable start/end', () => {
    const { start, end } = formatTimeWindow('2026-07-07T12:00:00Z/2026-07-07T18:00:00Z')
    expect(start).not.toBe('—')
    expect(end).not.toBe('—')
  })
})
