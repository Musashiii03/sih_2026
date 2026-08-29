import React, { useState } from 'react';
import { IncidentRecord } from '../types';

interface IncidentLogProps {
  incidents: IncidentRecord[];
  searchQuery: string;
}

export const IncidentLog: React.FC<IncidentLogProps> = ({ incidents, searchQuery }) => {
  const [expandedId, setExpandedId] = useState<string | null>('ALERT_CAM02_FIRE_1204');
  const [selectedCameraFilter, setSelectedCameraFilter] = useState('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState('ALL');
  const [operatorNotes, setOperatorNotes] = useState<{ [key: string]: string }>({
    ALERT_CAM02_FIRE_1204: 'Thermal spike verified by NOC lead. Automated alert dispatched.',
  });

  const filteredIncidents = incidents.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.zone.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCamera = selectedCameraFilter === 'ALL' || item.cameraId === selectedCameraFilter;
    const matchesClass =
      selectedClassFilter === 'ALL' ||
      item.incidentClass.toLowerCase().includes(selectedClassFilter.toLowerCase());
    const matchesSeverity = selectedSeverityFilter === 'ALL' || item.severity === selectedSeverityFilter;

    return matchesSearch && matchesCamera && matchesClass && matchesSeverity;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSaveNotes = (id: string) => {
    alert(`Operator notes saved for incident ${id}`);
  };

  const handleTriggerAlarm = (id: string) => {
    alert(`[CRITICAL ACTION] Facility Alarm Triggered for ${id}! Emergency services notified.`);
  };

  const handleDispatchSecurity = (id: string) => {
    alert(`Security Response Team dispatched to ${id} location.`);
  };

  return (
    <main className="pt-16 md:pl-64 min-h-screen bg-background text-on-surface">
      <div className="p-gutter h-full flex flex-col gap-4 max-w-container-max mx-auto">
        {/* Page Header & Filter Bar */}
        <div className="bg-surface-elevated border border-outline-variant rounded p-3 flex flex-wrap gap-4 items-center justify-between shadow-xs sticky top-[72px] z-30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">view_timeline</span>
            <h1 className="font-headline-md text-headline-md text-on-surface m-0 leading-none font-bold">
              Global Incident Timeline
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filters */}
            <div className="flex gap-2 font-data-mono text-data-mono">
              <div className="relative">
                <select
                  value={selectedCameraFilter}
                  onChange={(e) => setSelectedCameraFilter(e.target.value)}
                  className="appearance-none bg-surface-container border border-outline-variant text-on-surface-variant rounded pl-2 pr-8 py-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="ALL">All Cameras</option>
                  <option value="CAM-02">CAM-02 (Storage B)</option>
                  <option value="CAM-03">CAM-03 (Main Lobby)</option>
                  <option value="CAM-04">CAM-04 (Server Rm)</option>
                  <option value="CAM-06">CAM-06 (Loading Dock)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-on-surface-variant">
                  arrow_drop_down
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="appearance-none bg-surface-container border border-outline-variant text-on-surface-variant rounded pl-2 pr-8 py-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="ALL">All Classes</option>
                  <option value="Fire">Fire/Smoke</option>
                  <option value="Intrusion">Intrusion</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-on-surface-variant">
                  arrow_drop_down
                </span>
              </div>

              <div className="relative">
                <select
                  value={selectedSeverityFilter}
                  onChange={(e) => setSelectedSeverityFilter(e.target.value)}
                  className="appearance-none bg-surface-container border border-outline-variant text-on-surface-variant rounded pl-2 pr-8 py-1 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[16px] pointer-events-none text-on-surface-variant">
                  arrow_drop_down
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-outline-variant mx-1 hidden sm:block"></div>

            <button
              onClick={() => {
                setSelectedCameraFilter('ALL');
                setSelectedClassFilter('ALL');
                setSelectedSeverityFilter('ALL');
              }}
              className="btn-ghost font-label-xs text-label-xs px-3 py-1 rounded flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span> Reset
            </button>
            <button
              onClick={() => alert('Exporting Incident Log JSON/CSV...')}
              className="btn-primary font-label-xs text-label-xs px-3 py-1 rounded flex items-center gap-1 uppercase tracking-wider font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">download</span> Export Log
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="flex-1 bg-surface-elevated border border-outline-variant rounded overflow-hidden flex flex-col min-h-[500px] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-high border-b border-outline-variant">
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold w-12 text-center">
                    Sts
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold">
                    Incident ID
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold">
                    Class
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold">
                    Severity
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold">
                    Zone
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold text-center">
                    Conf.
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold w-24">
                    Evidence
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold">
                    Timestamp
                  </th>
                  <th className="p-3 font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="font-data-mono text-data-mono text-on-surface">
                {filteredIncidents.map((incident) => {
                  const isExpanded = expandedId === incident.id;
                  const isCritical = incident.severity === 'CRITICAL';
                  const isWarning = incident.severity === 'WARNING';

                  return (
                    <React.Fragment key={incident.id}>
                      {/* Main Row */}
                      <tr
                        onClick={() => toggleExpand(incident.id)}
                        className={`border-b border-outline-variant cursor-pointer transition-colors ${
                          isCritical
                            ? 'bg-error-container/30 hover:bg-error-container/50'
                            : isWarning
                            ? 'bg-primary-container/10 hover:bg-primary-container/20'
                            : 'hover:bg-surface-container-high/50'
                        }`}
                      >
                        <td className="p-3 text-center">
                          <div
                            className={`w-2 h-2 rounded-full mx-auto ${
                              isCritical
                                ? 'bg-error pulse-critical-glow'
                                : isWarning
                                ? 'bg-primary-container'
                                : 'bg-green-600'
                            }`}
                          ></div>
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${isCritical ? 'text-error' : isWarning ? 'text-primary' : 'text-on-surface'}`}>
                            {incident.id}
                          </span>
                        </td>
                        <td className="p-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${
                              isCritical
                                ? 'bg-error-container/80 border-error/50 text-on-error-container'
                                : isWarning
                                ? 'bg-primary-container/20 border-primary/30 text-on-primary-container'
                                : 'bg-surface-container-high border-outline-variant text-on-surface-variant'
                            }`}
                          >
                            <span
                              className="material-symbols-outlined text-[14px]"
                              style={isCritical ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                              {isCritical ? 'local_fire_department' : isWarning ? 'person_alert' : 'build'}
                            </span>
                            <span className="font-label-xs text-label-xs uppercase tracking-wide font-bold">
                              {incident.incidentClass}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div
                            className={`inline-flex items-center gap-1 border-l-2 pl-2 ${
                              isCritical ? 'border-error text-error' : isWarning ? 'border-primary text-primary' : 'border-tertiary text-tertiary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isCritical ? 'warning' : isWarning ? 'warning_amber' : 'info'}
                            </span>
                            <span className="font-label-xs text-label-xs font-bold">{incident.classCode}</span>
                          </div>
                        </td>
                        <td className="p-3 text-on-surface-variant">{incident.zone}</td>
                        <td className="p-3 text-center text-primary font-bold">
                          {incident.confidence ? `${incident.confidence.toFixed(1)}%` : '--'}
                        </td>
                        <td className="p-3">
                          {incident.evidenceUrl ? (
                            <div className="w-16 h-9 bg-surface-container rounded border border-outline-variant relative overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant z-10 drop-shadow-md">
                                image
                              </span>
                              <img
                                src={incident.evidenceUrl}
                                alt="Evidence Thumbnail"
                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                              />
                              {isCritical && <div className="bounding-box top-1 left-2 w-6 h-5"></div>}
                            </div>
                          ) : (
                            <div className="w-16 h-9 bg-surface-container rounded border border-outline-variant flex items-center justify-center opacity-50">
                              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                                videocam_off
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-on-surface-variant">{incident.timestamp}</td>
                        <td className="p-3 text-right">
                          <button className="btn-ghost p-1 rounded hover:text-primary" title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}>
                            <span className="material-symbols-outlined text-[18px]">
                              {isExpanded ? 'expand_less' : 'chevron_right'}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Drawer Row */}
                      {isExpanded && (
                        <tr className="border-b-2 border-outline-variant bg-surface-container-low">
                          <td colSpan={9} className="p-0">
                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Column 1: Media/Evidence */}
                              <div className="level-2-overlay rounded p-2 flex flex-col gap-2 h-[280px] bg-surface-elevated border border-primary">
                                <div className="flex justify-between items-center px-1 font-label-xs text-label-xs text-primary uppercase font-bold">
                                  <span>Live Feed Verification</span>
                                  <span className="text-error animate-pulse">REC</span>
                                </div>
                                <div className="flex-1 bg-black rounded border border-outline-variant relative overflow-hidden group">
                                  {incident.evidenceUrl ? (
                                    <img
                                      src={incident.evidenceUrl}
                                      alt="Full Evidence"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                                      NO EVIDENCE IMAGE ATTACHED
                                    </div>
                                  )}

                                  {/* Bounding Box Overlay */}
                                  {isCritical && (
                                    <div className="bounding-box top-[30%] left-[40%] w-[25%] h-[35%]">
                                      <div className="absolute -top-4 left-[-2px] bg-error text-on-error font-label-xs px-1 text-[9px] leading-none py-0.5 font-bold">
                                        THERMAL_ANOMALY 98%
                                      </div>
                                    </div>
                                  )}

                                  <div className="absolute bottom-2 left-2 glass-hud px-2 py-1 rounded border border-outline-variant font-data-mono text-[10px]">
                                    CAM-02-SRV-B | FPS: 29.97 | BR: 4.2Mbps
                                  </div>
                                </div>
                              </div>

                              {/* Column 2: Telemetry & Status */}
                              <div className="level-1-card rounded p-3 flex flex-col h-[280px]">
                                <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant pb-1 font-bold">
                                  Sensor Telemetry
                                </h3>
                                <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                                  <div className="flex justify-between items-center text-[12px] bg-surface-container p-1.5 rounded">
                                    <span className="text-on-surface-variant">Ambient Temp</span>
                                    <span className="text-error font-bold">{incident.telemetry.temp || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[12px] bg-surface-container p-1.5 rounded">
                                    <span className="text-on-surface-variant">Smoke Particles</span>
                                    <span className="text-error font-bold">{incident.telemetry.smokePpm || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[12px] bg-surface-container p-1.5 rounded">
                                    <span className="text-on-surface-variant">HVAC Status</span>
                                    <span className="text-primary font-bold">{incident.telemetry.hvacStatus || 'NORMAL'}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-[12px] bg-surface-container p-1.5 rounded">
                                    <span className="text-on-surface-variant">Fire Suppression</span>
                                    <span className="text-primary-container font-bold">{incident.telemetry.fireSuppression || 'STANDBY'}</span>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <div className="flex justify-between font-label-xs text-label-xs text-on-surface-variant mb-1">
                                    <span>Verification Sequence</span>
                                    <span className="text-primary font-bold">4/5 Steps</span>
                                  </div>
                                  <div className="flex gap-1 h-1.5">
                                    <div className="flex-1 bg-primary rounded-full"></div>
                                    <div className="flex-1 bg-primary rounded-full"></div>
                                    <div className="flex-1 bg-primary rounded-full"></div>
                                    <div className="flex-1 bg-primary rounded-full"></div>
                                    <div className="flex-1 bg-surface-variant rounded-full border border-outline-variant"></div>
                                  </div>
                                </div>
                              </div>

                              {/* Column 3: Actions & Notes */}
                              <div className="level-1-card rounded p-3 flex flex-col h-[280px]">
                                <h3 className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-3 border-b border-outline-variant pb-1 font-bold">
                                  Response Protocol
                                </h3>
                                <div className="flex flex-col gap-2 mb-auto">
                                  <button
                                    onClick={() => handleTriggerAlarm(incident.id)}
                                    className="bg-error hover:bg-red-700 text-on-error font-label-xs py-2 px-3 rounded flex justify-center items-center gap-2 font-bold transition-colors shadow-xs"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                                    TRIGGER FACILITY ALARM
                                  </button>
                                  <button
                                    onClick={() => handleDispatchSecurity(incident.id)}
                                    className="btn-ghost font-label-xs py-2 px-3 rounded flex justify-center items-center gap-2 transition-colors border-primary-container text-on-primary-container font-bold"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                                    Dispatch Security Team
                                  </button>
                                </div>

                                <div className="mt-3">
                                  <label className="font-label-xs text-label-xs text-on-surface-variant uppercase block mb-1 font-semibold">
                                    Operator Notes
                                  </label>
                                  <textarea
                                    value={operatorNotes[incident.id] || ''}
                                    onChange={(e) =>
                                      setOperatorNotes({
                                        ...operatorNotes,
                                        [incident.id]: e.target.value,
                                      })
                                    }
                                    className="w-full bg-surface-container border border-outline-variant rounded p-2 text-[12px] text-on-surface font-body-base focus:border-primary focus:ring-1 focus:ring-primary outline-none h-[60px] resize-none"
                                    placeholder="Add incident assessment..."
                                  />
                                  <div className="flex justify-end mt-1">
                                    <button
                                      onClick={() => handleSaveNotes(incident.id)}
                                      className="btn-primary font-label-xs px-2.5 py-1 rounded text-[10px] uppercase font-bold"
                                    >
                                      Save Log
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-surface-container-high border-t border-outline-variant p-3 flex justify-between items-center mt-auto">
            <span className="font-label-xs text-label-xs text-on-surface-variant">
              Showing 1-{filteredIncidents.length} of {incidents.length} incidents
            </span>
            <div className="flex gap-1">
              <button className="btn-ghost p-1 rounded opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button className="btn-ghost px-2.5 py-1 rounded font-data-mono text-[12px] bg-primary text-on-primary font-bold">
                1
              </button>
              <button className="btn-ghost p-1 rounded hover:text-primary">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
