// parse.js: ICC/Tag parsing logic

function resolveSchema(key, schemaMap, schemaResolved) {
  if (schemaResolved[key]) return schemaResolved[key];
  const raw = schemaMap[key];
  if (!raw) return null;
  if (raw.$ref) return resolveSchema(raw.$ref, schemaMap, schemaResolved);
  schemaResolved[key] = raw;
  return raw;
}

function parseBySchema(view, schema, startOffset=0, ctx={}) {
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

function pickSchema(tagSig, view, offset, schemaMap, schemaResolved) {
  if (schemaMap[tagSig]) return resolveSchema(tagSig, schemaMap, schemaResolved);
  const typeSig = readAscii(view, offset, 4);
  if (schemaMap[typeSig]) return resolveSchema(typeSig, schemaMap, schemaResolved);
  if (typeSig === 'mft1') return resolveSchema('mft1', schemaMap, schemaResolved);
  if (typeSig === 'mft2') return resolveSchema('mft2', schemaMap, schemaResolved);
  if (tagSig === 'chad' || typeSig === 'chad') return resolveSchema('matrix3x3Type', schemaMap, schemaResolved);
  if (["text", "desc", "mluc", "XYZ ", "curv", "ZXML"].includes(typeSig)) {
    return resolveSchema(typeSig, schemaMap, schemaResolved);
  }
  return null;
}

// Export for main.js
window.resolveSchema = resolveSchema;
window.parseBySchema = parseBySchema;
window.pickSchema = pickSchema;
