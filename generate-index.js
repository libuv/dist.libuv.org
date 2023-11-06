const fs = require('fs');
const path = require('path');

const NAME_MAX_LENGTH = 50;
const DATE_MAX_LENGTH = 20;

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


function pad (s) {
  return s < 10 ? ('0' + s) : ('' + s)
}

function toHTML (dir, list) {
  if (dir[dir.length - 1] === '/') dir = dir.slice(0, -1)

  var prev = `\n<a href="../">../</a>\n`
  var pre = prev + list.map(renderEntry).join('')
  var dirname = dir || '/'

  return `
    <!DOCTYPE html>
    <html>
    <head><title>Index of ${dirname}</title></head>
    <body bgcolor="white">
        <h1>Index of ${dirname}</h1>
        <hr>
        <pre>
            ${pre}
        </pre>
        <hr>
    </body>
    </html>
  `;

  function renderEntry (entry) {
    var name = entry.name;
    var isDir = entry.isDirectory();
    var size = isDir ? '-' : '' + entry.size;
    var mtime = new Date(entry.mtime);

    var d = pad(mtime.getUTCDate())
    var m = MONTHS[mtime.getUTCMonth()]
    var y = mtime.getUTCFullYear()
    var h = pad(mtime.getUTCHours())
    var min = pad(mtime.getUTCMinutes())
    var time = `${d}-${m}-${y} ${h}:${min}`

    if (isDir && name[name.length - 1] !== '/') name += '/'

    var fname = elide(name, NAME_MAX_LENGTH);
    var href = encodeURI(name)

    return `<a href="${href}" title="${name}">${fname}</a>${''.padEnd(NAME_MAX_LENGTH - fname.length + 1) + time.padEnd(DATE_MAX_LENGTH) + size}\n`
  }
}

function elide(name, maxLength) {
  if (name.length > maxLength) return name.slice(0, maxLength - 3) + '..>'
  return name
}

function getFiles(dir, ignore) {
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(d => (d.isFile() || d.isDirectory()) && !ignore.includes(d.name) && !d.name.startsWith('.'))
        .map(d => {
            const p = path.join(dir, d.name);
            if (!metadata[p]) {
                const st = fs.statSync(p);
                metadata[p] = {
                    size: st.size,
                    mtime: st.mtime
                };
            }
            d.size = metadata[p].size;
            d.mtime = metadata[p].mtime;

            return d;
        });
}

// Metadata

var metadata = {};

try {
    metadata = require('./metadata.json');
} catch(_) {}

// Main

const rootIgnoreFiles = [ 'CNAME', 'metadata.json', 'index.html', path.basename(__filename) ];

fs.writeFileSync('index.html', toHTML('/', getFiles('.', rootIgnoreFiles)));

// Dist

const distIgnoreFiles = [ 'index.html' ];

fs.writeFileSync('dist/index.html', toHTML('dist', getFiles('dist', rootIgnoreFiles)));

const distDirs = fs.readdirSync('dist').filter(d => !distIgnoreFiles.includes(d)).sort();

for (const d of distDirs) {
    const distDir = `dist/${d}`;
    fs.writeFileSync(`${distDir}/index.html`, toHTML(distDir, getFiles(distDir, distIgnoreFiles)));
}

fs.writeFileSync('./metadata.json', JSON.stringify(metadata));
