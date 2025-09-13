// utils.js: Utility functions for ICC Inspector

function readAscii(view, off, len) {
  return Array.from({length: len}, (_, i) => String.fromCharCode(view.getUint8(off + i))).join('');
}

function formatHexDump(uint8arr) {
  let lines = '';
  for (let i = 0; i < uint8arr.length; i += 16) {
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
    lines += hex + ' | ' + ascii + '\n';
  }
  return `<pre>${lines}</pre>`;
}

// Export for main.js and parse.js
window.readAscii = readAscii;
window.formatHexDump = formatHexDump;
