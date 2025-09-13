# Project Structure for ICC-profile-Inspector

## Overview
This document describes the structure of the ICC-profile-Inspector project, including the main files, their responsibilities, and the dependencies between functions and modules.

---

## File Structure

- `ICC Schema driven.html`  
  Main HTML file. Loads scripts, provides UI, and handles user interaction.

- `parse.js`  
  Contains functions for schema-driven parsing of ICC profiles.

- `view.js`  
  Contains functions for rendering parsed data (trees, matrices, XML, etc.) to the UI.

- `utils.js`  
  Contains utility/helper functions (e.g., ASCII reading, hex dump, HTML escaping, matrix rendering).

- `icc_struct.json`  
  JSON schema describing ICC tag structures.

---

## Module & Function Dependencies

### ICC Schema driven.html
- Loads and uses:
  - `parse.js` (window.parseBySchema, window.resolveSchema, window.pickSchema)
  - `view.js` (window.renderTree, window.renderMatrix3x3, window.renderXMLTree)
  - `utils.js` (window.readAscii, window.formatHexDump, window.escapeHTML, window.renderMatrix3x3)
- Handles file input, invokes parsing, and calls rendering helpers.

### parse.js
- Exports:
  - `resolveSchema`
  - `parseBySchema`
  - `pickSchema`
- Depends on:
  - `icc_struct.json` (for schema definitions)
  - May use helpers from `utils.js` (e.g., for reading ASCII)

### view.js
- Exports:
  - `renderTree`
  - `renderMatrix3x3`
  - `renderXMLTree`
- Depends on:
  - `utils.js` (for HTML escaping, matrix rendering, etc.)

### utils.js
- Exports:
  - `readAscii`
  - `formatHexDump`
  - `escapeHTML`
  - `renderMatrix3x3`
- Pure helpers, no dependencies on other modules.

---

## Function Usage Map

- `parseBySchema` (parse.js): Used by main script to parse tag data according to schema.
- `resolveSchema` (parse.js): Used to find schema for a tag.
- `pickSchema` (parse.js): Used to select appropriate schema for a tag.
- `renderTree` (view.js): Used to render parsed objects as a tree in the UI.
- `renderMatrix3x3` (view.js/utils.js): Used to render 3x3 matrices (e.g., chad tag) in the UI.
- `renderXMLTree` (view.js): Used to render XML (e.g., CxF/zXML tag) as a tree.
- `escapeHTML` (utils.js): Used to safely display text in the UI.
- `readAscii` (utils.js): Used to read ASCII strings from DataView.
- `formatHexDump` (utils.js): Used to display raw hex data for unknown or error tags.

---

## Data Flow

1. User loads ICC file via UI (HTML).
2. Main script reads file, extracts tag data.
3. For each tag:
   - Uses `parse.js` to parse data according to schema.
   - Uses `view.js` and `utils.js` to render parsed data appropriately.
4. UI displays parsed and rendered tag data.

---

## External Dependencies
- [pako](https://github.com/nodeca/pako) (for zlib decompression, e.g., CxF/zXML tags)
- [DOMParser] (native, for XML parsing)

---

## Notes
- All helper functions are exported to `window` for use in the main HTML script.
- No direct DOM/UI code in JS modules; rendering helpers return HTML strings or DOM nodes.
- All tag-specific logic (e.g., chad, CxF/zXML, textType) is handled in main script using helpers.

---

_Last updated: 2025-09-13_
