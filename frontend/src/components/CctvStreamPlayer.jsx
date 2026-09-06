import React, { useState } from 'react';
import { 
  Video, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Wifi, 
  Eye, 
  Camera, 
  ShieldAlert,
  Play,
  Monitor
} from 'lucide-react';
import { frameImageUrl } from '../hooks/useIncidentData';

/**
 * Classify camera stream source type:
 * - 'WEBCAM_LOCAL': Hardware index 0, 1, 2...
 * - 'HTTP_STREAM': Wi-Fi / IP camera HTTP/HTTPS stream (playable/embeddable)
 * - 'RTSP': rtsp:// protocol stream (requires external viewer, credentials masked)
 * - 'UNAVAILABLE': null, undefined, or unknown
 */
export function getCameraStreamType(streamUrl) {
  if (streamUrl === null || streamUrl === undefined || streamUrl === '') {
    return 'UNAVAILABLE';
  }
  if (typeof streamUrl === 'number' || (/^\d+$/.test(String(streamUrl).trim()))) {
    return 'WEBCAM_LOCAL';
  }
  const str = String(streamUrl).trim().toLowerCase();
  if (str.startsWith('rtsp://')) {
    return 'RTSP';
  }
  if (str.startsWith('http://') || str.startsWith('https://')) {
    return 'HTTP_STREAM';
  }
  return 'UNKNOWN';
}

/**
 * Mask credentials in RTSP URL (e.g. rtsp://user:pass@host:port/path -> rtsp://***:***@host:port/path)
 */
export function maskRtspCredentials(url) {
  if (!url) return '';
  const str = String(url);
  return str.replace(/(rtsp:\/\/)([^:]+):([^@]+)@/i, '$1***:***@');
}

/**
 * Compact stream badge used in queue cards / summary lists
 */
export function StreamBadge({ streamUrl, cameraId }) {
  const type = getCameraStreamType(streamUrl);

  if (type === 'WEBCAM_LOCAL') {
    return (
      <span 
        title="Hardware webcam index on edge machine"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          background: 'rgba(168, 153, 132, 0.15)',
          color: '#d5c4a1',
          border: '1px solid rgba(168, 153, 132, 0.3)',
        }}
      >
        <Video size={10} /> Local Cam #{streamUrl}
      </span>
    );
  }

  if (type === 'HTTP_STREAM') {
    return (
      <span 
        title="Live Phone Wi-Fi / IP Stream"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          background: 'rgba(74, 124, 47, 0.2)',
          color: '#a9b665',
          border: '1px solid rgba(169, 182, 101, 0.4)',
        }}
      >
        <Wifi size={10} /> Live HTTP Stream
      </span>
    );
  }

  if (type === 'RTSP') {
    return (
      <span 
        title="RTSP Video Feed (Masked)"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 7px',
          borderRadius: 4,
          fontSize: 10,
          fontFamily: "'JetBrains Mono', monospace",
          background: 'rgba(215, 153, 33, 0.15)',
          color: '#fabd2f',
          border: '1px solid rgba(250, 189, 47, 0.35)',
        }}
      >
        <Monitor size={10} /> RTSP Feed
      </span>
    );
  }

  return (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        background: 'rgba(146, 131, 116, 0.15)',
        color: '#928374',
        border: '1px solid rgba(146, 131, 116, 0.25)',
      }}
    >
      <AlertCircle size={10} /> Stream unavailable
    </span>
  );
}

/**
 * Dynamic CctvStreamPlayer
 *
 * Renders the live or captured CCTV feed for an incident according to its stream type:
 * - Webcam index: "Local camera — not remotely viewable"
 * - Phone Wi-Fi HTTP stream: Embedded stream or clickable link
 * - RTSP stream: Masked credentials with copy button & external viewer link
 * - Null / missing: "Stream unavailable" fallback
 */
export default function CctvStreamPlayer({
  incidentId,
  cameraId = 'CAM-01',
  streamUrl,
  frameIndex = 0,
  severity = 'CRITICAL',
  style = {},
}) {
  const [copied, setCopied] = useState(false);
  const [activeMode, setActiveMode] = useState('embed'); // 'embed' | 'frame'
  const [embedError, setEmbedError] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const type = getCameraStreamType(streamUrl);
  const maskedUrl = type === 'RTSP' ? maskRtspCredentials(streamUrl) : streamUrl;
  const snapshotUrl = incidentId ? frameImageUrl(incidentId, frameIndex) : null;

  const accent = severity === 'CRITICAL' ? '#cc241d' : severity === 'MODERATE' ? '#d79921' : '#98971a';

  const handleCopyRtsp = () => {
    if (!streamUrl) return;
    navigator.clipboard.writeText(String(streamUrl));
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }}>
      {/* ── Main CCTV Screen ── */}
      <div 
        data-testid="cctv-screen-container"
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          aspectRatio: '16/9',
          background: '#1d2021',
          border: `1px solid ${accent}45`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.4)`
        }}
      >
        {/* Render HTTP live embed if active, else render detection frame */}
        {type === 'HTTP_STREAM' && activeMode === 'embed' && !embedError ? (
          <img
            src={streamUrl}
            alt={`Live stream from ${cameraId}`}
            onError={() => setEmbedError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : snapshotUrl ? (
          <img
            src={snapshotUrl}
            alt={`Incident capture ${incidentId} frame ${frameIndex}`}
            onLoad={() => setFrameLoaded(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: frameLoaded ? 1 : 0.4,
              transition: 'opacity 0.3s ease-in-out',
              display: 'block'
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#928374',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12
          }}>
            <Camera size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
            No frame image available
          </div>
        )}

        {/* Scanlines layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)',
          zIndex: 2
        }} />

        {/* Subtle radial vignette */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 65% 55% at 50% 50%, transparent 60%, rgba(0,0,0,0.7) 100%)`,
          zIndex: 2
        }} />

        {/* Top-Left Status Overlay */}
        <div style={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 5,
          display: 'flex',
          gap: 6,
          alignItems: 'center'
        }}>
          {severity === 'CRITICAL' && (
            <div style={{
              background: '#cc241d',
              borderRadius: 4,
              padding: '2px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#fff',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              boxShadow: '0 0 8px rgba(204,36,29,0.6)'
            }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
              LIVE
            </div>
          )}

          <div style={{
            background: 'rgba(29, 32, 33, 0.85)',
            border: '1px solid rgba(80, 73, 69, 0.6)',
            backdropFilter: 'blur(4px)',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#ebdbb2',
            fontWeight: 600
          }}>
            {cameraId}
          </div>
        </div>

        {/* Top-Right Feed Mode Selector for HTTP Streams */}
        {type === 'HTTP_STREAM' && !embedError && (
          <div style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 5,
            display: 'flex',
            background: 'rgba(29, 32, 33, 0.88)',
            border: '1px solid rgba(80, 73, 69, 0.6)',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <button
              onClick={() => setActiveMode('embed')}
              style={{
                border: 'none',
                background: activeMode === 'embed' ? '#458588' : 'transparent',
                color: activeMode === 'embed' ? '#fff' : '#a89984',
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: activeMode === 'embed' ? 700 : 400
              }}
            >
              Live Embed
            </button>
            <button
              onClick={() => setActiveMode('frame')}
              style={{
                border: 'none',
                background: activeMode === 'frame' ? '#458588' : 'transparent',
                color: activeMode === 'frame' ? '#fff' : '#a89984',
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                padding: '3px 8px',
                cursor: 'pointer',
                fontWeight: activeMode === 'frame' ? 700 : 400
              }}
            >
              AI BBox Frame
            </button>
          </div>
        )}

        {/* Bottom Bar Info */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 10,
          right: 10,
          zIndex: 5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            background: 'rgba(29, 32, 33, 0.85)',
            border: '1px solid rgba(80, 73, 69, 0.5)',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            color: '#a89984'
          }}>
            Frame {frameIndex} · {incidentId?.replace('INC-', '#') ?? 'LIVE'}
          </div>

          <StreamBadge streamUrl={streamUrl} cameraId={cameraId} />
        </div>
      </div>

      {/* ── Dynamic Stream Action & Status Banner ── */}
      <div style={{
        background: '#32302f',
        border: '1px solid #504945',
        borderRadius: 6,
        padding: '10px 14px',
        fontSize: 12,
        fontFamily: "'Manrope', sans-serif"
      }}>
        {/* 1. WEBCAM INDEX (LOCAL-ONLY) */}
        {type === 'WEBCAM_LOCAL' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                background: 'rgba(168, 153, 132, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ebdbb2'
              }}>
                <Video size={14} />
              </div>
              <div>
                <span style={{ color: '#ebdbb2', fontWeight: 600 }}>
                  Local camera — not remotely viewable
                </span>
                <div style={{ fontSize: 11, color: '#a89984', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                  Direct device index: {streamUrl} (host machine webcam driver)
                </div>
              </div>
            </div>

            <span style={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              color: '#928374',
              background: 'rgba(0,0,0,0.25)',
              padding: '3px 8px',
              borderRadius: 4
            }}>
              Non-routable hardware
            </span>
          </div>
        )}

        {/* 2. PHONE WI-FI HTTP STREAM */}
        {type === 'HTTP_STREAM' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200, flex: 1 }}>
              <div style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                background: 'rgba(169, 182, 101, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b8bb26'
              }}>
                <Wifi size={14} />
              </div>
              <div>
                <div style={{ color: '#ebdbb2', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Wi-Fi HTTP Live Stream</span>
                  <span style={{
                    fontSize: 9,
                    background: '#98971a',
                    color: '#1d2021',
                    padding: '1px 5px',
                    borderRadius: 3,
                    fontWeight: 700
                  }}>HTTP</span>
                </div>
                <div style={{
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: '#83a598',
                  wordBreak: 'break-all',
                  marginTop: 2
                }}>
                  {streamUrl}
                </div>
              </div>
            </div>

            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#458588',
                color: '#fbf1c7',
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#83a598'}
              onMouseLeave={e => e.currentTarget.style.background = '#458588'}
            >
              <ExternalLink size={13} />
              Open Stream
            </a>
          </div>
        )}

        {/* 3. RTSP STREAM (MASKED CREDENTIALS + COPY BUTTON) */}
        {type === 'RTSP' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 4,
                  background: 'rgba(250, 189, 47, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fabd2f'
                }}>
                  <Monitor size={14} />
                </div>
                <div>
                  <div style={{ color: '#ebdbb2', fontWeight: 600 }}>
                    RTSP Surveillance Stream
                  </div>
                  <div style={{
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: '#d5c4a1',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2px 6px',
                    borderRadius: 4,
                    marginTop: 3,
                    wordBreak: 'break-all',
                    display: 'inline-block'
                  }}>
                    {maskedUrl}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={handleCopyRtsp}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: copied ? '#98971a' : '#504945',
                    color: copied ? '#1d2021' : '#ebdbb2',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Copy RTSP Stream URL to clipboard for VLC / external player"
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>

                <a
                  href={streamUrl}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'transparent',
                    color: '#fabd2f',
                    border: '1px solid #fabd2f55',
                    padding: '5px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                  title="Open stream in default RTSP protocol application"
                >
                  <ExternalLink size={13} />
                  Open in Viewer
                </a>
              </div>
            </div>

            <div style={{
              fontSize: 11,
              color: '#a89984',
              fontStyle: 'italic'
            }}>
              ℹ️ Browsers cannot play RTSP feeds natively. Credentials are masked for security. Click <strong>Copy</strong> to stream in VLC or a compatible RTSP client.
            </div>
          </div>
        )}

        {/* 4. MISSING OR NULL (STREAM UNAVAILABLE) */}
        {type === 'UNAVAILABLE' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              background: 'rgba(204, 36, 29, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb4934'
            }}>
              <AlertCircle size={14} />
            </div>
            <div>
              <span style={{ color: '#ebdbb2', fontWeight: 600 }}>
                Stream unavailable
              </span>
              <div style={{ fontSize: 11, color: '#928374', marginTop: 2 }}>
                Camera [{cameraId}] has no active stream URL in cameras.yaml or stream lookup failed.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
