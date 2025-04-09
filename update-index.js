// update-index.js
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const indexPath = path.join(__dirname, 'index.html');
const libraryIndexPath = path.join(__dirname, 'library-index.json');

if (!fs.existsSync(contentDir)) {
    console.error('Error: content/ folder does not exist at', contentDir);
    return;
}

// Store library index for global search
const libraryIndex = [];

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

    // Add files and folders to library index
    files.forEach(file => {
        const fileName = file.name;
        const filePath = path.join(folderPath, fileName);
        const relativeFilePath = path.join(relativePath, fileName).replace(/\\/g, '/');
        const stats = fs.statSync(filePath);
        libraryIndex.push({
            name: fileName,
            path: `/${relativeFilePath}`,
            type: 'file',
            size: stats.size,
            date: stats.mtime.toISOString()
        });
    });

    folders.forEach(folder => {
        const folderName = folder.name;
        const folderPathNested = path.join(folderPath, folderName);
        const relativeFolderPath = path.join(relativePath, folderName).replace(/\\/g, '/');
        const stats = fs.statSync(folderPathNested);
        libraryIndex.push({
            name: folderName,
            path: `/${relativeFolderPath}/`,
            type: 'folder',
            date: stats.mtime.toISOString()
        });
    });

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
        const stats = fs.statSync(path.join(folderPath, folderName));
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
    <title>${folderName} - Paperwallah</title>
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="header-container">
            <div>
                <h1>${folderName}</h1>
                <p class="tagline">Browse contents of ${folderName}</p>
            </div>
            <a href="https://t.me/paperwallah521" target="_blank" class="telegram-link">
                <i class="fab fa-telegram-plane"></i>
            </a>
        </div>
    </header>
    <main>
        <div class="controls-container">
            <div class="search-container">
                <input type="text" id="search-bar" placeholder="Search entire library...">
                <button onclick="searchContent()"><i class="fas fa-search"></i></button>
            </div>
        </div>
        <ul id="content-list">
${listItems}
        </ul>
    </main>
    <footer>
        <p><a href="/index.html">Back to Paperwallah</a></p>
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
    <script>
        // Store initial content to restore after clearing search
        const initialContent = document.getElementById('content-list').innerHTML;

        async function searchContent() {
            const input = document.getElementById('search-bar').value.trim().toLowerCase();
            const list = document.getElementById('content-list');

            if (!input) {
                // Restore original content if search is cleared
                list.innerHTML = initialContent;
                return;
            }

            try {
                // Fetch library index for global search
                const response = await fetch('/library-index.json');
                if (!response.ok) throw new Error('Failed to fetch library index');
                const library = await response.json();

                // Filter items by search query
                const results = library.filter(item => 
                    item.name.toLowerCase().includes(input)
                );

                // Generate HTML for search results
                list.innerHTML = results.map(item => {
                    const icon = item.type === 'folder' ? '<i class="fas fa-folder"></i> ' 
                        : (item.name.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ');
                    const downloadButton = item.type === 'file' && item.name.endsWith('.pdf')
                        ? \`<a href="\${item.path}" download class="download-btn"><i class='fas fa-download'></i></a>\`
                        : '';
                    const sizeDateText = item.type === 'file' && item.size !== undefined 
                        ? \` (\${formatFileSize(item.size)}, \${formatDate(new Date(item.date))})\`
                        : \` (\${formatDate(new Date(item.date))})\`;
                    return \`
                        <li data-name="\${item.name.toLowerCase()}" data-date="\${item.date}" data-type="\${item.type}">
                            <div class="list-item-container">
                                <a href="\${item.path}"\${item.type === 'file' && item.name.endsWith('.pdf') ? ' target="_blank"' : ''}>
                                    \${icon}\${item.name}\${sizeDateText}
                                </a>
                                \${downloadButton}
                            </div>
                        </li>\`;
                }).join('');

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
            } catch (error) {
                console.error('Search error:', error);
                list.innerHTML = '<li>Failed to load search results.</li>';
            }
        }

        // Trigger search on keyup
        document.getElementById('search-bar').addEventListener('keyup', searchContent);
    </script>
</body>
</html>`;

    fs.writeFileSync(folderIndexPath, folderHtml);
    console.log(`Created/Updated index.html for folder: ${relativePath}`);

    // Recursively generate index for subfolders
    folders.forEach(folder => {
        generateIndexForFolder(path.join(folderPath, folder.name), `${relativePath}/${folder.name}`, folder.name);
    });
}

// Generate index for all folders in content/
const entries = fs.readdirSync(contentDir, { withFileTypes: true });
entries.forEach(entry => {
    if (entry.isDirectory()) {
        generateIndexForFolder(path.join(contentDir, entry.name), `content/${entry.name}`);
    }
});

// Generate library index file
fs.writeFileSync(libraryIndexPath, JSON.stringify(libraryIndex, null, 2));
console.log(`Created/Updated library-index.json with ${libraryIndex.length} items`);

// Generate root index.html
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
                <input type="text" id="search-bar" placeholder="Search entire library...">
                <button onclick="searchContent()"><i class="fas fa-search"></i></button>
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
        // Store initial content to restore after clearing search
        const initialContent = document.getElementById('content-list').innerHTML;

        async function searchContent() {
            const input = document.getElementById('search-bar').value.trim().toLowerCase();
            const list = document.getElementById('content-list');

            if (!input) {
                // Restore original content if search is cleared
                list.innerHTML = initialContent;
                return;
            }

            try {
                // Fetch library index for global search
                const response = await fetch('/library-index.json');
                if (!response.ok) throw new Error('Failed to fetch library index');
                const library = await response.json();

                // Filter items by search query
                const results = library.filter(item => 
                    item.name.toLowerCase().includes(input)
                );

                // Generate HTML for search results
                list.innerHTML = results.map(item => {
                    const icon = item.type === 'folder' ? '<i class="fas fa-folder"></i> ' 
                        : (item.name.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ');
                    const downloadButton = item.type === 'file' && item.name.endsWith('.pdf')
                        ? \`<a href="\${item.path}" download class="download-btn"><i class='fas fa-download'></i></a>\`
                        : '';
                    const sizeDateText = item.type === 'file' && item.size !== undefined 
                        ? \` (\${formatFileSize(item.size)}, \${formatDate(new Date(item.date))})\`
                        : \` (\${formatDate(new Date(item.date))})\`;
                    return \`
                        <li data-name="\${item.name.toLowerCase()}" data-date="\${item.date}" data-type="\${item.type}">
                            <div class="list-item-container">
                                <a href="\${item.path}"\${item.type === 'file' && item.name.endsWith('.pdf') ? ' target="_blank"' : ''}>
                                    \${icon}\${item.name}\${sizeDateText}
                                </a>
                                \${downloadButton}
                            </div>
                        </li>\`;
                }).join('');

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
            } catch (error) {
                console.error('Search error:', error);
                list.innerHTML = '<li>Failed to load search results.</li>';
            }
        }

        // Trigger search on keyup
        document.getElementById('search-bar').addEventListener('keyup', searchContent);
    </script>
</body>
</html>`;

fs.writeFile(indexPath, newHtml, 'utf8', err => {
    if (err) console.error('Error writing index.html:', err);
    else console.log('index.html updated successfully!');
});