// view.js: Rendering functions for ICC Inspector

function renderTree(obj, label, isRoot=false) {
  if (obj === null || typeof obj !== 'object') {
    return document.createTextNode(String(obj));
  }
  // Special case: render HTML string for matrix3x3Type
  if (obj && typeof obj === 'object' && obj.__html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = obj.__html;
    return wrapper;
  }
  const details = document.createElement('details');
  details.open = isRoot;
  if (label) {
    const summary = document.createElement('summary');
    summary.textContent = label;
    details.appendChild(summary);
  }
  const ul = document.createElement('ul');
  for (const key in obj) {
    const li = document.createElement('li');
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      li.appendChild(renderTree(obj[key], key, false));
    } else {
      // Если значение уже содержит HTML (<pre> для текста/XML)
      if (typeof obj[key] === 'string' && obj[key].startsWith('<pre>')) {
        li.innerHTML = `<strong>${key}:</strong> ${obj[key]}`;
      } else {
        li.innerHTML = `<strong>${key}:</strong> ${obj[key]}`;
      }
    }
    ul.appendChild(li);
  }
  details.appendChild(ul);
  return details;
}



function renderXMLTree(node) {
  if (!node) return '';
  if (node.nodeType === 3) { // text
    const text = node.nodeValue.trim();
    if (!text) return '';
    return document.createTextNode(text);
  }
  const details = document.createElement('details');
  details.open = false;
  const summary = document.createElement('summary');
  summary.textContent = `<${node.nodeName}>` + (node.attributes && node.attributes.length ?
    Array.from(node.attributes).map(a => ` ${a.name}="${a.value}"`).join('') : '');
  details.appendChild(summary);
  const ul = document.createElement('ul');
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const li = document.createElement('li');
    const rendered = renderXMLTree(child);
    if (rendered) li.appendChild(rendered);
    ul.appendChild(li);
  }
  details.appendChild(ul);
  return details;
}

// Export for main.js
window.renderTree = renderTree;

window.renderXMLTree = renderXMLTree;
