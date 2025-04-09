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

    // Generate table rows for files
    const fileRows = files.map(file => {
        const fileName = file.name;
        const fileHref = fileName; // Relative path to the file
        const filePath = path.join(folderPath, fileName);
        const stats = fs.statSync(filePath);
        const fileSize = formatFileSize(stats.size);
        const fileDate = formatDate(stats.mtime);
        const icon = fileName.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i>' : '<i class="fas fa-file"></i>';
        const downloadButton = fileName.endsWith('.pdf') ? `<a href="${fileHref}" download class="btn btn-sm btn-danger"><i class="fas fa-download"></i></a>` : '';
        return `
            <tr>
                <td>${icon} ${fileName}</td>
                <td>${fileSize}</td>
                <td>${fileDate}</td>
                <td>${downloadButton}</td>
            </tr>`;
    }).join('\n');

    // Generate table rows for folders
    const folderRows = folders.map(folder => {
        const folderName = folder.name;
        const folderPathNested = path.join(folderPath, folderName);
        const relativePathNested = relativePath ? `${relativePath}/${folderName}` : `content/${folderName}`;
        const stats = fs.statSync(folderPathNested);
        const fileDate = formatDate(stats.mtime);
        return `
            <tr>
                <td><a href="${relativePathNested}/" style="color: #0088cc;"><i class="fas fa-folder"></i> ${folderName}</a></td>
                <td>-</td>
                <td>${fileDate}</td>
                <td></td>
            </tr>`;
    }).join('\n');

    // Combine files and folders into one table
    const tableRows = `${folderRows}${folderRows && fileRows ? '\n' : ''}${fileRows}`;

    // Generate index.html for this folder
    const folderIndexPath = path.join(folderPath, 'index.html');
    const folderName = path.basename(folderPath);
    const backLink = relativePath === 'content' ? '../index.html' : '../';
    const folderHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${folderName}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        body { background-color: #1a1a1a; color: #e0e0e0; }
        .card { background-color: #2c2c2c; border: 1px solid #444; border-radius: 8px; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 20px; }
        .telegram-link { color: #0088cc; font-size: 24px; }
        .table { color: #e0e0e0; }
        .table th, .table td { border-color: #000 !important; } /* Force black borders */
        .btn-danger { background-color: #dc3545; border: none; }
        .btn-danger:hover { background-color: #c82333; }
        a { text-decoration: none; }
        a[href$="/"] { color: #0088cc; } /* Light blue for folder links only */
        a:hover { text-decoration: underline; }
        .table th, .table td { font-size: 18px; } /* Larger font for PC */
        @media (max-width: 768px) {
            .table-responsive { font-size: 14px; } /* Smaller font for mobile */
            .header-container { flex-direction: column; text-align: center; }
            .telegram-link { margin-top: 10px; }
        }
    </style>
</head>
<body>
    <header class="bg-dark">
        <div class="header-container">
            <div>
                <h1>${folderName} Contents</h1>
            </div>
            <a href="${backLink}" class="btn btn-secondary mt-2">Back to ${parentFolderName}</a>
        </div>
    </header>
    <div class="container mt-4">
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <footer class="text-center p-3 mt-4 bg-dark">
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
    `;
    fs.writeFileSync(folderIndexPath, folderHtml, { flag: 'w' }); // Force overwrite
    console.log(`Created/Updated index.html for folder: ${relativePath} at ${folderIndexPath} at ${new Date().toLocaleTimeString()}`);

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

// Generate table rows for the main index.html
const tableRows = entries.map(entry => {
    const name = entry.name;
    const href = entry.isDirectory() ? `content/${name}/` : `content/${name}`;
    const stats = fs.statSync(path.join(contentDir, name));
    const fileSize = entry.isFile() ? formatFileSize(stats.size) : '-';
    const fileDate = formatDate(stats.mtime);
    const icon = entry.isDirectory() ? '<i class="fas fa-folder"></i>' : (name.endsWith('.pdf') ? '<i class="fas fa-file-pdf"></i>' : '<i class="fas fa-file"></i>');
    const downloadButton = entry.isFile() && name.endsWith('.pdf') ? `<a href="${href}" download class="btn btn-sm btn-danger"><i class="fas fa-download"></i></a>` : '';
    return `
        <tr>
            <td><a href="${href}" style="color: ${entry.isDirectory() ? '#0088cc' : '#e0e0e0'};">${icon} ${name}</a></td>
            <td>${fileSize}</td>
            <td>${fileDate}</td>
            <td>${downloadButton}</td>
        </tr>`;
}).join('\n');

console.log('Generated table rows for main index.html:\n', tableRows);

// Create the new index.html content for the root
const newHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paperwallah</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
    <style>
        body { background-color: #1a1a1a; color: #e0e0e0; }
        .card { background-color: #2c2c2c; border: 1px solid #444; border-radius: 8px; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 20px; }
        .telegram-link { color: #0088cc; font-size: 24px; }
        .table { color: #e0e0e0; }
        .table th, .table td { border-color: #000 !important; } /* Force black borders */
        .btn-danger { background-color: #dc3545; border: none; }
        .btn-danger:hover { background-color: #c82333; }
        a { text-decoration: none; }
        a[href$="/"] { color: #0088cc; } /* Light blue for folder links only */
        a:hover { text-decoration: underline; }
        .table th, .table td { font-size: 18px; } /* Larger font for PC */
        @media (max-width: 768px) {
            .table-responsive { font-size: 14px; } /* Smaller font for mobile */
            .header-container { flex-direction: column; text-align: center; }
            .telegram-link { margin-top: 10px; }
        }
    </style>
</head>
<body>
    <header class="bg-dark">
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
    <div class="container mt-4">
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <footer class="text-center p-3 mt-4 bg-dark">
        <p>© 2025 - 950-star, All Rights Reserved</p>
    </footer>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
`;

// Write the new index.html
fs.writeFile(indexPath, newHtml, { flag: 'w' }, err => {
    if (err) {
        console.error('Error writing index.html:', err);
        return;
    }
    console.log('index.html updated successfully at', new Date().toLocaleTimeString());
});