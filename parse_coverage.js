// PARA SABER LOS ARCHIVOS QUE FALTAN POR DOCUMENTAR DE MANERA AUTOMATIZADA  


const fs = require('fs');

const content = fs.readFileSync('docs/coverage.html', 'utf8');

const rowRegex = /<tr class="([^"]+)">([\s\S]*?)<\/tr>/g;
const fileRegex = /<a href="[^"]+">([^<]+)<\/a>/;
const results = [];
let match;
while ((match = rowRegex.exec(content)) !== null) {
  const rowHtml = match[2];

  const fileMatch = rowHtml.match(fileRegex);
  const percentMatch = rowHtml.match(/<span class="coverage-percent">([^<]+)<\/span>/);
  const countMatch = rowHtml.match(/<span class="coverage-count">\(([^)]+)\)<\/span>/);

  const tdParts = rowHtml.split(/<\/td>/).map(s => s.replace(/<[^>]+>/g, '').trim());
  
  if (fileMatch && percentMatch) {
    const filename = fileMatch[1].trim();
    const percent = parseInt(percentMatch[1].replace('%', '').trim());
    const count = countMatch ? countMatch[1].trim() : '0/0';
    
    const type = tdParts[1] || '';
    const identifier = tdParts[2] || '';

    results.push({
      filename,
      type,
      identifier,
      percent,
      count
    });
  }
}

const undocumented = results.filter(r => r.percent < 100);

const grouped = {};
for (const item of undocumented) {
  if (!grouped[item.filename]) {
    grouped[item.filename] = [];
  }
  grouped[item.filename].push(item);
}

fs.writeFileSync('undocumented_remaining.json', JSON.stringify(grouped, null, 2));

let text = '';
for (const file in grouped) {
  text += `${file}:\n`;
  for (const item of grouped[file]) {
    text += `  - [ ] ${item.type} "${item.identifier}" (${item.percent}% - ${item.count})\n`;
  }
}
fs.writeFileSync('undocumented_remaining.txt', text);

console.log(`Found ${undocumented.length} undocumented items in ${Object.keys(grouped).length} files.`);
