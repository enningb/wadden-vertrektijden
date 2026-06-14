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
// ROUTES: departure windows expressed as two tidal anchors.
//   refStartTide / startOffset → when the window opens.
//   refEndTide   / endOffset   → when the window closes.
//   comment (optional): note shown in the results.
//   source  (optional): URL to the page where the route data was found.
// ─────────────────────────────────────────────────────────────────────────────

// ── PORTS ────────────────────────────────────────────────────────────────────
// loc:          Matroos API location name (null = island, uses refStation data)
// refStation:   Matroos loc whose tidal data is used for HW calculation
// hwOffsetMin:  minutes to ADD to refStation HW time to get local HW time
// alatOffset:   metres LAT/GLLWS is BELOW NAP (chart datum offset)
const PORTS = [
  { id: 'scheveningen',      name: 'Scheveningen',          loc: 'Scheveningen',      refStation: 'Scheveningen',      hwOffsetMin:   0, alatOffset: 0.80 },
  { id: 'ijmuiden',          name: 'IJmuiden',              loc: 'IJmuiden',          refStation: 'IJmuiden',          hwOffsetMin:   0, alatOffset: 0.80 },
  { id: 'denhelder',         name: 'Den Helder',            loc: 'denhelder',         refStation: 'denhelder',         hwOffsetMin:   0, alatOffset: 0.87 },
  { id: 'den-oever',         name: 'Den Oever',             loc: 'den oever buiten',  refStation: 'den oever buiten',  hwOffsetMin:   0, alatOffset: 0.87 },
  { id: 'oudeschild',        name: 'Oudeschild (Texel)',    loc: 'oudeschild',                refStation: 'oudeschild',         hwOffsetMin:  15, alatOffset: 0.90 },
  { id: 'oost-vlieland',     name: 'Oost-Vlieland',        loc: 'vlieland haven',     refStation: 'vlieland haven',    hwOffsetMin: 0, alatOffset: 0.90 },
  { id: 'west-terschelling',  name: 'West-Terschelling',   loc: 'west terschelling',  refStation: 'West-Terschelling', hwOffsetMin: -45, alatOffset: 1.05 },
  { id: 'harlingen',          name: 'Harlingen',           loc: 'harlingen',          refStation: 'harlingen',                   hwOffsetMin:   0, alatOffset: 1.10 },
  { id: 'kornwerderzand',     name: 'Kornwerderzand',      loc: 'Kornwerderzand buiten noord',   refStation: 'Kornwerderzand buiten noord', hwOffsetMin:   0, alatOffset: 1.05 },
  { id: 'nes',               name: 'Nes (Ameland)',         loc: 'nes',          refStation: 'nes',  hwOffsetMin:  40, alatOffset: 1.05 },
  { id: 'schiermonnikoog',   name: 'Schiermonnikoog',       loc: 'Schiermonnikoog Wadden',          refStation: 'Schiermonnikoog Wadden', hwOffsetMin: -30, alatOffset: 1.00 },
  { id: 'lauwersoog',        name: 'Lauwersoog',            loc: 'lauwersoog',  refStation: 'lauwersoog', hwOffsetMin:   0, alatOffset: 1.05 },
  { id: 'delfzijl',          name: 'Delfzijl',              loc: 'delfzijl',    refStation: 'delfzijl',   hwOffsetMin:   0, alatOffset: 1.30 },
  { id: 'borkum',            name: 'Borkum',                loc: 'borkum',          refStation: 'borkum',   hwOffsetMin: -60, alatOffset: 1.67 },
];

// ALAT offset per Matroos reference station (for tidal overview display)
const STATION_ALAT = {
  Scheveningen:       0.80,
  IJmuiden:           0.80,
  denhelder:          0.87,
  'den oever buiten': 0.87,
  'vlieland haven':   0.90,
  harlingen:                    1.10,
  'Kornwerderzand buiten noord': 1.05,
  lauwersoog:                   1.05,
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
  // ── Scheveningen vertrek ─────────────────────────────────────────────────
  { from: 'scheveningen', to: 'ijmuiden',   refStation: 'Scheveningen', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  5, via: 'Noordzee kust', comment: 'Vloed mee richting noorden; tijdvenster bij benadering.' },
  { from: 'scheveningen', to: 'denhelder',  refStation: 'Scheveningen', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  5, via: 'Noordzee kust', comment: 'Vloed mee richting noorden; tijdvenster bij benadering.' },

  // ── IJmuiden vertrek ──────────────────────────────────────────────────────
  { from: 'ijmuiden', to: 'scheveningen',   refStation: 'IJmuiden',     refStartTide: 'HW', startOffset:  0, refEndTide: 'HW', endOffset:  6, via: 'Noordzee kust', comment: 'Eb mee richting zuiden; tijdvenster bij benadering.' },
  { from: 'ijmuiden', to: 'denhelder',      refStation: 'IJmuiden',     refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  4, via: 'Noordzee kust', comment: 'Vloed mee richting noorden; tijdvenster bij benadering.' },
  { from: 'ijmuiden', to: 'den-oever',      refStation: 'IJmuiden',     refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  4, via: 'Noordzee kust / Amsteldiep', comment: 'Tijdvenster bij benadering.' },



  // ── Den Helder vertrek ────────────────────────────────────────────────────
  { from: 'denhelder',         to: 'ijmuiden',      refStation: 'denhelder',    refStartTide: 'HW', startOffset:  1, refEndTide: 'HW', endOffset:  1, via: 'Schulpengat en Noordzee kust', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: 'Eb mee richting zuiden; tijdvenster bij benadering.' },
  { from: 'denhelder',         to: 'scheveningen',  refStation: 'denhelder',    refStartTide: 'HW', startOffset:  1, refEndTide: 'HW', endOffset:  1, via: 'Schulpengat en Noordzee kust', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: 'Eb mee richting zuiden; tijdvenster bij benadering.' },
  { from: 'denhelder',         to: 'den-oever',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -4, refEndTide: 'HW', endOffset:  -2, via: 'Malzwin en Visjagersgaatje', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'denhelder',         to: 'kornwerderzand',     refStation: 'denhelder',  refStartTide: 'HW', startOffset: -5, refEndTide: 'HW', endOffset:  -5, via: 'Texelstroom' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'denhelder',         to: 'oudeschild',         refStation: 'denhelder',  refStartTide: 'LW', startOffset: -1, refEndTide: 'LW', endOffset:  3, via: 'Marsdiep / Texelstroom' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'denhelder',         to: 'oost-vlieland',      refStation: 'denhelder',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Scheurrak' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'denhelder',         to: 'oost-vlieland',      refStation: 'denhelder',  refStartTide: 'HW', startOffset: -6, refEndTide: 'HW', endOffset:  -6, via: 'Molengat (buitenom)' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'denhelder',         to: 'harlingen',          refStation: 'denhelder',  refStartTide: 'HW', startOffset: -5, refEndTide: 'HW', endOffset:  -5, via: 'Texelstroom' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},

  // ── Oudeschild (Texel) vertrek ────────────────────────────────────────────
  { from: 'oudeschild',        to: 'ijmuiden',           refStation: 'oudeschild',  refStartTide: 'HW', startOffset: -0.5, refEndTide: 'HW', endOffset: -0.5, via: 'Schulpengat' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'oudeschild',        to: 'scheveningen',       refStation: 'oudeschild',  refStartTide: 'HW', startOffset: -0.5, refEndTide: 'HW', endOffset: -0.5, via: 'Schulpengat' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'oudeschild',        to: 'den-oever',          refStation: 'oudeschild',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'De Bollen', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'oudeschild',        to: 'den-oever',          refStation: 'oudeschild',  refStartTide: 'LW', startOffset: -0.5, refEndTide: 'LW', endOffset:  -0.5, via: 'De Bollen', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'oudeschild',        to: 'kornwerderzand',     refStation: 'oudeschild',  refStartTide: 'LW', startOffset: 1, refEndTide: 'LW', endOffset:  3, via: 'Texelstroom', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: ''},
  { from: 'oudeschild',        to: 'harlingen',          refStation: 'oudeschild',  refStartTide: 'LW', startOffset: 1, refEndTide: 'LW', endOffset:  2, via: 'Texelstroom', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oudeschild',        to: 'oost-vlieland',      refStation: 'oudeschild',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Scheurrak', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oudeschild',        to: 'oost-vlieland',      refStation: 'oudeschild',  refStartTide: 'LW', startOffset: -1, refEndTide: 'LW', endOffset:  -1, via: 'Molengat (buitenom)', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oudeschild',        to: 'west-terschelling',  refStation: 'oudeschild',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Scheurrak', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: 'idem als Vlieland' },
  { from: 'oudeschild',        to: 'west-terschelling',  refStation: 'oudeschild',  refStartTide: 'LW', startOffset: -1, refEndTide: 'LW', endOffset:  -1, via: 'Molengat (buitenom)', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: 'idem als Vlieland' },
  { from: 'oudeschild',        to: 'denhelder',          refStation: 'oudeschild',  refStartTide: 'LW', startOffset: -4, refEndTide: 'LW', endOffset: 0, via: 'Texelstroom', source: 'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },

// ── Oost-Vlieland vertrek ─────────────────────────────────────────────────
  { from: 'oost-vlieland',     to: 'west-terschelling',  refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Schuitengat', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'west-terschelling',  refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'denhelder',          refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'denhelder',          refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'oudeschild',         refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'oudeschild',         refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: 0.5, refEndTide: 'HW', endOffset:  0.5, via: 'Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'harlingen',          refStation: 'vlieland haven',  refStartTide: 'LW', startOffset: 2, refEndTide: 'LW', endOffset:  2, via: 'Blauwe Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'kornwerderzand',     refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -1, via: 'Boontjes', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'oost-vlieland',     to: 'kornwerderzand',     refStation: 'vlieland haven',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },

  // ── West-Terschelling vertrek ─────────────────────────────────────────────
  { from: 'west-terschelling', to: 'oost-vlieland',      refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset: -1, via: 'Schuitengat', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'oost-vlieland',      refStation: 'west-terschelling',  refStartTide: 'LW', startOffset: -2, refEndTide: 'LW', endOffset:  -2, via: 'Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'denhelder',          refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Schuitengat via Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'denhelder',          refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Slenk via Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },

  { from: 'west-terschelling', to: 'oudeschild',         refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Schuitengat via Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'oudeschild',         refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Slenk via Noordzee', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },
  { from: 'west-terschelling', to: 'oudeschild',         refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'Schuitengat', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'oudeschild',         refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  
  { from: 'west-terschelling', to: 'harlingen',          refStation: 'west-terschelling',  refStartTide: 'LW', startOffset: -1, refEndTide: 'LW', endOffset:  -1, via: 'Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' }, 
  { from: 'west-terschelling', to: 'kornwerderzand',     refStation: 'west-terschelling',  refStartTide: 'LW', startOffset: -3, refEndTide: 'HW', endOffset:  -1, via: 'Blauwe Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'west-terschelling', to: 'kornwerderzand',     refStation: 'west-terschelling',  refStartTide: 'HW', startOffset: -4, refEndTide: 'HW', endOffset:  -3, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },


  // ── Harlingen vertrek ─────────────────────────────────────────────────────
  { from: 'harlingen',         to: 'kornwerderzand',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  3, via: 'Boontjes', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'harlingen',         to: 'oudeschild',      refStation: 'harlingen',  refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  0, via: 'Boontjes', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'harlingen',         to: 'denhelder',       refStation: 'harlingen',  refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  0, via: 'Boontjes', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'harlingen',         to: 'west-terschelling',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: 2, refEndTide: 'HW', endOffset:  2, via: 'Schuitengat', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'harlingen',         to: 'oost-vlieland',  refStation: 'harlingen',  refStartTide: 'HW', startOffset: 2, refEndTide: 'HW', endOffset:  2, via: 'Schuitengat', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'harlingen',         to: 'nes',         refStation: 'harlingen',  refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'wantij', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  
  // ── Kornwerderzand vertrek ───────────────────────────────────────────────
  { from: 'kornwerderzand', to: 'oudeschild',         refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  2, via: 'direct', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'denhelder',         refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  1, via: 'direct', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'oost-vlieland',     refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  0, via: 'Blauwe Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'oost-vlieland',     refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'west-terschelling',     refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  0, via: 'Blauwe Slenk', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'west-terschelling',     refStation: 'Kornwerderzand buiten noord', refStartTide: 'HW', startOffset: -1, refEndTide: 'HW', endOffset:  -1, via: 'Inschot', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment: '' },
  { from: 'kornwerderzand', to: 'harlingen', refStation: 'Kornwerderzand buiten noord', refStartTide: 'LW', startOffset: 0, refEndTide: 'LW', endOffset:  4, via: 'Boontjes', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },
  

  // ── Den Oever vertrek ────────────────────────────────────────────────────
  { from: 'den-oever', to: 'denhelder',   refStation: 'den oever buiten', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  3, via: 'Visjagersgaatje / Malzwin', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },
  { from: 'den-oever', to: 'oudeschild',  refStation: 'den oever buiten', refStartTide: 'HW', startOffset: 0, refEndTide: 'HW', endOffset:  0, via: 'de Bollen', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },
  { from: 'den-oever', to: 'oudeschild',  refStation: 'den oever buiten', refStartTide: 'LW', startOffset: -1.5, refEndTide: 'LW', endOffset:  -1.5, via: 'Gat van de Stier', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },

  // ── Nes (Ameland) vertrek ─────────────────────────────────────────────────
  { from: 'nes',               to: 'schiermonnikoog',     refStation: 'nes',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'max. diepgang 130cm', source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: 'vaartijd 3 tot 4 uur.' },
  { from: 'nes',               to: 'lauwersoog',          refStation: 'nes',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'max. diepgang 140cm', source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: 'vaartijd 3 tot 4 uur.' },
  { from: 'nes',               to: 'west-terschelling',   refStation: 'nes',  refStartTide: 'HW', startOffset: -3, refEndTide: 'HW', endOffset:  -3, via: 'max. diepgang 160cm', source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: 'vaartijd 5 tot 6 uur.' },
  { from: 'nes',               to: 'harlingen',           refStation: 'nes',  refStartTide: 'HW', startOffset: -4, refEndTide: 'HW', endOffset:  -4, via: 'Kimstergat, max. diepgang 100cm', source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: 'vaartijd 5 tot 6 uur.' },
  { from: 'nes',               to: 'west-terschelling',   refStation: 'nes', refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Noordzee' , source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: '' },
  { from: 'nes',               to: 'oost-vlieland',   refStation: 'nes', refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Noordzee', source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: '' },
  { from: 'nes',               to: 'lauwersoog',    refStation: 'nes', refStartTide: 'LW', startOffset: -3, refEndTide: 'LW', endOffset:  -3, via: 'Noordzee' , source: 'https://www.waddenhavens.nl/nl/ameland?view=article&id=10:advies-vertrektijden-ameland&catid=8', comment: '' },

  // ── Lauwersoog vertrek ────────────────────────────────────────────────────
  { from: 'lauwersoog',        to: 'schiermonnikoog',    refStation: 'lauwersoog', refStartTide: 'HW', startOffset: 0.5, refEndTide: 'HW', endOffset:  0.5, via: 'Zoutkamperlaag', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },

  // ── Schiermonnikoog vertrek ───────────────────────────────────────────────
  { from: 'schiermonnikoog',   to: 'lauwersoog',         refStation: 'lauwersoog', refStartTide: 'HW', startOffset: -2, refEndTide: 'HW', endOffset:  -2, via: 'Zoutkamperlaag' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },
  
  // ── Delfzijl vertrek ──────────────────────────────────────────────────────
  { from: 'delfzijl',          to: 'borkum',    refStation: 'delfzijl',   refStartTide: 'HW', startOffset: -6, refEndTide: 'HW', endOffset:  -3, via: 'Eems', source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },

  // ── Borkum vertrek ──────────────────────────────────────────────────────
  { from: 'borkum',            to: 'delfzijl',  refStation: 'delfzijl',   refStartTide: 'HW', startOffset: -6, refEndTide: 'HW', endOffset:  -3, via: 'Eems' , source:'https://www.watersportalmanak.nl/artikel/vertrektijden-jachthavens', comment:'' },

];
