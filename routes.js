'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Waddenzee Vertrektijden — Port & Route Data
// ─────────────────────────────────────────────────────────────────────────────
// To add a new haven:
//   1. Add an entry to PORTS with a unique id, the Matroos API loc name (or null
//      for island ports), its reference mainland station, and its ALAT offset.
//   2. Add ROUTES entries for every relevant departure–destination pair.
//
// ALAT (alatOffset): GLLWS/LAT below NAP in metres (positive number).
//   Water depth above chart datum = NAP height + alatOffset.
//   Source: ANWB Almanak voor Watertoerisme / Dutch Hydrographic Office.
//
// ROUTES (minHW / maxHW): hours relative to HW at refStation.
//   Negative = before HW, positive = after HW.
//   Source: ANWB Almanak voor Watertoerisme (approximate — always verify).
// ─────────────────────────────────────────────────────────────────────────────

// ── PORTS ────────────────────────────────────────────────────────────────────
// loc:          Matroos API location name (null = island, uses refStation data)
// refStation:   Matroos loc whose tidal data is used for HW calculation
// hwOffsetMin:  minutes to ADD to refStation HW time to get local HW time
// alatOffset:   metres LAT/GLLWS is BELOW NAP (chart datum offset)
const PORTS = [
  { id: 'denhelder',         name: 'Den Helder',           loc: 'denhelder',   refStation: 'denhelder',  hwOffsetMin:   0, alatOffset: 0.87 },
  { id: 'oudeschild',        name: 'Oudeschild (Texel)',    loc: null,          refStation: 'denhelder',  hwOffsetMin:  15, alatOffset: 0.90 },
  { id: 'oost-vlieland',     name: 'Oost-Vlieland',        loc: 'vlieland',    refStation: 'vlieland',   hwOffsetMin:   0, alatOffset: 0.90 },
  { id: 'west-terschelling', name: 'West-Terschelling',    loc: null,          refStation: 'harlingen',  hwOffsetMin: -45, alatOffset: 1.05 },
  { id: 'harlingen',         name: 'Harlingen',             loc: 'harlingen',   refStation: 'harlingen',  hwOffsetMin:   0, alatOffset: 1.10 },
  { id: 'nes',               name: 'Nes (Ameland)',         loc: null,          refStation: 'harlingen',  hwOffsetMin:  40, alatOffset: 1.05 },
  { id: 'schiermonnikoog',   name: 'Schiermonnikoog',       loc: null,          refStation: 'lauwersoog', hwOffsetMin: -30, alatOffset: 1.00 },
  { id: 'lauwersoog',        name: 'Lauwersoog',            loc: 'lauwersoog',  refStation: 'lauwersoog', hwOffsetMin:   0, alatOffset: 1.05 },
  { id: 'delfzijl',          name: 'Delfzijl',              loc: 'delfzijl',    refStation: 'delfzijl',   hwOffsetMin:   0, alatOffset: 1.30 },
];

// ALAT offset per Matroos reference station (for tidal overview display)
const STATION_ALAT = {
  denhelder:  0.87,
  vlieland:   0.90,
  harlingen:  1.10,
  lauwersoog: 1.05,
  delfzijl:   1.30,
};

// ── ROUTES ───────────────────────────────────────────────────────────────────
// from / to:       port IDs (must match PORTS[].id)
// refStation:      which Matroos station's extrema are used as departure reference
// refStartTide:    'HW' or 'LW' — tidal event the window OPENS relative to
// startOffset:     hours before (-) or after (+) refStartTide when window opens
// refEndTide:      'HW' or 'LW' — tidal event the window CLOSES relative to
// endOffset:       hours before (-) or after (+) refEndTide when window closes
// via:             route/gat description (informational)
//
// Example: refStartTide:'LW', startOffset:+2, refEndTide:'HW', endOffset:+1
//   → window opens 2h after LW and closes 1h after the following HW
const ROUTES = [
  // ── Den Helder vertrek ────────────────────────────────────────────────────
  { from: 'denhelder',         to: 'oudeschild',         refStation: 'denhelder',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  5, via: 'Marsdiep / Texelstroom' },
  { from: 'denhelder',         to: 'oost-vlieland',      refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Texelstroom / Vliestroom' },
  { from: 'denhelder',         to: 'west-terschelling',  refStation: 'denhelder',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  1, via: 'Vliestroom' },
  { from: 'denhelder',         to: 'harlingen',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  0, via: 'Vliestroom / Zuider Stortemelk' },

  // ── Oudeschild (Texel) vertrek ────────────────────────────────────────────
  { from: 'oudeschild',        to: 'denhelder',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -5, refEndTide: 'HW', endOffset:  1, via: 'Texelstroom / Marsdiep' },
  { from: 'oudeschild',        to: 'oost-vlieland',      refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom' },
  { from: 'oudeschild',        to: 'west-terschelling',  refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  1, via: 'Vliestroom' },
  { from: 'oudeschild',        to: 'harlingen',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  0, via: 'Vliestroom' },

  // ── Harlingen vertrek ─────────────────────────────────────────────────────
  { from: 'harlingen',         to: 'west-terschelling',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom' },
  { from: 'harlingen',         to: 'oost-vlieland',      refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Blauwe Slenk' },
  { from: 'harlingen',         to: 'nes',                refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Boontjesroute / Pinkegat' },
  { from: 'harlingen',         to: 'lauwersoog',         refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  1, via: 'Zoutkamperlaag' },
  { from: 'harlingen',         to: 'denhelder',          refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Vliestroom' },
  { from: 'harlingen',         to: 'oudeschild',         refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Vliestroom' },

  // ── Oost-Vlieland vertrek ─────────────────────────────────────────────────
  { from: 'oost-vlieland',     to: 'denhelder',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom / Texelstroom' },
  { from: 'oost-vlieland',     to: 'oudeschild',         refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom' },
  { from: 'oost-vlieland',     to: 'west-terschelling',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  3, via: 'Vliestroom' },
  { from: 'oost-vlieland',     to: 'harlingen',          refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Blauwe Slenk' },

  // ── West-Terschelling vertrek ─────────────────────────────────────────────
  { from: 'west-terschelling', to: 'harlingen',          refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom' },
  { from: 'west-terschelling', to: 'oost-vlieland',      refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  3, via: 'Vliestroom' },
  { from: 'west-terschelling', to: 'nes',                refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Boontjesroute' },
  { from: 'west-terschelling', to: 'lauwersoog',         refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  1, via: 'Zoutkamperlaag' },
  { from: 'west-terschelling', to: 'denhelder',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Vliestroom / Texelstroom' },
  { from: 'west-terschelling', to: 'oudeschild',         refStation: 'denhelder',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  2, via: 'Vliestroom' },

  // ── Nes (Ameland) vertrek ─────────────────────────────────────────────────
  { from: 'nes',               to: 'harlingen',          refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Boontjesroute / Pinkegat' },
  { from: 'nes',               to: 'west-terschelling',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Boontjesroute' },
  { from: 'nes',               to: 'lauwersoog',         refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Pinkegat / Westgat' },
  { from: 'nes',               to: 'schiermonnikoog',    refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat' },

  // ── Lauwersoog vertrek ────────────────────────────────────────────────────
  { from: 'lauwersoog',        to: 'nes',                refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat / Pinkegat' },
  { from: 'lauwersoog',        to: 'schiermonnikoog',    refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat' },
  { from: 'lauwersoog',        to: 'harlingen',          refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  1, via: 'Zoutkamperlaag' },
  { from: 'lauwersoog',        to: 'west-terschelling',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  1, via: 'Zoutkamperlaag' },
  { from: 'lauwersoog',        to: 'delfzijl',           refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  1, via: 'Zoutkamperlaag / Eems' },

  // ── Delfzijl vertrek ──────────────────────────────────────────────────────
  { from: 'delfzijl',          to: 'schiermonnikoog',    refStation: 'delfzijl',   refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Eems / Westgat' },
  { from: 'delfzijl',          to: 'lauwersoog',         refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  1, via: 'Eems / Zoutkamperlaag' },

  // ── Schiermonnikoog vertrek ───────────────────────────────────────────────
  { from: 'schiermonnikoog',   to: 'lauwersoog',         refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat' },
  { from: 'schiermonnikoog',   to: 'nes',                refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat / Pinkegat' },
  { from: 'schiermonnikoog',   to: 'delfzijl',           refStation: 'delfzijl',   refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  3, via: 'Westgat / Eems' },
];
