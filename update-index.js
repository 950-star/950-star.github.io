const fs = require('fs');
const path = require('path');

// Path to the content folder
const contentDir = path.join(__dirname, 'content');
console.log('Looking for content folder at:', contentDir);

// Path to index.html
const indexPath = path.join(__dirname, 'index.html');
console.log('Looking for index.html at:', indexPath);

// Check if content folder exists
if (!fs.existsSync(contentDir)) {
    console.error('Error: content/ folder does not exist at', contentDir);
    return;
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to format date
function formatDate(date) {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
}

// Recursive function to generate index.html for a folder and its subfolders
function generateIndexForFolder(folderPath, relativePath, parentFolderName = 'Paperwallah') {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    console.log(`Processing folder: ${relativePath}`);

    // Separate files and folders
    const files = entries.filter(entry => entry.isFile());
    const folders = entries.filter(entry => entry.isDirectory());

    // Generate list items for files
    const fileListItems = files.map(file => {
        const fileName = file.name;
        const fileHref = relativePath ? `${relativePath}/${fileName}` : fileName; // Use local file path
        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        const fileSize = formatFileSize(stats.size);
        const fileDate = formatDate(stats.mtime);
        const icon = fileName.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ';
        return `<li data-name="${fileName.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="file"><div class="list-item-container"><a href="${fileHref}"${fileName.endsWith('.pdf') ? ' target="_blank"' : ''}>${icon}${fileName} (${fileSize}, ${fileDate})</a></div></li>`;
    }).join('\n');

    // Generate list items for folders
    const folderListItems = folders.map(folder => {
        const folderName = folder.name;
        const folderPathNested = path.join(folderPath, folderName);
        const relativePathNested = relativePath ? `${relativePath}/${folderName}` : `content/${folderName}`;
        const stats = fs.statSync(folderPathNested);
        const fileDate = formatDate(stats.mtime);
        return `<li data-name="${folderName.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="folder"><div class="list-item-container"><a href="${relativePathNested}/"><i class="fas fa-folder"></i> ${folderName} (${fileDate})</a></div></li>`;
    }).join('\n');

    // Combine files and folders into one list
    const listItems = `${folderListItems}${folderListItems && fileListItems ? '\n' : ''}${fileListItems}`;

    // Generate index.html for this folder
    const folderIndexPath = path.join(folderPath, 'index.html');
    const folderName = path.basename(folderPath);
    const backLink = relativePath === 'content' ? '../index.html' : '../';
    const folderHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${folderName}</title>
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
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
        <p><a href="${backLink}">Back to ${parentFolderName}</a></p>
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
</body>
</html>
    `;
    fs.writeFileSync(folderIndexPath, folderHtml);
    console.log(`Created/Updated index.html for folder: ${relativePath}`);

    // Recursively process subfolders
    folders.forEach(folder => {
        const folderName = folder.name;
        const folderPathNested = path.join(folderPath, folderName);
        const relativePathNested = relativePath ? `${relativePath}/${folderName}` : `content/${folderName}`;
        generateIndexForFolder(folderPathNested, relativePathNested, folderName);
    });
}

// Process the top-level content directory
const entries = fs.readdirSync(contentDir, { withFileTypes: true });
console.log('Found the following files/folders in content/:', entries.map(entry => entry.name));

// Generate index.html files for all folders and subfolders
entries.forEach(entry => {
    if (entry.isDirectory()) {
        const folderPath = path.join(contentDir, entry.name);
        const relativePath = `content/${entry.name}`;
        generateIndexForFolder(folderPath, relativePath);
    }
});

// Generate the list items for the main index.html
const listItems = entries.map(entry => {
    const name = entry.name;
    const href = entry.isDirectory() ? `content/${name}/` : `content/${name}`; // Link to folder's index.html or file
    const stats = fs.statSync(path.join(contentDir, name));
    const fileSize = entry.isFile() ? formatFileSize(stats.size) : '';
    const fileDate = formatDate(stats.mtime);
    const icon = entry.isDirectory() ? '<i class="fas fa-folder"></i> ' : (name.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i> ' : '<i class="fas fa-file"></i> ');
    const downloadButton = entry.isFile() && name.endsWith('.pdf') ? `<a href="${href}" download class="download-btn"><i class="fas fa-download"></i></a>` : '';
    const sizeDateText = entry.isFile() ? ` (${fileSize}, ${fileDate})` : ` (${fileDate})`;
    const linkTag = `<li data-name="${name.toLowerCase()}" data-date="${stats.mtime.toISOString()}" data-type="${entry.isDirectory() ? 'folder' : 'file'}"><div class="list-item-container"><a href="${href}"${entry.isFile() && name.endsWith('.pdf') ? ' target="_blank"' : ''}>${icon}${name}${sizeDateText}</a>${downloadButton}</div></li>`;
    return linkTag;
}).join('\n');

console.log('Generated list items for main index.html:\n', listItems);

// Create the new index.html content for the root
const newHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Paperwallah</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>
    <header>
        <div class="header-container">
            <div>
                <h1>Paperwallah</h1>
                <p class="tagline">Your one-stop resource for study materials and PDFs</p>
            </div>
            <a href="https://t.me/kpchoudhary39" target="_blank" class="telegram-link">
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
</html>
`;

// Write the new index.html
fs.writeFile(indexPath, newHtml, 'utf8', err => {
    if (err) {
        console.error('Error writing index.html:', err);
        return;
    }
    console.log('index.html updated successfully!');
});