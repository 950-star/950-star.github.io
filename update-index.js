// update-index.js
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const indexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(contentDir)) {
    console.error('Error: content/ folder does not exist at', contentDir);
    return;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function generateIndexForFolder(folderPath, relativePath, parentFolderName = 'Paperwallah') {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const files = entries.filter(entry => entry.isFile());
    const folders = entries.filter(entry => entry.isDirectory());

    const fileListItems = files.map(file => {
        const fileName = file.name;
        const fileHref = fileName;
        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        const fileSize = formatFileSize(stats.size);
        const fileDate = formatDate(stats.mtime);
        const icon = fileName.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ';
        const downloadButton = fileName.endsWith('.pdf')
            ? `<a href="${fileHref}" download class="download-btn"><i class='fas fa-download'></i></a>`
            : '';
        return `<li data-name="${fileName.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="file">
            <div class="list-item-container">
                <a href="${fileHref}" target="_blank">${icon}${fileName} (${fileSize}, ${fileDate})</a>
                ${downloadButton}
            </div>
        </li>`;
    }).join('\n');

    const folderListItems = folders.map(folder => {
        const folderName = folder.name;
        const folderPathNested = path.join(folderPath, folderName);
        const stats = fs.statSync(folderPathNested);
        const fileDate = formatDate(stats.mtime);
        return `<li data-name="${folderName.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="folder">
            <div class="list-item-container">
                <a href="${folderName}/"><i class="fas fa-folder"></i> ${folderName} (${fileDate})</a>
            </div>
        </li>`;
    }).join('\n');

    const listItems = `${folderListItems}${folderListItems && fileListItems ? '\n' : ''}${fileListItems}`;

    const folderIndexPath = path.join(folderPath, 'index.html');
    const folderName = path.basename(folderPath);

    const folderHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${folderName}</title>
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <h1>${folderName} Contents</h1>
    </header>
    <main>
        <ul id="content-list">
${listItems}
        </ul>
    </main>
    <footer>
        <p><a href="https://950-star.github.io/">Back to Paperwallah</a></p>
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
    <script>
        window.onload = function() {
            const list = document.getElementById('content-list');
            const items = Array.from(list.getElementsByTagName('li'));
            items.sort((a, b) => new Date(b.dataset.date) - new Date(a.dataset.date));
            list.innerHTML = '';
            items.forEach(item => list.appendChild(item));
        };
    </script>
</body>
</html>`;

    fs.writeFileSync(folderIndexPath, folderHtml);
    console.log(`Created/Updated index.html for folder: ${relativePath}`);

    folders.forEach(folder => {
        generateIndexForFolder(path.join(folderPath, folder.name), `${relativePath}/${folder.name}`, folder.name);
    });
}

const entries = fs.readdirSync(contentDir, { withFileTypes: true });
entries.forEach(entry => {
    if (entry.isDirectory()) {
        generateIndexForFolder(path.join(contentDir, entry.name), `content/${entry.name}`);
    }
});

const listItems = entries.map(entry => {
    const name = entry.name;
    const href = entry.isDirectory() ? `content/${name}/` : `content/${name}`;
    const stats = fs.statSync(path.join(contentDir, name));
    const fileSize = entry.isFile() ? formatFileSize(stats.size) : '';
    const fileDate = formatDate(stats.mtime);
    const icon = entry.isDirectory() ? '<i class="fas fa-folder"></i> ' : (name.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ');
    const downloadButton = entry.isFile() && name.endsWith('.pdf') ? `<a href="${href}" download class="download-btn"><i class='fas fa-download'></i></a>` : '';
    const sizeDateText = entry.isFile() ? ` (${fileSize}, ${fileDate})` : ` (${fileDate})`;
    return `<li data-name="${name.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="${entry.isDirectory() ? 'folder' : 'file'}">
        <div class="list-item-container">
            <a href="${href}"${entry.isFile() && name.endsWith('.pdf') ? ' target="_blank"' : ''}>${icon}${name}${sizeDateText}</a>
            ${downloadButton}
        </div>
    </li>`;
}).join('\n');

const newHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Paperwallah</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="header-container">
            <div>
                <h1>Paperwallah</h1>
                <p class="tagline">CONTACT ON TG FOR ANY OTHER MATERIAL</p>
            </div>
            <a href="https://t.me/paperwallah521" target="_blank" class="telegram-link">
                <i class="fab fa-telegram-plane"></i>
            </a>
        </div>
    </header>
    <main>
        <div class="controls-container">
            <div class="search-container">
                <input type="text" id="search-bar" placeholder="Search for PDFs or folders...">
                <button onclick="searchContent()"><i class="fas fa-search"></i></button>
            </div>
            <div class="sort-container">
                <label for="sort-options">Sort by:</label>
                <select id="sort-options" onchange="sortContent()">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="type-asc">Type (Folders First)</option>
                    <option value="type-desc">Type (Files First)</option>
                </select>
            </div>
        </div>
        <ul id="content-list">
${listItems}
        </ul>
    </main>
    <footer>
        <p><a href="https://950-star.github.io/">Back to Paperwallah</a></p>
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
    <script>
        function searchContent() {
            const input = document.getElementById('search-bar').value.toLowerCase();
            const items = document.querySelectorAll('#content-list li');
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(input) ? '' : 'none';
            });
        }

        document.getElementById('search-bar').addEventListener('keyup', searchContent);

        function sortContent() {
            const sortOption = document.getElementById('sort-options').value;
            const list = document.getElementById('content-list');
            const items = Array.from(list.getElementsByTagName('li'));

            items.sort((a, b) => {
                const nameA = a.dataset.name;
                const nameB = b.dataset.name;
                const dateA = new Date(a.dataset.date);
                const dateB = new Date(b.dataset.date);
                const typeA = a.dataset.type;
                const typeB = b.dataset.type;

                if (sortOption === 'name-asc') return nameA.localeCompare(nameB);
                if (sortOption === 'name-desc') return nameB.localeCompare(nameA);
                if (sortOption === 'date-asc') return dateA - dateB;
                if (sortOption === 'date-desc') return dateB - dateA;
                if (sortOption === 'type-asc') return typeA.localeCompare(typeB);
                if (sortOption === 'type-desc') return typeB.localeCompare(typeA);
                return 0;
            });

            list.innerHTML = '';
            items.forEach(item => list.appendChild(item));
        }
    </script>
</body>
</html>`;

fs.writeFile(indexPath, newHtml, 'utf8', err => {
    if (err) console.error('Error writing index.html:', err);
    else console.log('index.html updated successfully!');
});