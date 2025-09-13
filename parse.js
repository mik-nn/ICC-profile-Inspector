// parse.js: ICC/Tag parsing logic

function _resolveSchema(key, schemaMap, schemaResolved) {
  if (schemaResolved[key]) return schemaResolved[key];
  const raw = schemaMap[key];
  if (!raw) return null;
  if (raw.$ref) return _resolveSchema(raw.$ref, schemaMap, schemaResolved);
  schemaResolved[key] = raw;
  return raw;
}

function _parseBySchema(view, schema, startOffset=0, ctx={}) {
  let offset = startOffset;
  const res = {};
  for (const f of schema.fields) {
    if (f.enum && f.type.startsWith('u')) {
      const raw = view.getUint32(offset, false);
      res[f.name] = raw + " (" + (f.enum[raw] || "Unknown") + ")";
      offset += 4;
      continue;
    }
    if (f.bitflags && f.type === 'u32') {
      const raw = view.getUint32(offset, false);
      const setFlags = [];
      for (const bit in f.bitflags) {
        if (raw & (1 << bit)) setFlags.push(f.bitflags[bit]);
      }
      res[f.name] = raw + (setFlags.length ? " [" + setFlags.join(', ') + "]" : "");
      offset += 4;
      continue;
    }
    if (f.type === 'string') {
      let len = f.length || 0;
      if (f.lengthField && f.lengthField === "remaining") {
        len = (ctx.tagSize || 0) - (offset - startOffset);
      } else if (f.lengthField && res[f.lengthField] !== undefined) {
        len = res[f.lengthField];
      }
      res[f.name] = readAscii(view, offset, len);
      offset += len;
    } else if (f.type === 'u8') {
      res[f.name] = view.getUint8(offset); offset += 1;
    } else if (f.type === 'u16') {
      res[f.name] = view.getUint16(offset, false); offset += 2;
    } else if (f.type === 'u32') {
      res[f.name] = view.getUint32(offset, false); offset += 4;
    } else if (f.type === 's15Fixed16') {
      res[f.name] = view.getInt32(offset, false) / 65536; offset += 4;
    } else if (f.type === 'bytes') {
      let len = f.length || 0;
      if (f.lengthField && f.lengthField === "remaining") {
        len = (ctx.tagSize || 0) - (offset - startOffset);
      }
      const bytes = new Uint8Array(view.buffer, offset, len);
      res[f.name] = bytes;
      offset += len;
    }
  }
  return res;
}

function _pickSchema(tagSig, view, offset, schemaMap, schemaResolved) {
  if (schemaMap[tagSig]) return _resolveSchema(tagSig, schemaMap, schemaResolved);
  const typeSig = readAscii(view, offset, 4);
  if (schemaMap[typeSig]) return _resolveSchema(typeSig, schemaMap, schemaResolved);
  if (typeSig === 'mft1') return _resolveSchema('mft1', schemaMap, schemaResolved);
  if (typeSig === 'mft2') return _resolveSchema('mft2', schemaMap, schemaResolved);
  if (tagSig === 'chad' || typeSig === 'chad') return _resolveSchema('matrix3x3Type', schemaMap, schemaResolved);
  if (["text", "desc", "mluc", "XYZ ", "curv", "ZXML"].includes(typeSig)) {
    return _resolveSchema(typeSig, schemaMap, schemaResolved);
  }
  return null;
}

// Export for main.js
// Export stable API to window; internal implementations are prefixed with _ to avoid global name collisions
window.resolveSchema = function(key, schemaMap, schemaResolved) { return _resolveSchema(key, schemaMap, schemaResolved); };
window.parseBySchema = function(view, schema, startOffset=0, ctx={}) {
  const res = _parseBySchema(view, schema, startOffset, ctx);
  try {
    if (schema && schema.name === 'ICCHeader') {
      const y = res.creationDate_year || 0;
      const mo = res.creationDate_month || 0;
      const d = res.creationDate_day || 0;
      const h = res.creationDate_hours || 0;
      const mi = res.creationDate_minutes || 0;
      const s = res.creationDate_seconds || 0;
      const pad = n => String(n).padStart(2, '0');
      // Format like: 2025-07-18 15:34;52 (semicolor before seconds as requested)
      res.creationDate = `${y}-${pad(mo)}-${pad(d)} ${pad(h)}:${pad(mi)};${pad(s)}`;
      // Remove individual fields to keep output concise
      delete res.creationDate_year;
      delete res.creationDate_month;
      delete res.creationDate_day;
      delete res.creationDate_hours;
      delete res.creationDate_minutes;
      delete res.creationDate_seconds;
    }
    // Decode mlucType (multi-localized Unicode) into readable strings
    if (schema && schema.name === 'mlucType') {
      try {
        const base = startOffset;
        const count = Number(res.count) || 0;
        const recordSize = Number(res.recordSize) || 0;
        const records = [];
        let recOffset = base + 16; // header (4+4+4+4)
        for (let i = 0; i < count; i++) {
          const lang = window.readAscii(view, recOffset, 2);
          const country = window.readAscii(view, recOffset + 2, 2);
          const length = view.getUint32(recOffset + 4, false);
          const strOffset = view.getUint32(recOffset + 8, false);
          let text = '';
          if (strOffset + length <= (res.tagSize || ctx.tagSize || 0)) {
            try {
              const bytes = new Uint8Array(view.buffer, base + strOffset, length);
              text = new TextDecoder('utf-16be').decode(bytes);
            } catch (e) {
              text = '[decode error]';
            }
          } else {
            // try best-effort without strict bounds
            try {
              const bytes = new Uint8Array(view.buffer, base + strOffset, length);
              text = new TextDecoder('utf-16be').decode(bytes);
            } catch (e) {
              text = '[out of bounds]';
            }
          }
          records.push({ lang, country, text });
          recOffset += recordSize || 12;
        }
        res.localized = records;
        // also expose asciiString for backward compatible rendering (join multiple locales)
        res.asciiString = records.map(r => `${r.lang}-${r.country}: ${r.text}`).join('\n\n');
      } catch (e) {
        // ignore mluc decode errors
      }
    }
  } catch (e) {
    // ignore formatting errors
  }
  return res;
};
window.pickSchema = function(tagSig, view, offset, schemaMap, schemaResolved) { return _pickSchema(tagSig, view, offset, schemaMap, schemaResolved); };
