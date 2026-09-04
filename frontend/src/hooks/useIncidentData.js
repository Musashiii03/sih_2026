/**
 * useIncidentData
 *
 * Fetches all real data from the backend API:
 *  GET /api/incidents                       → incident list
 *  GET /api/incidents/:id/summary           → summary.json (frame-level fire/human/object counts)
 *  GET /api/incidents/:id/hologram          → hologram_data JSON (3D coordinates)
 *  GET /api/incidents/:id/humans            → aggregated human detections from per-frame metadata
 *  GET /api/incidents/:id/frames/:n         → JPEG image (used directly as <img src>)
 *
 * Human count priority (most authoritative first):
 *   1. /humans endpoint  → reads per-frame metadata JSONs, returns peak_human_count
 *   2. summary.statistics.total_human_detections  → aggregate from summary
 *   3. max(frame.human_count) across summary.frames  → per-frame peak from summary
 *   4. hologram.persons.length  → count of persons mapped to 3D space
 *   5. 0 (confirmed zero — video had no people)
 */

import { useState, useEffect, useCallback } from 'react';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} — ${url}`);
  return res.json();
}

/** Absolute URL for a frame JPEG served via backend proxy */
export function frameImageUrl(incidentId, frameIndex) {
  return `/api/incidents/${incidentId}/frames/${frameIndex}`;
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useIncidentData() {
  const [incidents,   setIncidents]   = useState([]);
  const [selectedId,  setSelectedId]  = useState(null);
  const [summary,     setSummary]     = useState(null);
  const [hologram,    setHologram]    = useState(null);
  const [humanData,   setHumanData]   = useState(null); // from /humans endpoint
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  // ── Load incident list ─────────────────────────────────────────────────
  const loadIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchJson('/api/incidents');
      const list = data.incidents || [];
      setIncidents(list);
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

  // ── Load detail data whenever selectedId changes ───────────────────────
  useEffect(() => {
    if (!selectedId) return;
    setSummary(null);
    setHologram(null);
    setHumanData(null);

    Promise.all([
      fetchJson(`/api/incidents/${selectedId}/summary`).catch(() => null),
      fetchJson(`/api/incidents/${selectedId}/hologram`).catch(() => null),
      fetchJson(`/api/incidents/${selectedId}/humans`).catch(() => null),
    ]).then(([sum, holo, humans]) => {
      setSummary(sum);
      setHologram(holo);
      setHumanData(humans);
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
    humanData,        // { peak_human_count, total_human_detections, frames_with_humans, peak_frame }
    metadataStats: humanData, // alias — consumed by useOwnerData and DispatchConsole
    refresh: loadIncidents,
  };
}

// ── Derived helpers ────────────────────────────────────────────────────────

/**
 * Derive severity from real summary statistics
 */
export function deriveSeverity(summary) {
  if (!summary) return 'UNKNOWN';
  const avgConf = summary.statistics?.avg_fire_confidence ?? 0;
  const maxFire = Math.max(...(summary.frames || []).map(f => f.fire_count ?? 0), 0);
  if (avgConf >= 0.65 || maxFire >= 3) return 'CRITICAL';
  if (avgConf >= 0.35) return 'MODERATE';
  return 'LOW';
}

/**
 * Return frame objects that have fire detections (for evidence strip)
 */
export function getEvidenceFrames(summary, maxCount = 6) {
  if (!summary?.frames) return [];
  return summary.frames
    .filter(f => (f.fire_count ?? 0) > 0)
    .slice(0, maxCount);
}

/**
 * Aggregate real stats from summary + humanData.
 *
 * Human count resolution (most → least authoritative):
 *  1. humanData.peak_human_count  (from per-frame metadata JSONs via /humans API)
 *  2. summary.statistics.total_human_detections
 *  3. Math.max of frame.human_count across all frames
 *  4. hologram.persons.length
 *  5. 0
 */
export function aggregateStats(summary, humanData = null, hologram = null) {
  if (!summary) return { fireCount: 0, humanCount: 0, objectCount: 0, avgConf: 0, frameCount: 0 };

  const stats = summary.statistics || {};

  // Human count — read from real metadata via /humans endpoint (most authoritative)
  let humanCount = 0;
  if (humanData && typeof humanData.peak_human_count === 'number') {
    humanCount = humanData.peak_human_count;
  } else if (typeof stats.total_human_detections === 'number' && stats.total_human_detections > 0) {
    humanCount = stats.total_human_detections;
  } else if (summary.frames?.length) {
    humanCount = Math.max(...summary.frames.map(f => f.human_count ?? 0), 0);
  } else if (hologram?.persons?.length) {
    humanCount = hologram.persons.length;
  }

  return {
    fireCount:   stats.total_fire_detections   ?? 0,
    humanCount,
    objectCount: stats.total_object_detections ?? 0,
    avgConf:     stats.avg_fire_confidence     ?? 0,
    frameCount:  summary.frame_count           ?? 0,
    // Extra human detail fields from /humans endpoint
    humanFrames: humanData?.frames_with_humans  ?? 0,
    humanTotal:  humanData?.total_human_detections ?? 0,
    humanSource: humanData?.data_source ?? 'summary',
  };
}
