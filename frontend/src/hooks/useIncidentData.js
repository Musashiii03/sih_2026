/**
 * useIncidentData
 *
 * Fetches all data from the backend API:
 *  - /api/incidents               → incident list
 *  - /api/incidents/:id/summary   → detailed summary with frame metadata
 *  - /api/incidents/:id/hologram  → hologram_data JSON (3D coords)
 *  - /api/incidents/:id/metadata  → per-frame metadata JSON aggregated human counts
 *  - /api/incidents/:id/frames/:n → JPEG image URL (used directly as img src)
 *
 * Returns consistent shape consumed by OwnerConsole and DispatchConsole.
 */

import { useState, useEffect, useCallback } from 'react';

const API = ''; // proxied via Vite → localhost:3001

// ── Helpers ────────────────────────────────────────────────────────────────

/** Absolute URL for a frame image (proxied) */
export function frameImageUrl(incidentId, frameIndex) {
  return `${API}/api/incidents/${incidentId}/frames/${frameIndex}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return res.json();
}

// ── Main hook ──────────────────────────────────────────────────────────────

/**
 * @returns {{
 *   incidents: Array,           // list from /api/incidents
 *   loading: boolean,
 *   error: string|null,
 *   selectedId: string|null,
 *   setSelectedId: fn,
 *   summary: object|null,       // full summary.json for selectedId (metadata-enriched)
 *   hologram: object|null,      // hologram_data JSON for selectedId
 *   metadataStats: object|null, // aggregated per-frame metadata → authoritative human counts
 *   refresh: fn,
 * }}
 */
export function useIncidentData() {
  const [incidents, setIncidents]         = useState([]);
  const [selectedId, setSelectedId]       = useState(null);
  const [summary, setSummary]             = useState(null);
  const [hologram, setHologram]           = useState(null);
  const [metadataStats, setMetadataStats] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  // Fetch incident list once
  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson('/api/incidents');
      const list = data.incidents || [];
      setIncidents(list);
      // Auto-select the most recent (first) incident
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].incident_id);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadIncidents(); }, [loadIncidents]);

  // Fetch summary + hologram + per-frame metadata whenever selectedId changes
  useEffect(() => {
    if (!selectedId) return;
    setSummary(null);
    setHologram(null);
    setMetadataStats(null);

    Promise.all([
      fetchJson(`/api/incidents/${selectedId}/summary`).catch(() => null),
      fetchJson(`/api/incidents/${selectedId}/hologram`).catch(() => null),
      // /metadata reads every metadata/frame_NNN.json — authoritative human counts
      fetchJson(`/api/incidents/${selectedId}/metadata`).catch(() => null),
    ]).then(([sum, holo, meta]) => {
      setSummary(sum);
      setHologram(holo);
      setMetadataStats(meta);
    });
  }, [selectedId]);

  return {
    incidents,
    loading,
    error,
    selectedId,
    setSelectedId,
    summary,
    hologram,
    metadataStats,
    refresh: loadIncidents,
  };
}

// ── Derived helpers used by components ────────────────────────────────────

/**
 * From a summary object, return severity level string
 */
export function deriveSeverity(summary) {
  if (!summary) return 'UNKNOWN';
  const avgConf = summary.statistics?.avg_fire_confidence ?? 0;
  const maxFire = Math.max(...(summary.frames || []).map(f => f.fire_count ?? 0), 0);
  if (avgConf >= 0.65 || maxFire >= 3) return 'CRITICAL';
  if (avgConf >= 0.40) return 'MODERATE';
  return 'LOW';
}

/**
 * Return frame objects for evidence strip (all available frames)
 */
export function getEvidenceFrames(summary, maxCount = 999) {
  if (!summary?.frames) return [];
  return summary.frames.slice(0, maxCount);
}

/**
 * Aggregate stats from summary + optional metadataStats.
 *
 * Human count precedence (most authoritative first):
 *   1. metadataStats.peak_human_count       — from per-frame metadata/frame_NNN.json files
 *   2. summary.statistics.peak_human_count  — if backend enriched the summary endpoint
 *   3. summary.statistics.total_human_detections — raw fallback
 *
 * @param {object|null} summary
 * @param {object|null} metadataStats  - from /api/incidents/:id/metadata
 */
export function aggregateStats(summary, metadataStats) {
  if (!summary) return { fireCount: 0, humanCount: 0, peakHumanCount: 0, totalHumanDetections: 0, framesWithHumans: 0, objectCount: 0, avgConf: 0, frameCount: 0 };
  const stats = summary.statistics || {};

  // per-frame metadata JSON files are the authoritative human-count source
  const peakHumanCount       = metadataStats?.peak_human_count        ?? stats.peak_human_count        ?? 0;
  const totalHumanDetections = metadataStats?.total_human_detections   ?? stats.total_human_detections  ?? 0;
  const framesWithHumans     = metadataStats?.frames_with_humans       ?? stats.frames_with_humans      ?? 0;

  return {
    fireCount:             stats.total_fire_detections   ?? 0,
    humanCount:            peakHumanCount,      // "People at Risk" = peak simultaneous humans
    totalHumanDetections,                       // cumulative across all frames
    framesWithHumans,
    peakHumanCount,
    objectCount:           stats.total_object_detections ?? 0,
    avgConf:               stats.avg_fire_confidence     ?? 0,
    frameCount:            summary.frame_count           ?? 0,
  };
}
