// utils.js: Utility functions for ICC Inspector

function readAscii(view, off, len) {
  return Array.from({length: len}, (_, i) => String.fromCharCode(view.getUint8(off + i))).join('');
}

function formatHexDump(uint8arr) {
  return formatHexDump(uint8arr, 0);
}

function formatHexDump(uint8arr, baseOffset=0) {
  let lines = '';
  for (let i = 0; i < uint8arr.length; i += 16) {
    const addr = (baseOffset + i).toString(16).padStart(8, '0');
    let hex = '';
    let ascii = '';
    for (let j = 0; j < 16; j++) {
      if (i + j < uint8arr.length) {
        const b = uint8arr[i + j];
        hex += b.toString(16).padStart(2, '0') + ' ';
        ascii += (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.';
      } else {
        hex += '   ';
        ascii += ' ';
      }
    }
    lines += addr + ': ' + hex + ' | ' + ascii + '\n';
  }
  return `<pre>${lines}</pre>`;
}


function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
  });
}

function renderMatrix3x3(obj) {
  if (!('m00' in obj)) return '';
  let html = '<table style="border-collapse:collapse;margin:5px 0;">';
  for (let r = 0; r < 3; r++) {
    html += '<tr>';
    for (let c = 0; c < 3; c++) {
      html += `<td style="border:1px solid #ccc;padding:2px 6px;">${obj[`m${r}${c}`]}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

// Export for main.js and parse.js
window.readAscii = readAscii;
window.formatHexDump = formatHexDump;
window.escapeHTML = escapeHTML;
window.renderMatrix3x3 = renderMatrix3x3;
window.sanitizeText = function(str) {
  if (str === undefined || str === null) return '';
  // Remove leading/trailing whitespace and NUL chars, and trim
  return String(str).replace(/^\u0000+|\u0000+$/g, '').trim();
};
