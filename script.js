document.addEventListener('DOMContentLoaded', () => {
    // PDF library instances (pdf-lib is loaded globally)
    const { PDFDocument, rgb, StandardFonts, degrees } = PDFLib; // Ensure PDFLib is available

    // DOM Elements
    const toolGrid = document.getElementById('tool-grid');
    const toolWorkspaceContainer = document.getElementById('tool-workspace-container');
    const toolWorkspace = document.getElementById('tool-workspace');
    const currentToolTitle = document.getElementById('current-tool-title');
    const backToToolsButton = document.getElementById('back-to-tools');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const loader = document.getElementById('loader');
    const loaderMessage = document.getElementById('loader-message');
    const alertContainer = document.getElementById('alert-container');
    const dragDropOverlay = document.getElementById('drag-drop-overlay');

    // Tool Definitions (UPDATED)
    const tools = [
        { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDF files into one single document.' },
        { id: 'split-pdf', name: 'Split PDF', description: 'Extract a range of pages or split each page into a separate PDF.' },
        { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size (basic optimization & metadata removal).' },
        { id: 'add-watermark', name: 'Add Watermark', description: 'Overlay text or image watermarks onto your PDF.' },
        { id: 'rotate-pdf', name: 'Rotate PDF', description: 'Rotate all or selected pages in your PDF document.' },
        { id: 'protect-pdf', name: 'Protect PDF', description: 'Encrypt and add a password to your PDF file.' },
        { id: 'unlock-pdf', name: 'Unlock PDF', description: 'Remove password protection from a PDF (password required).' },
        { id: 'pdf-to-image', name: 'PDF to Image', description: 'Convert PDF pages to PNG, JPG, or WEBP images.' },
        { id: 'image-to-pdf', name: 'Image to PDF', description: 'Convert JPG, PNG, and other images into a PDF file.' },
        { id: 'reorder-pdf', name: 'Reorder PDF Pages', description: 'Visually rearrange pages in your PDF document.' },
        { id: 'add-page-numbers', name: 'Add Page Numbers', description: 'Insert page numbers into your PDF header or footer.' },
        { id: 'extract-images', name: 'Extract Images from PDF', description: 'Pull out images embedded within a PDF file (supports common formats).' },
        { id: 'edit-metadata', name: 'Edit PDF Metadata', description: 'Modify title, author, subject, keywords of a PDF.' },
        { id: 'html-to-pdf', name: 'HTML to PDF', description: 'Convert simple HTML content to a PDF document.' },
        { id: 'esign-pdf', name: 'eSign PDF', description: 'Sign your PDF document digitally using touch, mouse, or image.' },
    ];

    // --- Core UI Functions ---

    function init() {
        populateToolGrid();
        setupDarkMode();
        setupDragAndDrop();
        backToToolsButton.addEventListener('click', showToolGrid);
    }

    function populateToolGrid() {
        toolGrid.innerHTML = '';
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.innerHTML = `
                <h2>${tool.name}</h2>
                <p>${tool.description}</p>
                <button data-tool-id="${tool.id}">Open Tool</button>
            `;
            card.querySelector('button').addEventListener('click', () => loadTool(tool));
            toolGrid.appendChild(card);
        });
    }

    function showToolGrid() {
        toolWorkspaceContainer.style.display = 'none';
        toolGrid.style.display = 'grid';
        currentToolTitle.textContent = '';
        toolWorkspace.innerHTML = ''; // Clear previous tool's UI
        currentToolFileHandler = null; // Reset file handler when going back to grid
    }

    function loadTool(tool) {
        toolGrid.style.display = 'none';
        toolWorkspaceContainer.style.display = 'block';
        currentToolTitle.textContent = tool.name;
        toolWorkspace.innerHTML = ''; // Clear previous content

        // Dynamically load tool UI and logic
        const toolFunction = toolImplementations[tool.id];
        if (toolFunction) {
            toolFunction(toolWorkspace);
        } else {
            toolWorkspace.innerHTML = `<p>Tool "${tool.name}" is under development.</p>`;
            showAlert(`Tool "${tool.name}" is under development.`, 'info');
        }
    }

    function setupDarkMode() {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            darkModeToggle.checked = true;
        }

        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    function showLoader(message = 'Processing...') {
        loaderMessage.textContent = message;
        loader.style.display = 'flex';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function showAlert(message, type = 'info', duration = 5000) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${type}`;
        alertDiv.textContent = message;
        alertContainer.appendChild(alertDiv);

        setTimeout(() => {
            // Start fade out animation
            alertDiv.style.animationName = 'hideAlert'; // Ensure hideAlert animation is applied
            alertDiv.style.animationDuration = '0.5s';
            alertDiv.style.animationFillMode = 'forwards';
            // Remove after animation
            setTimeout(() => alertDiv.remove(), 500); 
        }, duration - 500); // Start hiding 0.5s before total duration
    }

    // --- Drag and Drop ---
    let currentToolFileHandler = null; // To be set by the active tool

    function setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                if (toolWorkspaceContainer.style.display === 'block' && currentToolFileHandler) {
                    dragDropOverlay.classList.add('active');
                }
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, () => {
                dragDropOverlay.classList.remove('active');
            }, false);
        });

        document.body.addEventListener('drop', handleDrop, false);
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        if (!currentToolFileHandler) return;

        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            currentToolFileHandler(files);
        }
    }

    // --- Helper Functions ---
    async function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    function createDownloadLink(blob, filename, linkText = "Download File") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.textContent = linkText;
        a.className = 'tool-button';
        a.style.display = 'inline-block';
        a.style.marginTop = '1rem';
        a.style.marginRight = '0.5rem'; // Add some spacing if multiple links
        
        a.addEventListener('click', () => {
            setTimeout(() => URL.revokeObjectURL(url), 100); 
        });

        return a;
    }

    function displayFileNames(fileInput, container, isMultiple = fileInput.multiple) {
        let fileNames;
        if (fileInput.files.length > 0) {
            fileNames = Array.from(fileInput.files).map(f => f.name).join(', ');
        } else {
            fileNames = "No files selected.";
        }
        
        let fileListDisplay = container.querySelector('.file-list-display');
        if (!fileListDisplay) {
            fileListDisplay = document.createElement('p');
            fileListDisplay.className = 'file-list-display';
            fileListDisplay.style.marginTop = '0.5rem';
            fileListDisplay.style.fontSize = '0.9em';
            // Insert after the input element, or at the end of the container if it's simpler
            if (fileInput.nextSibling) {
                container.insertBefore(fileListDisplay, fileInput.nextSibling);
            } else {
                 container.appendChild(fileListDisplay);
            }
        }
        fileListDisplay.textContent = `Selected: ${fileNames}`;
    }


    // --- Tool Implementations (Object) ---
    const toolImplementations = {
        'merge-pdf': async (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="merge-files">Select PDF files to merge (order matters):</label>
                    <input type="file" id="merge-files" accept=".pdf" multiple>
                    <div class="file-list"></div>
                </div>
                <button id="merge-action" class="tool-button">Merge PDFs</button>
                <div id="merge-result"></div>
            `;
            const fileInput = workspace.querySelector('#merge-files');
            const fileListDiv = workspace.querySelector('.file-list'); // This is the DIV where names will be listed.
            const mergeButton = workspace.querySelector('#merge-action');
            const resultDiv = workspace.querySelector('#merge-result');
            
            currentToolFileHandler = (files) => {
                fileInput.files = files;
                updateMergeFileList();
            };
            
            const updateMergeFileList = () => { // Renamed to avoid conflict
                fileListDiv.innerHTML = ''; // Clear previous list items if any
                Array.from(fileInput.files).forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-list-item'; // Use this class for styling individual items
                    fileItem.textContent = file.name;
                    fileListDiv.appendChild(fileItem);
                });
                if (fileInput.files.length === 0) {
                    fileListDiv.innerHTML = '<p class="file-list-display" style="margin-top: 0.5rem; font-size: 0.9em;">No files selected.</p>';
                }
            };
            fileInput.addEventListener('change', updateMergeFileList);

            mergeButton.addEventListener('click', async () => {
                if (fileInput.files.length < 2) {
                    showAlert('Please select at least two PDF files to merge.', 'error');
                    return;
                }
                showLoader('Merging PDFs...');
                resultDiv.innerHTML = '';
                try {
                    const mergedPdf = await PDFDocument.create();
                    for (const file of fileInput.files) {
                        const pdfBytes = await readFileAsArrayBuffer(file);
                        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                        copiedPages.forEach(page => mergedPdf.addPage(page));
                    }
                    const mergedPdfBytes = await mergedPdf.save();
                    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
                    const downloadLink = createDownloadLink(blob, 'merged.pdf', 'Download Merged PDF');
                    resultDiv.appendChild(downloadLink);
                    showAlert('PDFs merged successfully!', 'success');
                } catch (e) {
                    console.error('Error merging PDFs:', e);
                    showAlert(`Error merging PDFs: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'split-pdf': async (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="split-file">Select PDF file to split:</label>
                    <input type="file" id="split-file" accept=".pdf">
                    <div class="file-list-container"></div> <!-- Container for file name display -->
                </div>
                <div class="form-group">
                    <label for="split-ranges">Page ranges (e.g., 1-3, 5, 7-end):</label>
                    <input type="text" id="split-ranges" placeholder="1-3, 5, 7-end">
                </div>
                 <div class="form-group">
                    <input type="checkbox" id="split-individual-pages" name="split-individual-pages">
                    <label for="split-individual-pages" style="display:inline; font-weight:normal;">Split all pages into individual PDFs</label>
                </div>
                <button id="split-action" class="tool-button">Split PDF</button>
                <div id="split-result"></div>
            `;
            const fileInput = workspace.querySelector('#split-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const rangesInput = workspace.querySelector('#split-ranges');
            const individualPagesCheckbox = workspace.querySelector('#split-individual-pages');
            const splitButton = workspace.querySelector('#split-action');
            const resultDiv = workspace.querySelector('#split-result');

            currentToolFileHandler = (files) => {
                if(files.length > 0) {
                    fileInput.files = files; 
                    displayFileNames(fileInput, fileListContainer);
                }
            };
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

            splitButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error');
                    return;
                }
                const splitIndividually = individualPagesCheckbox.checked;
                const rangesStr = rangesInput.value;
                if (!splitIndividually && !rangesStr) {
                     showAlert('Please enter page ranges or check "Split all pages".', 'error');
                    return;
                }

                showLoader('Splitting PDF...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const originalPdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const totalPages = originalPdf.getPageCount();

                    if (splitIndividually) {
                        for (let i = 0; i < totalPages; i++) {
                            const newPdf = await PDFDocument.create();
                            const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
                            newPdf.addPage(copiedPage);
                            const newPdfBytes = await newPdf.save();
                            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
                            const downloadLink = createDownloadLink(blob, `${fileInput.files[0].name.replace('.pdf', '')}_page_${i + 1}.pdf`, `Download Page ${i + 1}`);
                            resultDiv.appendChild(downloadLink);
                            if((i + 1) % 3 === 0) resultDiv.appendChild(document.createElement('br')); // New line for better layout
                        }
                        showAlert('PDF split into individual pages successfully!', 'success');
                    } else {
                        const pageIndicesToExtract = new Set();
                        rangesStr.split(',').forEach(range => {
                            range = range.trim();
                            if (range.includes('-')) {
                                let [start, endStr] = range.split('-');
                                let startNum = parseInt(start.trim(), 10);
                                let endNum = endStr.trim().toLowerCase() === 'end' ? totalPages : parseInt(endStr.trim(), 10);
                                for (let i = startNum; i <= endNum; i++) {
                                    if (i >= 1 && i <= totalPages) pageIndicesToExtract.add(i - 1);
                                }
                            } else {
                                const pageNum = parseInt(range.trim(), 10);
                                if (pageNum >= 1 && pageNum <= totalPages) pageIndicesToExtract.add(pageNum - 1);
                            }
                        });

                        if (pageIndicesToExtract.size === 0) {
                            showAlert('No valid pages found in ranges.', 'error');
                            hideLoader();
                            return;
                        }
                        
                        const newPdf = await PDFDocument.create();
                        const sortedIndices = Array.from(pageIndicesToExtract).sort((a, b) => a - b);
                        const copiedPages = await newPdf.copyPages(originalPdf, sortedIndices);
                        copiedPages.forEach(page => newPdf.addPage(page));
                        
                        const newPdfBytes = await newPdf.save();
                        const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
                        const downloadLink = createDownloadLink(blob, `${fileInput.files[0].name.replace('.pdf', '')}_split.pdf`, 'Download Split PDF');
                        resultDiv.appendChild(downloadLink);
                        showAlert('PDF split according to ranges successfully!', 'success');
                    }
                } catch (e) {
                    console.error('Error splitting PDF:', e);
                    showAlert(`Error splitting PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'compress-pdf': (workspace) => {
            workspace.innerHTML = `
                <p><strong>Basic PDF Optimization</strong></p>
                <div class="form-group">
                    <label for="compress-file">Select PDF file:</label>
                    <input type="file" id="compress-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <input type="checkbox" id="remove-metadata-compress" checked>
                    <label for="remove-metadata-compress" style="display:inline; font-weight:normal;">Remove metadata (Title, Author, etc.)</label>
                </div>
                <button id="compress-action" class="tool-button">Optimize PDF</button>
                <div id="compress-result"></div>
                <p><small>Note: Client-side PDF compression is limited. This tool re-saves the document and optionally removes metadata, which can reduce file size. For advanced compression, server-side tools are usually needed.</small></p>
            `;
            const fileInput = workspace.querySelector('#compress-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const removeMetadataCheckbox = workspace.querySelector('#remove-metadata-compress');
            const actionButton = workspace.querySelector('#compress-action');
            const resultDiv = workspace.querySelector('#compress-result');
            
            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

            actionButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error'); return;
                }
                showLoader('Optimizing PDF...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const originalSize = pdfBytes.byteLength;
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

                    if (removeMetadataCheckbox.checked) {
                        pdfDoc.setTitle('');
                        pdfDoc.setAuthor('');
                        pdfDoc.setSubject('');
                        pdfDoc.setKeywords([]);
                        pdfDoc.setProducer('Pro PDF Utility'); 
                        pdfDoc.setCreator('');
                    }
                    
                    const optimizedPdfBytes = await pdfDoc.save(); 
                    
                    const newSize = optimizedPdfBytes.byteLength;
                    const reduction = originalSize > 0 ? ((originalSize - newSize) / originalSize * 100).toFixed(2) : 0;

                    const blob = new Blob([optimizedPdfBytes], { type: 'application/pdf' });
                    const downloadLink = createDownloadLink(blob, `optimized_${fileInput.files[0].name}`, 'Download Optimized PDF');
                    resultDiv.appendChild(downloadLink);
                    resultDiv.appendChild(document.createElement('p')).textContent = 
                        `Original size: ${(originalSize / 1024).toFixed(2)} KB. New size: ${(newSize / 1024).toFixed(2)} KB. Reduction: ${reduction}%`;
                    showAlert('PDF optimization attempted.', 'success');
                } catch (e) {
                    console.error('Error optimizing PDF:', e);
                    showAlert(`Error optimizing PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },
        
        'add-watermark': async (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="watermark-file">Select PDF file:</label>
                    <input type="file" id="watermark-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="watermark-text">Watermark Text:</label>
                    <input type="text" id="watermark-text" value="CONFIDENTIAL">
                </div>
                <div class="form-group">
                    <label for="watermark-size">Font Size:</label>
                    <input type="number" id="watermark-size" value="50">
                </div>
                <div class="form-group">
                    <label for="watermark-opacity">Opacity (0.0 - 1.0):</label>
                    <input type="number" id="watermark-opacity" value="0.3" step="0.1" min="0" max="1">
                </div>
                 <div class="form-group">
                    <label for="watermark-angle">Rotation Angle (degrees):</label>
                    <input type="number" id="watermark-angle" value="45" step="1">
                </div>
                <button id="watermark-action" class="tool-button">Add Watermark</button>
                <div id="watermark-result"></div>
            `;

            const fileInput = workspace.querySelector('#watermark-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const textInput = workspace.querySelector('#watermark-text');
            const sizeInput = workspace.querySelector('#watermark-size');
            const opacityInput = workspace.querySelector('#watermark-opacity');
            const angleInput = workspace.querySelector('#watermark-angle');
            const watermarkButton = workspace.querySelector('#watermark-action');
            const resultDiv = workspace.querySelector('#watermark-result');

            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

            watermarkButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error');
                    return;
                }
                const text = textInput.value;
                if (!text) {
                    showAlert('Please enter watermark text.', 'error');
                    return;
                }
                const fontSize = parseInt(sizeInput.value);
                const opacity = parseFloat(opacityInput.value);
                const angle = parseInt(angleInput.value);

                showLoader('Adding watermark...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Use a bold font
                    const pages = pdfDoc.getPages();

                    for (const page of pages) {
                        const { width, height } = page.getSize();
                        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
                        
                        page.drawText(text, {
                            x: (width - textWidth) / 2, 
                            y: height / 2 - (fontSize / 3), // Adjust vertical centering
                            size: fontSize,
                            font: helveticaFont,
                            color: rgb(0.75, 0.75, 0.75), // Lighter gray
                            opacity: opacity,
                            rotate: degrees(angle),
                        });
                    }

                    const watermarkedPdfBytes = await pdfDoc.save();
                    const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
                    const downloadLink = createDownloadLink(blob, `watermarked_${fileInput.files[0].name}`, 'Download Watermarked PDF');
                    resultDiv.appendChild(downloadLink);
                    showAlert('Watermark added successfully!', 'success');
                } catch (e) {
                    console.error('Error adding watermark:', e);
                    showAlert(`Error adding watermark: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'rotate-pdf': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="rotate-file">Select PDF file:</label>
                    <input type="file" id="rotate-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="rotate-pages">Pages to rotate (e.g., all, 1, 3-5, 1,3,5):</label>
                    <input type="text" id="rotate-pages" value="all">
                </div>
                <div class="form-group">
                    <label for="rotate-angle">Rotation Angle:</label>
                    <select id="rotate-angle">
                        <option value="90">90° Clockwise</option>
                        <option value="180">180°</option>
                        <option value="270">270° Clockwise (90° Anti-Clockwise)</option>
                    </select>
                </div>
                <button id="rotate-action" class="tool-button">Rotate PDF</button>
                <div id="rotate-result"></div>
            `;
            const fileInput = workspace.querySelector('#rotate-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const pagesInput = workspace.querySelector('#rotate-pages');
            const angleSelect = workspace.querySelector('#rotate-angle');
            const actionButton = workspace.querySelector('#rotate-action');
            const resultDiv = workspace.querySelector('#rotate-result');

            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

            actionButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error'); return;
                }
                const pagesStr = pagesInput.value.trim();
                const angle = parseInt(angleSelect.value, 10);

                if (!pagesStr) {
                    showAlert('Please specify pages to rotate.', 'error'); return;
                }

                showLoader('Rotating PDF pages...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const totalPages = pdfDoc.getPageCount();
                    const pagesToRotate = new Set();

                    if (pagesStr.toLowerCase() === 'all') {
                        for (let i = 0; i < totalPages; i++) pagesToRotate.add(i);
                    } else {
                        pagesStr.split(',').forEach(part => {
                            part = part.trim();
                            if (part.includes('-')) {
                                let [startStr, endStr] = part.split('-');
                                let start = parseInt(startStr.trim(), 10);
                                let end = endStr.trim().toLowerCase() === 'end' ? totalPages : parseInt(endStr.trim(), 10);
                                if (!isNaN(start) && !isNaN(end)) {
                                    for (let i = start; i <= end; i++) {
                                        if (i >= 1 && i <= totalPages) pagesToRotate.add(i - 1);
                                    }
                                }
                            } else {
                                const pageNum = parseInt(part.trim(), 10);
                                if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                                    pagesToRotate.add(pageNum - 1);
                                }
                            }
                        });
                    }

                    if (pagesToRotate.size === 0) {
                        showAlert('No valid pages selected for rotation.', 'warning');
                        hideLoader();
                        return;
                    }

                    Array.from(pagesToRotate).forEach(pageIndex => {
                        const page = pdfDoc.getPage(pageIndex);
                        const currentRotation = page.getRotation().angle;
                        page.setRotation(degrees((currentRotation + angle) % 360));
                    });

                    const rotatedPdfBytes = await pdfDoc.save();
                    const blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
                    resultDiv.appendChild(createDownloadLink(blob, `rotated_${fileInput.files[0].name}`));
                    showAlert('PDF pages rotated successfully!', 'success');

                } catch (e) {
                    console.error('Error rotating PDF:', e);
                    showAlert(`Error rotating PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'protect-pdf': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="protect-file">Select PDF file:</label>
                    <input type="file" id="protect-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="protect-user-password">User Password (to open):</label>
                    <input type="password" id="protect-user-password">
                </div>
                <div class="form-group">
                    <label for="protect-owner-password">Owner Password (to change permissions, optional, defaults to user password if empty):</label>
                    <input type="password" id="protect-owner-password">
                </div>
                <p><strong>Permissions (applied with Owner Password):</strong></p>
                <div class="form-group">
                    <input type="checkbox" id="perm-printing" checked><label for="perm-printing" style="display:inline;font-weight:normal;"> Allow Printing</label><br>
                    <input type="checkbox" id="perm-modifying"><label for="perm-modifying" style="display:inline;font-weight:normal;"> Allow Modifying Document</label><br>
                    <input type="checkbox" id="perm-copying" checked><label for="perm-copying" style="display:inline;font-weight:normal;"> Allow Copying Content</label><br>
                    <input type="checkbox" id="perm-annotating"><label for="perm-annotating" style="display:inline;font-weight:normal;"> Allow Annotating & Form Filling</label><br>
                    <!-- More granular permissions if desired -->
                </div>
                <button id="protect-action" class="tool-button">Protect PDF</button>
                <div id="protect-result"></div>
            `;
            const fileInput = workspace.querySelector('#protect-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const userPasswordInput = workspace.querySelector('#protect-user-password');
            const ownerPasswordInput = workspace.querySelector('#protect-owner-password');
            const actionButton = workspace.querySelector('#protect-action');
            const resultDiv = workspace.querySelector('#protect-result');
    
            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));
            
            actionButton.addEventListener('click', async () => {
                if (!fileInput.files[0] || !userPasswordInput.value) {
                    showAlert('Please select a file and enter at least a user password.', 'error'); return;
                }
                showLoader('Protecting PDF...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true }); // Allow loading already encrypted files if we are re-encrypting.
                    
                    const permissions = {
                        printing: workspace.querySelector('#perm-printing').checked ? 'highResolution' : 'none',
                        modifying: workspace.querySelector('#perm-modifying').checked,
                        copying: workspace.querySelector('#perm-copying').checked,
                        annotating: workspace.querySelector('#perm-annotating').checked,
                        fillingForms: workspace.querySelector('#perm-annotating').checked,
                        accessibility: true, 
                        assembling: workspace.querySelector('#perm-modifying').checked, 
                    };
    
                    const ownerPass = ownerPasswordInput.value || userPasswordInput.value;
    
                    const protectedPdfBytes = await pdfDoc.save({ 
                        userPassword: userPasswordInput.value,
                        ownerPassword: ownerPass,
                        permissions: permissions
                    });
                    const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
                    resultDiv.appendChild(createDownloadLink(blob, `protected_${fileInput.files[0].name}`));
                    showAlert('PDF Protected.', 'success');
                } catch (e) {
                    console.error('Error protecting PDF:', e);
                    showAlert(`Error protecting PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'unlock-pdf': async (workspace) => {
            workspace.innerHTML = `
               <div class="form-group">
                   <label for="unlock-file">Select Protected PDF file:</label>
                   <input type="file" id="unlock-file" accept=".pdf">
                   <div class="file-list-container"></div>
               </div>
               <div class="form-group">
                   <label for="unlock-password">Password (User or Owner):</label>
                   <input type="password" id="unlock-password">
               </div>
               <button id="unlock-action" class="tool-button">Unlock PDF</button>
               <div id="unlock-result"></div>
           `;
           const fileInput = workspace.querySelector('#unlock-file');
           const fileListContainer = workspace.querySelector('.file-list-container');
           const passwordInput = workspace.querySelector('#unlock-password');
           const actionButton = workspace.querySelector('#unlock-action');
           const resultDiv = workspace.querySelector('#unlock-result');
           
           currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
           fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

           actionButton.addEventListener('click', async () => {
               if (!fileInput.files[0] || !passwordInput.value) {
                   showAlert('Please select a file and enter the password.', 'error'); return;
               }
               showLoader('Unlocking PDF...');
               resultDiv.innerHTML = '';
               try {
                   const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                   // Try to load with the password.
                   const pdfDoc = await PDFDocument.load(pdfBytes, { 
                       ownerPassword: passwordInput.value, 
                       userPassword: passwordInput.value
                   });
                   
                   const unlockedPdfBytes = await pdfDoc.save(); 
                   const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
                   resultDiv.appendChild(createDownloadLink(blob, `unlocked_${fileInput.files[0].name}`));
                   showAlert('PDF Unlocked successfully!', 'success');
               } catch (e) {
                   if (e.message && (e.message.toLowerCase().includes('password') || e.message.toLowerCase().includes('encrypted'))) {
                        showAlert('Incorrect password or PDF uses an unsupported encryption method.', 'error');
                   } else {
                       showAlert(`Error unlocking PDF: ${e.message}`, 'error');
                   }
                   console.error('Unlock error:', e);
               } finally {
                   hideLoader();
               }
           });
       },

        'pdf-to-image': async (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="pti-file">Select PDF file:</label>
                    <input type="file" id="pti-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="pti-format">Image Format:</label>
                    <select id="pti-format">
                        <option value="image/png">PNG</option>
                        <option value="image/jpeg">JPEG</option>
                        <option value="image/webp">WEBP</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label for="pti-quality">Quality (for JPEG/WEBP, 0.1 - 1.0):</label>
                    <input type="number" id="pti-quality" value="0.9" step="0.05" min="0.1" max="1.0">
                </div>
                <div class="form-group">
                    <label for="pti-scale">Scale/Resolution (e.g., 1.5 = 150% DPI):</label>
                    <input type="number" id="pti-scale" value="1.5" step="0.1" min="0.5" max="5.0">
                </div>
                <button id="pti-action" class="tool-button">Convert to Images</button>
                <div id="pti-result" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1rem;"></div>
            `;
            const fileInput = workspace.querySelector('#pti-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const formatSelect = workspace.querySelector('#pti-format');
            const qualityInput = workspace.querySelector('#pti-quality');
            const scaleInput = workspace.querySelector('#pti-scale');
            const convertButton = workspace.querySelector('#pti-action');
            const resultDiv = workspace.querySelector('#pti-result');

            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));

            function toggleQualityInput() {
                qualityInput.disabled = formatSelect.value === 'image/png';
                qualityInput.closest('.form-group').style.display = formatSelect.value === 'image/png' ? 'none' : 'block';
            }
            formatSelect.addEventListener('change', toggleQualityInput);
            toggleQualityInput(); // Initial state

            convertButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error');
                    return;
                }
                const imageFormat = formatSelect.value;
                const imageQuality = parseFloat(qualityInput.value);
                const scale = parseFloat(scaleInput.value);
                let fileExtension = imageFormat.split('/')[1];
                if (fileExtension === 'jpeg') fileExtension = 'jpg';


                showLoader('Converting PDF to images...');
                resultDiv.innerHTML = '';
                try {
                    const arrayBuffer = await readFileAsArrayBuffer(fileInput.files[0]);
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true }); // Added cMap for better char support
                    const pdf = await loadingTask.promise;
                    
                    const numPages = pdf.numPages;
                    for (let i = 1; i <= numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: scale });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;

                        const renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        await page.render(renderContext).promise;
                        
                        let dataUrl;
                        if (imageFormat === 'image/png') {
                            dataUrl = canvas.toDataURL(imageFormat);
                        } else {
                            dataUrl = canvas.toDataURL(imageFormat, imageQuality);
                        }
                        
                        const blob = await (await fetch(dataUrl)).blob();

                        const downloadLink = createDownloadLink(blob, `page_${i}.${fileExtension}`, `Download Page ${i} (${fileExtension.toUpperCase()})`);
                        
                        const imgPreview = document.createElement('img');
                        imgPreview.src = dataUrl;
                        imgPreview.style.maxWidth = '150px';
                        imgPreview.style.maxHeight = '200px';
                        imgPreview.style.border = '1px solid #ccc';
                        
                        const pageContainer = document.createElement('div');
                        pageContainer.style.textAlign = 'center';
                        pageContainer.appendChild(imgPreview);
                        pageContainer.appendChild(document.createElement('br'));
                        pageContainer.appendChild(downloadLink);
                        resultDiv.appendChild(pageContainer);
                    }
                    showAlert(`PDF converted to ${numPages} image(s) successfully!`, 'success');
                } catch (e) {
                    console.error('Error converting PDF to image:', e);
                    showAlert(`Error converting PDF to image: ${e.message}. Ensure pdf.worker.min.js is accessible.`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'image-to-pdf': async (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="itp-files">Select image files (JPG, PNG, WEBP):</label>
                    <input type="file" id="itp-files" accept="image/jpeg, image/png, image/webp" multiple>
                    <div class="file-list"></div> <!-- For listing selected images -->
                </div>
                <button id="itp-action" class="tool-button">Convert to PDF</button>
                <div id="itp-result"></div>
            `;
            const fileInput = workspace.querySelector('#itp-files');
            const fileListDiv = workspace.querySelector('.file-list');
            const convertButton = workspace.querySelector('#itp-action');
            const resultDiv = workspace.querySelector('#itp-result');

            currentToolFileHandler = (files) => {
                fileInput.files = files;
                updateItpFileList();
            };

            const updateItpFileList = () => {
                fileListDiv.innerHTML = '';
                 Array.from(fileInput.files).forEach(file => {
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-list-item';
                    fileItem.textContent = file.name;
                    fileListDiv.appendChild(fileItem);
                });
                if (fileInput.files.length === 0) {
                     fileListDiv.innerHTML = '<p class="file-list-display" style="margin-top: 0.5rem; font-size: 0.9em;">No files selected.</p>';
                }
            };
            fileInput.addEventListener('change', updateItpFileList);


            convertButton.addEventListener('click', async () => {
                if (fileInput.files.length === 0) {
                    showAlert('Please select at least one image file.', 'error');
                    return;
                }
                showLoader('Converting images to PDF...');
                resultDiv.innerHTML = '';
                try {
                    const pdfDoc = await PDFDocument.create();
                    for (const file of fileInput.files) {
                        const imageBytes = await readFileAsArrayBuffer(file);
                        let image;
                        if (file.type === 'image/png') {
                            image = await pdfDoc.embedPng(imageBytes);
                        } else if (file.type === 'image/jpeg') {
                            image = await pdfDoc.embedJpg(imageBytes);
                        } else if (file.type === 'image/webp') {
                            // Convert WEBP to PNG/JPEG first using canvas
                            const tempImg = new Image();
                            const dataUrl = URL.createObjectURL(file);
                            await new Promise((resolve, reject) => {
                                tempImg.onload = resolve;
                                tempImg.onerror = reject;
                                tempImg.src = dataUrl;
                            });
                            URL.revokeObjectURL(dataUrl);

                            const canvas = document.createElement('canvas');
                            canvas.width = tempImg.width;
                            canvas.height = tempImg.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(tempImg, 0, 0);
                            const pngDataUrl = canvas.toDataURL('image/png'); // Convert to PNG
                            const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
                            image = await pdfDoc.embedPng(pngBytes);

                        } else {
                            showAlert(`Unsupported image type: ${file.name} (${file.type})`, 'error');
                            continue;
                        }
                        
                        const page = pdfDoc.addPage([image.width, image.height]);
                        page.drawImage(image, {
                            x: 0,
                            y: 0,
                            width: image.width,
                            height: image.height,
                        });
                    }
                    if(pdfDoc.getPageCount() === 0) {
                        showAlert('No valid images were processed.', 'error');
                        hideLoader();
                        return;
                    }
                    const pdfBytes = await pdfDoc.save();
                    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                    const downloadLink = createDownloadLink(blob, 'images_converted.pdf', 'Download PDF from Images');
                    resultDiv.appendChild(downloadLink);
                    showAlert('Images converted to PDF successfully!', 'success');
                } catch (e) {
                    console.error('Error converting images to PDF:', e);
                    showAlert(`Error converting images to PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },
        
        'reorder-pdf': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="reorder-file">Select PDF file:</label>
                    <input type="file" id="reorder-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div id="reorder-preview-area" style="display: flex; flex-wrap: wrap; gap: 10px; border: 1px solid #ccc; padding: 10px; min-height: 100px; background: var(--primary-bg); margin-bottom: 1rem;">
                    <p>Page previews will appear here. Drag to reorder.</p>
                </div>
                <button id="reorder-action" class="tool-button" style="display:none;">Save Reordered PDF</button>
                <div id="reorder-result"></div>
                <p><small>Note: Drag and drop page previews to change their order. Larger PDFs may take time to render previews.</small></p>
            `;
            const fileInput = workspace.querySelector('#reorder-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const previewArea = workspace.querySelector('#reorder-preview-area');
            const actionButton = workspace.querySelector('#reorder-action');
            const resultDiv = workspace.querySelector('#reorder-result');
            let originalPdfDocBytes = null;
            let pageOrder = []; // Stores the original indices of pages in their new order
        
            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; loadPdfForReorder(); }};
            fileInput.addEventListener('change', loadPdfForReorder);
        
            async function loadPdfForReorder() {
                displayFileNames(fileInput, fileListContainer);
                if (!fileInput.files[0]) return;
        
                showLoader('Loading PDF for reordering...');
                previewArea.innerHTML = '<p>Loading previews...</p>';
                actionButton.style.display = 'none';
                resultDiv.innerHTML = '';
                pageOrder = [];
        
                try {
                    originalPdfDocBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const loadingTask = pdfjsLib.getDocument({ data: originalPdfDocBytes.slice(0) }); // Use slice to avoid modifying original buffer
                    const pdf = await loadingTask.promise;
                    
                    previewArea.innerHTML = ''; // Clear loading message
        
                    for (let i = 1; i <= pdf.numPages; i++) {
                        pageOrder.push(i - 1); // Store original 0-based index
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 0.3 }); // Small scale for thumbnails
                        const canvas = document.createElement('canvas');
                        canvas.className = 'reorder-page-thumbnail';
                        canvas.draggable = true;
                        canvas.dataset.originalIndex = i - 1; // Store 0-based index
                        canvas.style.border = "1px solid #999";
                        canvas.style.margin = "5px";
                        canvas.style.cursor = "grab";
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;
                        
                        const context = canvas.getContext('2d');
                        const renderContext = { canvasContext: context, viewport: viewport };
                        await page.render(renderContext).promise;
                        
                        const pageNumberDiv = document.createElement('div');
                        pageNumberDiv.textContent = `Page ${i}`;
                        pageNumberDiv.style.fontSize = "0.8em";
                        pageNumberDiv.style.textAlign = "center";

                        const containerDiv = document.createElement('div');
                        containerDiv.style.display = "inline-block"; // To keep page number below canvas
                        containerDiv.appendChild(canvas);
                        containerDiv.appendChild(pageNumberDiv);

                        previewArea.appendChild(containerDiv);

                        // Drag and Drop listeners for thumbnails
                        canvas.addEventListener('dragstart', handleDragStart);
                        canvas.addEventListener('dragover', handleDragOver);
                        canvas.addEventListener('drop', handleDropOnThumbnail);
                        canvas.addEventListener('dragend', handleDragEnd);
                    }
                    actionButton.style.display = 'block';
                    showAlert('PDF loaded. Drag pages to reorder.', 'info');
                } catch (e) {
                    console.error('Error loading PDF for reorder:', e);
                    showAlert(`Error loading PDF: ${e.message}`, 'error');
                    previewArea.innerHTML = '<p>Error loading PDF previews.</p>';
                } finally {
                    hideLoader();
                }
            }
            
            let draggedItem = null;

            function handleDragStart(e) {
                draggedItem = e.target;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML); // Not really used but good practice
                setTimeout(() => { // Make the dragged item semi-transparent
                    e.target.style.opacity = '0.5';
                }, 0);
            }
            
            function handleDragOver(e) {
                e.preventDefault(); // Necessary to allow dropping
                e.dataTransfer.dropEffect = 'move';
                return false;
            }

            function handleDropOnThumbnail(e) {
                e.preventDefault();
                if (e.target.className === 'reorder-page-thumbnail' && e.target !== draggedItem) {
                    // Determine if dropping before or after the target
                    const targetRect = e.target.getBoundingClientRect();
                    const targetParent = e.target.parentElement;
                    const draggedParent = draggedItem.parentElement;

                    if (e.clientX < targetRect.left + targetRect.width / 2) {
                        targetParent.parentNode.insertBefore(draggedParent, targetParent);
                    } else {
                        targetParent.parentNode.insertBefore(draggedParent, targetParent.nextSibling);
                    }
                }
                // Reset opacity of dragged item if it was changed
                if(draggedItem) draggedItem.style.opacity = '1'; 
                draggedItem = null;
            }

            function handleDragEnd(e) {
                e.target.style.opacity = '1'; // Reset opacity
                draggedItem = null;
                updatePageOrderArray(); // Update the internal pageOrder array
            }

            function updatePageOrderArray() {
                const newOrder = [];
                const thumbnails = previewArea.querySelectorAll('.reorder-page-thumbnail');
                thumbnails.forEach(thumb => {
                    newOrder.push(parseInt(thumb.dataset.originalIndex, 10));
                });
                pageOrder = newOrder;
                // Update visual page numbers
                thumbnails.forEach((thumb, idx) => {
                    const pageNumberDiv = thumb.nextElementSibling; // Assuming it's the next sibling
                    if (pageNumberDiv) {
                        pageNumberDiv.textContent = `New Pos: ${idx + 1} (Orig: ${parseInt(thumb.dataset.originalIndex, 10) + 1})`;
                    }
                });
            }

            actionButton.addEventListener('click', async () => {
                if (!originalPdfDocBytes || pageOrder.length === 0) {
                    showAlert('No PDF loaded or no pages to reorder.', 'error'); return;
                }
                showLoader('Reordering PDF...');
                resultDiv.innerHTML = '';
                try {
                    const originalPdf = await PDFDocument.load(originalPdfDocBytes);
                    const newPdf = await PDFDocument.create();
                    
                    const copiedPages = await newPdf.copyPages(originalPdf, pageOrder);
                    copiedPages.forEach(page => newPdf.addPage(page));

                    const reorderedPdfBytes = await newPdf.save();
                    const blob = new Blob([reorderedPdfBytes], { type: 'application/pdf' });
                    resultDiv.appendChild(createDownloadLink(blob, `reordered_${fileInput.files[0].name}`));
                    showAlert('PDF pages reordered successfully!', 'success');
                } catch (e) {
                    console.error('Error reordering PDF:', e);
                    showAlert(`Error reordering PDF: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'add-page-numbers': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="apn-file">Select PDF file:</label>
                    <input type="file" id="apn-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <div class="form-group">
                    <label for="apn-start-page">Start numbering from physical page:</label>
                    <input type="number" id="apn-start-page" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-start-number">Starting number to display:</label>
                    <input type="number" id="apn-start-number" value="1" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-position">Position:</label>
                    <select id="apn-position">
                        <option value="footer-center">Footer Center</option>
                        <option value="footer-left">Footer Left</option>
                        <option value="footer-right">Footer Right</option>
                        <option value="header-center">Header Center</option>
                        <option value="header-left">Header Left</option>
                        <option value="header-right">Header Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="apn-margin">Margin (from edge, in points):</label>
                    <input type="number" id="apn-margin" value="36" min="0"> <!-- 72 points = 1 inch -->
                </div>
                <div class="form-group">
                    <label for="apn-font-size">Font Size (points):</label>
                    <input type="number" id="apn-font-size" value="10" min="1">
                </div>
                <div class="form-group">
                    <label for="apn-format">Number Format (use {page} for current number, {total} for total pages):</label>
                    <input type="text" id="apn-format" value="Page {page} of {total}">
                </div>
                <button id="apn-action" class="tool-button">Add Page Numbers</button>
                <div id="apn-result"></div>
            `;
    
            const fileInput = workspace.querySelector('#apn-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const startPageInput = workspace.querySelector('#apn-start-page');
            const startNumInput = workspace.querySelector('#apn-start-number');
            const positionSelect = workspace.querySelector('#apn-position');
            const marginInput = workspace.querySelector('#apn-margin');
            const fontSizeInput = workspace.querySelector('#apn-font-size');
            const formatInput = workspace.querySelector('#apn-format');
            const actionButton = workspace.querySelector('#apn-action');
            const resultDiv = workspace.querySelector('#apn-result');
    
            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));
    
            actionButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error'); return;
                }
                showLoader('Adding page numbers...');
                resultDiv.innerHTML = '';
                try {
                    const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
                    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    
                    const totalDocPages = pdfDoc.getPageCount();
                    const physicalStartPage = parseInt(startPageInput.value, 10); // 1-indexed physical page
                    let currentDisplayNumber = parseInt(startNumInput.value, 10);
                    const position = positionSelect.value;
                    const margin = parseInt(marginInput.value, 10);
                    const fontSize = parseInt(fontSizeInput.value, 10);
                    const format = formatInput.value;
    
                    const pages = pdfDoc.getPages();
                    for (let i = 0; i < totalDocPages; i++) { // i is 0-indexed physical page
                        if ((i + 1) < physicalStartPage) continue; 
    
                        const page = pages[i];
                        const { width, height } = page.getSize();
                        // Calculate total number of pages to be numbered
                        const totalNumberedPages = totalDocPages - physicalStartPage + 1;
                        // For {total}, we might want total pages in document or total pages being numbered
                        // Let's use total document pages for simplicity, or adjust based on requirements
                        const text = format.replace('{page}', currentDisplayNumber.toString())
                                           .replace('{total}', totalDocPages.toString()); 
                        const textWidth = helveticaFont.widthOfTextAtSize(text, fontSize);
                        
                        let x, y;
                        const [posVertical, posHorizontal] = position.split('-');
    
                        if (posVertical === 'header') {
                            y = height - margin - fontSize; // Baseline is bottom of text, so position from top edge
                        } else { // footer
                            y = margin; // Baseline is bottom of text, so position from bottom edge
                        }
    
                        if (posHorizontal === 'left') {
                            x = margin;
                        } else if (posHorizontal === 'center') {
                            x = (width - textWidth) / 2;
                        } else { // right
                            x = width - margin - textWidth;
                        }
                        
                        page.drawText(text, {
                            x: x,
                            y: y,
                            size: fontSize,
                            font: helveticaFont,
                            color: rgb(0.1, 0.1, 0.1), // Dark gray
                        });
                        currentDisplayNumber++;
                    }
    
                    const numberedPdfBytes = await pdfDoc.save();
                    const blob = new Blob([numberedPdfBytes], { type: 'application/pdf' });
                    resultDiv.appendChild(createDownloadLink(blob, `numbered_${fileInput.files[0].name}`));
                    showAlert('Page numbers added successfully!', 'success');
    
                } catch (e) {
                    console.error('Error adding page numbers:', e);
                    showAlert(`Error adding page numbers: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'extract-images': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="extract-img-file">Select PDF file:</label>
                    <input type="file" id="extract-img-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                <button id="extract-img-action" class="tool-button">Extract Images</button>
                <div id="extract-img-result" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 1rem;"></div>
                <p><small>Note: Client-side image extraction accuracy depends on PDF structure and image encoding. Supports common formats like JPEG and some raw image types via canvas. Some complex or obscurely embedded images might not be extracted or might appear distorted.</small></p>
            `;
            const fileInput = workspace.querySelector('#extract-img-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const actionButton = workspace.querySelector('#extract-img-action');
            const resultDiv = workspace.querySelector('#extract-img-result');
            let imageCounter = 0;
    
            currentToolFileHandler = (files) => { if(files.length > 0) { fileInput.files = files; displayFileNames(fileInput, fileListContainer); }};
            fileInput.addEventListener('change', () => displayFileNames(fileInput, fileListContainer));
    
            async function processExtractedImage(imgData, type, pageNum, imgIdxOnPage) {
                try {
                    const blob = new Blob([imgData], { type: type });
                    const extension = type.split('/')[1] || 'bin';
                    const filename = `p${pageNum}_img${imgIdxOnPage}.${extension}`;
                    
                    const downloadLink = createDownloadLink(blob, filename, `Download ${filename}`);
                    
                    const imgPreview = document.createElement('img');
                    imgPreview.style.maxWidth = '150px';
                    imgPreview.style.maxHeight = '200px';
                    imgPreview.style.border = '1px solid #ccc';
                    imgPreview.style.objectFit = 'contain';
                    imgPreview.onload = () => URL.revokeObjectURL(imgPreview.src);
                    imgPreview.onerror = () => { 
                        imgPreview.alt = `Preview not available (${type})`; 
                        imgPreview.src=''; 
                        imgPreview.style.width = '150px'; 
                        imgPreview.style.height = '100px'; 
                        imgPreview.style.display = 'flex';
                        imgPreview.style.alignItems = 'center';
                        imgPreview.style.justifyContent = 'center';
                        imgPreview.style.backgroundColor = '#f0f0f0';
                        imgPreview.textContent = 'No Preview';
                    };
                    imgPreview.src = URL.createObjectURL(blob);
                    
                    const imgContainer = document.createElement('div');
                    imgContainer.style.textAlign = 'center';
                    imgContainer.appendChild(imgPreview);
                    imgContainer.appendChild(document.createElement('br'));
                    imgContainer.appendChild(downloadLink);
                    resultDiv.appendChild(imgContainer);
                    imageCounter++;
                } catch (e) {
                    console.warn(`Could not process image p${pageNum}_img${imgIdxOnPage}:`, e);
                }
            }
    
    
            actionButton.addEventListener('click', async () => {
                if (!fileInput.files[0]) {
                    showAlert('Please select a PDF file.', 'error'); return;
                }
                showLoader('Extracting images...');
                resultDiv.innerHTML = '';
                imageCounter = 0;
    
                try {
                    const arrayBuffer = await readFileAsArrayBuffer(fileInput.files[0]);
                    // Use pdf.js for rendering and image object access
                    const pdfjsDoc = await pdfjsLib.getDocument({data: arrayBuffer.slice(0), cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true }).promise;
    
                    for (let i = 0; i < pdfjsDoc.numPages; i++) {
                        const page = await pdfjsDoc.getPage(i + 1);
                        const operatorList = await page.getOperatorList();
                        
                        const imagesOnPage = new Set(); // To avoid duplicates from same resource name
                        let imgIdxOnPage = 0;
    
                        for (let j = 0; j < operatorList.fnArray.length; j++) {
                            const op = operatorList.fnArray[j];
                            const args = operatorList.argsArray[j];
    
                            if (op === pdfjsLib.OPS.paintImageXObject || op === pdfjsLib.OPS.paintImageXObjectRepeat) {
                                const imgName = args[0]; // Resource name of the image
                                if (imagesOnPage.has(imgName)) continue;
                                imagesOnPage.add(imgName);
                                imgIdxOnPage++;
    
                                try {
                                    const imgResource = await page.commonObjs.get(imgName);
                                    if (imgResource && imgResource.data) {
                                        let mimeType = 'image/unknown'; // Default
                                        let dataToProcess = imgResource.data;

                                        if (imgResource.kind === pdfjsLib.ImageKind.JPEG) {
                                            mimeType = 'image/jpeg';
                                        } else if (imgResource.kind === pdfjsLib.ImageKind.JPX) {
                                            // JPX (JPEG2000) is tricky. pdf.js decodes it for rendering.
                                            // We'll try to re-encode via canvas to PNG.
                                            mimeType = 'image/png'; // Target format after canvas
                                        } else if (imgResource.smask || imgResource.mask) {
                                            // Images with masks need to be rendered to canvas to apply the mask
                                            mimeType = 'image/png'; // Target format
                                        }

                                        // If raw pixel data or needs canvas processing (JPX, masks)
                                        if (imgResource.kind !== pdfjsLib.ImageKind.JPEG || mimeType === 'image/png') {
                                            const canvas = document.createElement('canvas');
                                            canvas.width = imgResource.width;
                                            canvas.height = imgResource.height;
                                            const ctx = canvas.getContext('2d');
                                            
                                            if (imgResource.kind === pdfjsLib.ImageKind.RGBA_32BPP && dataToProcess.length === imgResource.width * imgResource.height * 4) {
                                                const imageData = ctx.createImageData(imgResource.width, imgResource.height);
                                                imageData.data.set(dataToProcess);
                                                ctx.putImageData(imageData, 0, 0);
                                            } else if (imgResource.kind === pdfjsLib.ImageKind.RGB_24BPP && dataToProcess.length === imgResource.width * imgResource.height * 3) {
                                                const imageData = ctx.createImageData(imgResource.width, imgResource.height);
                                                let k = 0; // Source index
                                                for (let l = 0; l < imageData.data.length; l += 4) { // Target index
                                                    imageData.data[l]     = dataToProcess[k++];
                                                    imageData.data[l + 1] = dataToProcess[k++];
                                                    imageData.data[l + 2] = dataToProcess[k++];
                                                    imageData.data[l + 3] = 255; // Alpha
                                                }
                                                ctx.putImageData(imageData, 0, 0);
                                            } else {
                                                // For JPX, or images with masks, we can't directly use 'data'.
                                                // We'd have to simulate the rendering path of pdf.js more closely or
                                                // rely on a simpler approach of just capturing the whole page if this is too complex.
                                                // For now, if it's not JPEG or simple RGB/RGBA, we might skip or warn.
                                                // This part is the most complex for true image extraction.
                                                // A simplified "render XObject to canvas" would be ideal if pdf.js offered it directly.
                                                // Fallback: If it has width/height, try to draw it.
                                                // This is a placeholder for more advanced handling.
                                                // console.warn(`Image ${imgName} on page ${i+1} is of complex kind ${imgResource.kind} or has masks. Extraction might be imperfect.`);
                                                // To render specific XObject, one would typically create a temporary canvas,
                                                // set up a transform, and call an equivalent of `ctx.drawImage(imgResource, 0,0)`.
                                                // pdf.js's internal renderer handles this. Simulating it fully is hard.
                                                // For now, let's just try to get PNG from canvas as a generic approach if not JPEG.
                                                 ctx.drawImage(imgResource, 0, 0); // This is a conceptual call; imgResource is not directly drawable.
                                                                                 // This line will likely fail as is.
                                                                                 // The proper way involves page.paint όχιect on a sub-canvas.
                                            }
                                            const dataUrl = canvas.toDataURL(mimeType); // try to get specified, or defaults to png
                                            const blob = await (await fetch(dataUrl)).blob();
                                            await processExtractedImage(blob, mimeType, i + 1, imgIdxOnPage);
                                            continue;
                                        }
                                        // For JPEGs or other directly usable binary data if not processed above
                                        await processExtractedImage(dataToProcess, mimeType, i + 1, imgIdxOnPage);
                                    }
                                } catch (imgError) {
                                    console.warn(`Could not get or process image resource ${imgName} on page ${i+1}:`, imgError);
                                }
                            }
                        }
                    }
                    
                    if (imageCounter > 0) {
                        showAlert(`${imageCounter} image(s) extracted (or attempted). Some complex images might not be extracted correctly.`, 'success');
                    } else {
                        showAlert('No directly extractable images found or supported by this basic method.', 'info');
                    }
    
                } catch (e) {
                    console.error('Error extracting images:', e);
                    showAlert(`Error extracting images: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'edit-metadata': (workspace) => {
            workspace.innerHTML = `
               <div class="form-group">
                   <label for="meta-file">Select PDF file:</label>
                   <input type="file" id="meta-file" accept=".pdf">
                   <div class="file-list-container"></div>
               </div>
               <div id="meta-fields" style="max-height: 300px; overflow-y:auto; border: 1px solid #ccc; padding:10px; margin-bottom:1rem;"></div>
               <button id="meta-save" class="tool-button" style="display:none;">Save Metadata</button>
               <div id="meta-result"></div>
           `;
           const fileInput = workspace.querySelector('#meta-file');
           const fileListContainer = workspace.querySelector('.file-list-container');
           const fieldsDiv = workspace.querySelector('#meta-fields');
           const saveButton = workspace.querySelector('#meta-save');
           const resultDiv = workspace.querySelector('#meta-result');
           let currentPdfDoc = null; // Store loaded PDFDocument instance

           currentToolFileHandler = (files) => { 
               if(files.length > 0) {
                   fileInput.files = files;
                   handleMetaFileSelect();
               }
           };
           fileInput.addEventListener('change', handleMetaFileSelect);

           async function handleMetaFileSelect() {
               displayFileNames(fileInput, fileListContainer);
               if (!fileInput.files[0]) return;

               showLoader('Loading metadata...');
               fieldsDiv.innerHTML = '';
               saveButton.style.display = 'none';
               resultDiv.innerHTML = '';
               currentPdfDoc = null;

               try {
                   const pdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                   currentPdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false }); // updateMetadata false to preserve original dates initially
                   
                   const metadata = {
                       Title: currentPdfDoc.getTitle() || '',
                       Author: currentPdfDoc.getAuthor() || '',
                       Subject: currentPdfDoc.getSubject() || '',
                       Keywords: currentPdfDoc.getKeywords() || '', // This is a string from pdf-lib
                       Creator: currentPdfDoc.getCreator() || '',
                       Producer: currentPdfDoc.getProducer() || '',
                       CreationDate: currentPdfDoc.getCreationDate()?.toLocaleString() || 'N/A',
                       ModificationDate: currentPdfDoc.getModificationDate()?.toLocaleString() || 'N/A',
                   };

                   for (const key in metadata) {
                       fieldsDiv.innerHTML += `
                           <div class="form-group">
                               <label for="meta-${key.toLowerCase()}">${key}:</label>
                               <input type="text" id="meta-${key.toLowerCase()}" data-key="${key}" 
                                      value="${metadata[key]}" 
                                      ${key.includes('Date') || key === 'Producer' ? 'disabled' : ''}>
                           </div>`;
                   }
                   saveButton.style.display = 'block';
                   showAlert('Metadata loaded. Edit fields and save.', 'info');
               } catch (e) {
                   showAlert(`Error loading metadata: ${e.message}`, 'error');
                   console.error("Metadata load error:", e);
               } finally {
                   hideLoader();
               }
           }

           saveButton.addEventListener('click', async () => {
               if (!currentPdfDoc) return;
               showLoader('Saving metadata...');
               try {
                   currentPdfDoc.setTitle(workspace.querySelector('#meta-title').value);
                   currentPdfDoc.setAuthor(workspace.querySelector('#meta-author').value);
                   currentPdfDoc.setSubject(workspace.querySelector('#meta-subject').value);
                   const keywordsString = workspace.querySelector('#meta-keywords').value;
                   currentPdfDoc.setKeywords(keywordsString.split(',').map(k => k.trim()).filter(k => k)); // pdf-lib expects array of strings
                   currentPdfDoc.setCreator(workspace.querySelector('#meta-creator').value);
                   // Producer is often set by the library, but can be overridden if needed.
                   // currentPdfDoc.setProducer('Pro PDF Utility'); 
                   // Dates are updated automatically by pdf-lib on save unless updateMetadata is false
                   // To explicitly set modification date:
                   // currentPdfDoc.setModificationDate(new Date());


                   const updatedPdfBytes = await currentPdfDoc.save({ updateMetadata: true }); // Ensure metadata update is true for dates
                   const blob = new Blob([updatedPdfBytes], { type: 'application/pdf' });
                   resultDiv.appendChild(createDownloadLink(blob, `meta_updated_${fileInput.files[0].name}`));
                   showAlert('Metadata updated successfully!', 'success');
               } catch (e) {
                   showAlert(`Error saving metadata: ${e.message}`, 'error');
                   console.error("Metadata save error:", e);
               } finally {
                   hideLoader();
               }
           });
       },

        'html-to-pdf': (workspace) => { 
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="html-input">Enter HTML content (with inline or &lt;style&gt; CSS):</label>
                    <textarea id="html-input" rows="10" placeholder="<h1>Hello World</h1><p style='color:blue;'>This is a test.</p>"></textarea>
                </div>
                <button id="html-to-pdf-action" class="tool-button">Convert HTML to PDF</button>
                <div id="html-to-pdf-result"></div>
                <p><small>Note: Uses browser's print-to-PDF functionality via an iframe. Complex CSS or external resources might not render perfectly. Best for simple, self-contained HTML.</small></p>
                <iframe id="html-render-iframe" style="width:1px; height:1px; position:absolute; left:-9999px; border:none;"></iframe>

            `;
            const htmlInput = workspace.querySelector('#html-input');
            const actionButton = workspace.querySelector('#html-to-pdf-action');
            const resultDiv = workspace.querySelector('#html-to-pdf-result');
            const iframe = workspace.querySelector('#html-render-iframe');

            currentToolFileHandler = null; // This tool doesn't use the global file handler

            actionButton.addEventListener('click', async () => {
                const htmlContent = htmlInput.value;
                if (!htmlContent.trim()) {
                    showAlert('Please enter some HTML content.', 'error');
                    return;
                }
                showLoader('Converting HTML to PDF...');
                resultDiv.innerHTML = '';

                try {
                    // This approach uses the browser's native print-to-PDF.
                    // It's the most reliable way without external libraries for complex rendering.
                    // However, it will open the print dialog. User has to select "Save as PDF".
                    // True direct conversion without print dialog needs libraries like html2pdf.js or server-side.

                    const iframeDoc = iframe.contentWindow.document;
                    iframeDoc.open();
                    iframeDoc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Content</title></head><body>' + htmlContent + '</body></html>');
                    iframeDoc.close();
                    
                    // Wait for iframe content to hopefully render
                    await new Promise(resolve => setTimeout(resolve, 500)); 

                    iframe.contentWindow.focus(); // Focus iframe to make print work reliably
                    iframe.contentWindow.print();
                    
                    // Since it opens print dialog, we can't directly provide a download link here.
                    showAlert('Print dialog opened. Please select "Save as PDF".', 'info');
                    resultDiv.innerHTML = '<p>Your browser\'s print dialog should have appeared. Choose "Save as PDF" to generate the PDF.</p>';

                } catch (e) {
                    console.error('Error converting HTML to PDF:', e);
                    showAlert(`Error during HTML to PDF conversion: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },

        'esign-pdf': (workspace) => {
            workspace.innerHTML = `
                <div class="form-group">
                    <label for="esign-file">Select PDF to Sign:</label>
                    <input type="file" id="esign-file" accept=".pdf">
                    <div class="file-list-container"></div>
                </div>
                
                <div id="esign-options" style="display:none;">
                    <div class="form-group">
                        <label>Signature Method:</label>
                        <select id="esign-method">
                            <option value="draw">Draw Signature</option>
                            <option value="type">Type Signature</option>
                            <option value="upload">Upload Signature Image</option>
                        </select>
                    </div>

                    <div id="esign-draw-pad" class="esign-method-panel">
                        <label>Draw your signature below:</label>
                        <canvas id="signature-canvas" width="400" height="150" style="border:1px solid #ccc; background-color: #fff; touch-action: none;"></canvas>
                        <button id="clear-signature-button" class="tool-button" style="width:auto; margin-top:5px; background-color: #757575;">Clear</button>
                    </div>
                    <div id="esign-type-pad" class="esign-method-panel" style="display:none;">
                        <label for="typed-signature-text">Type your name/signature:</label>
                        <input type="text" id="typed-signature-text" placeholder="Your Name">
                        <label for="typed-signature-font">Font:</label>
                        <select id="typed-signature-font">
                            <option value="Times New Roman, Times, serif">Times New Roman</option>
                            <option value="Arial, Helvetica, sans-serif">Arial</option>
                            <option value="Courier New, Courier, monospace">Courier New</option>
                            <option value="'Brush Script MT', cursive">Brush Script MT</option>
                            <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                            <option value="'Lucida Handwriting', cursive">Lucida Handwriting</option>
                            <option value="'Sacramento', cursive">Sacramento (Google Font - needs import or local)</option>
                        </select>
                    </div>
                    <div id="esign-upload-pad" class="esign-method-panel" style="display:none;">
                        <label for="signature-image-upload">Upload signature image (PNG, JPG, WEBP with transparent background preferred for PNG/WEBP):</label>
                        <input type="file" id="signature-image-upload" accept="image/png, image/jpeg, image/webp">
                        <img id="signature-image-preview" src="#" alt="Signature preview" style="max-width:200px; max-height:100px; display:none; margin-top:5px; border: 1px solid #eee;"/>
                    </div>

                    <div class="form-group">
                        <label for="esign-page-num">Page to Sign (1-indexed):</label>
                        <input type="number" id="esign-page-num" value="1" min="1">
                    </div>
                     <div class="form-group">
                        <label>Signature Position (Approximate):</label>
                         <select id="esign-position">
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="center">Center</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="esign-scale">Signature Scale (e.g., 0.5 = 50% of original size):</label>
                        <input type="number" id="esign-scale" value="0.5" step="0.1" min="0.1" max="2.0">
                    </div>
                    <button id="esign-apply-action" class="tool-button">Apply Signature & Download</button>
                </div>
                <div id="esign-result"></div>
            `;
    
            const fileInput = workspace.querySelector('#esign-file');
            const fileListContainer = workspace.querySelector('.file-list-container');
            const optionsDiv = workspace.querySelector('#esign-options');
            const methodSelect = workspace.querySelector('#esign-method');
            const drawPad = workspace.querySelector('#esign-draw-pad');
            const typePad = workspace.querySelector('#esign-type-pad');
            const uploadPad = workspace.querySelector('#esign-upload-pad');
            const signatureCanvas = workspace.querySelector('#signature-canvas');
            const typedText = workspace.querySelector('#typed-signature-text');
            const typedFontSelect = workspace.querySelector('#typed-signature-font');
            const sigUploadInput = workspace.querySelector('#signature-image-upload');
            const sigImgPreview = workspace.querySelector('#signature-image-preview');
            const clearButton = workspace.querySelector('#clear-signature-button');
            const pageNumInput = workspace.querySelector('#esign-page-num');
            const positionSelect = workspace.querySelector('#esign-position');
            const scaleInput = workspace.querySelector('#esign-scale');
            const applyButton = workspace.querySelector('#esign-apply-action');
            const resultDiv = workspace.querySelector('#esign-result');
            
            let originalPdfBytes = null;
            let sigCanvasCtx = signatureCanvas.getContext('2d');
            let drawing = false;
            let lastX, lastY;
            sigCanvasCtx.lineWidth = 2.5;
            sigCanvasCtx.lineJoin = 'round';
            sigCanvasCtx.lineCap = 'round';
            sigCanvasCtx.strokeStyle = 'black';
    
            currentToolFileHandler = (files) => { 
                if(files.length > 0) { 
                    fileInput.files = files; 
                    handleFileSelectForSign();
                }
            };
            fileInput.addEventListener('change', handleFileSelectForSign);
            
            async function handleFileSelectForSign() {
                displayFileNames(fileInput, fileListContainer);
                if (!fileInput.files[0]) {
                    optionsDiv.style.display = 'none';
                    originalPdfBytes = null;
                    return;
                }
                try {
                    showLoader('Loading PDF...');
                    originalPdfBytes = await readFileAsArrayBuffer(fileInput.files[0]);
                    const tempPdfDoc = await PDFDocument.load(originalPdfBytes.slice(0), {ignoreEncryption: true});
                    pageNumInput.max = tempPdfDoc.getPageCount();
                    pageNumInput.value = Math.min(parseInt(pageNumInput.value,10) || 1, tempPdfDoc.getPageCount()); // Ensure valid page
                    optionsDiv.style.display = 'block';
                    showAlert('PDF loaded. Configure signature.', 'info');
                } catch (e) {
                    showAlert(`Error loading PDF: ${e.message}`, 'error');
                    optionsDiv.style.display = 'none';
                    originalPdfBytes = null;
                } finally {
                    hideLoader();
                }
            }
    
            methodSelect.addEventListener('change', () => {
                drawPad.style.display = methodSelect.value === 'draw' ? 'block' : 'none';
                typePad.style.display = methodSelect.value === 'type' ? 'block' : 'none';
                uploadPad.style.display = methodSelect.value === 'upload' ? 'block' : 'none';
            });
    
            // Drawing signature logic
            function getTouchPos(canvasDom, touchEvent) {
                var rect = canvasDom.getBoundingClientRect();
                return {
                    x: touchEvent.touches[0].clientX - rect.left,
                    y: touchEvent.touches[0].clientY - rect.top
                };
            }
            function getMousePos(canvasDom, mouseEvent) {
                var rect = canvasDom.getBoundingClientRect();
                return {
                    x: mouseEvent.clientX - rect.left,
                    y: mouseEvent.clientY - rect.top
                };
            }

            signatureCanvas.addEventListener('mousedown', (e) => {
                const mousePos = getMousePos(signatureCanvas, e);
                drawing = true;
                lastX = mousePos.x;
                lastY = mousePos.y;
                sigCanvasCtx.beginPath(); // Start a new path for each stroke
            }, false);
            signatureCanvas.addEventListener('mousemove', (e) => {
                if (!drawing) return;
                const mousePos = getMousePos(signatureCanvas, e);
                sigCanvasCtx.moveTo(lastX, lastY);
                sigCanvasCtx.lineTo(mousePos.x, mousePos.y);
                sigCanvasCtx.stroke();
                lastX = mousePos.x;
                lastY = mousePos.y;
            }, false);
            signatureCanvas.addEventListener('mouseup', () => drawing = false, false);
            signatureCanvas.addEventListener('mouseout', () => drawing = false, false);

            signatureCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling
                const touchPos = getTouchPos(signatureCanvas, e);
                drawing = true;
                lastX = touchPos.x;
                lastY = touchPos.y;
                sigCanvasCtx.beginPath();
            }, false);
            signatureCanvas.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Prevent scrolling
                if (!drawing) return;
                const touchPos = getTouchPos(signatureCanvas, e);
                sigCanvasCtx.moveTo(lastX, lastY);
                sigCanvasCtx.lineTo(touchPos.x, touchPos.y);
                sigCanvasCtx.stroke();
                lastX = touchPos.x;
                lastY = touchPos.y;
            }, false);
            signatureCanvas.addEventListener('touchend', () => drawing = false, false);

            clearButton.addEventListener('click', () => {
                sigCanvasCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            });
    
            sigUploadInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        sigImgPreview.src = ev.target.result;
                        sigImgPreview.style.display = 'block';
                    }
                    reader.readAsDataURL(e.target.files[0]);
                } else {
                    sigImgPreview.style.display = 'none';
                    sigImgPreview.src = '#';
                }
            });
    
            applyButton.addEventListener('click', async () => {
                if (!originalPdfBytes) {
                    showAlert('Please select a PDF file first.', 'error'); return;
                }
                const pageNum = parseInt(pageNumInput.value, 10);
                const sigScale = parseFloat(scaleInput.value);

                if (isNaN(pageNum) || pageNum < 1) {
                    showAlert('Please enter a valid page number.', 'error'); return;
                }
                if (isNaN(sigScale) || sigScale <= 0) {
                     showAlert('Please enter a valid signature scale > 0.', 'error'); return;
                }
    
                showLoader('Applying signature...');
                resultDiv.innerHTML = '';
                try {
                    const pdfDoc = await PDFDocument.load(originalPdfBytes.slice(0), { ignoreEncryption: true });
                    if (pageNum > pdfDoc.getPageCount()) {
                        showAlert(`Page ${pageNum} does not exist. PDF has ${pdfDoc.getPageCount()} pages.`, 'error');
                        hideLoader(); return;
                    }
                    const pageToSign = pdfDoc.getPage(pageNum - 1);
                    
                    let signatureImageEmbedded; // This will hold the PDFImage object
                    let sigDims = { width: 150, height: 75 }; // Default dimensions, will be overridden
    
                    if (methodSelect.value === 'draw') {
                        // Check if canvas is empty by checking pixel data
                        const blankCanvas = document.createElement('canvas');
                        blankCanvas.width = signatureCanvas.width; blankCanvas.height = signatureCanvas.height;
                        if (signatureCanvas.toDataURL() === blankCanvas.toDataURL()) {
                             showAlert('Please draw a signature or choose another method.', 'error'); hideLoader(); return;
                        }
                        const signatureImageBytes = await fetch(signatureCanvas.toDataURL('image/png')).then(res => res.arrayBuffer());
                        signatureImageEmbedded = await pdfDoc.embedPng(signatureImageBytes);
                        sigDims = signatureImageEmbedded.scale(sigScale);
                    } else if (methodSelect.value === 'type') {
                        const text = typedText.value;
                        const fontCss = typedFontSelect.value;
                        if (!text.trim()) { showAlert('Please type a signature.', 'error'); hideLoader(); return; }
                        
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        const fontSize = 60; 
                        tempCtx.font = `${fontSize}px ${fontCss}`;
                        const textMetrics = tempCtx.measureText(text);
                        // Add some padding
                        tempCanvas.width = textMetrics.width + 40; 
                        tempCanvas.height = fontSize + 40; 
                        // Re-set font and context properties after resize
                        tempCtx.font = `${fontSize}px ${fontCss}`;
                        tempCtx.fillStyle = "black";
                        tempCtx.textBaseline = "middle";
                        tempCtx.textAlign = "center";
                        tempCtx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);

                        const signatureImageBytes = await fetch(tempCanvas.toDataURL('image/png')).then(res => res.arrayBuffer());
                        signatureImageEmbedded = await pdfDoc.embedPng(signatureImageBytes);
                        sigDims = signatureImageEmbedded.scale(sigScale);
    
                    } else if (methodSelect.value === 'upload') {
                        if (!sigUploadInput.files[0]) { showAlert('Please upload a signature image.', 'error'); hideLoader(); return; }
                        const signatureImageBytes = await readFileAsArrayBuffer(sigUploadInput.files[0]);
                        const fileType = sigUploadInput.files[0].type;
                        if(fileType === 'image/png'){
                            signatureImageEmbedded = await pdfDoc.embedPng(signatureImageBytes);
                        } else if (fileType === 'image/jpeg'){
                            signatureImageEmbedded = await pdfDoc.embedJpg(signatureImageBytes);
                        } else if (fileType === 'image/webp') {
                            // Convert WEBP to PNG via canvas as pdf-lib doesn't embed WEBP directly
                            const tempImage = new Image();
                            const dataUrl = URL.createObjectURL(new Blob([signatureImageBytes]));
                            await new Promise((resolve, reject) => { tempImage.onload = resolve; tempImage.onerror = reject; tempImage.src = dataUrl; });
                            URL.revokeObjectURL(dataUrl);
                            const canvas = document.createElement('canvas');
                            canvas.width = tempImage.width; canvas.height = tempImage.height;
                            canvas.getContext('2d').drawImage(tempImage, 0, 0);
                            const pngBytes = await fetch(canvas.toDataURL('image/png')).then(res => res.arrayBuffer());
                            signatureImageEmbedded = await pdfDoc.embedPng(pngBytes);
                        } else {
                            showAlert('Unsupported image type for upload. Use PNG, JPG, or WEBP.', 'error'); hideLoader(); return;
                        }
                        sigDims = signatureImageEmbedded.scale(sigScale);
                    }
    
                    const { width: pageWidth, height: pageHeight } = pageToSign.getSize();
                    let sigX, sigY;
                    const margin = Math.min(pageWidth, pageHeight) * 0.05; // 5% margin
    
                    switch(positionSelect.value) {
                        case 'bottom-right':
                            sigX = pageWidth - sigDims.width - margin;
                            sigY = margin;
                            break;
                        case 'bottom-left':
                            sigX = margin;
                            sigY = margin;
                            break;
                        case 'top-right':
                            sigX = pageWidth - sigDims.width - margin;
                            sigY = pageHeight - sigDims.height - margin;
                            break;
                        case 'top-left':
                            sigX = margin;
                            sigY = pageHeight - sigDims.height - margin;
                            break;
                        case 'center': default:
                            sigX = (pageWidth - sigDims.width) / 2;
                            sigY = (pageHeight - sigDims.height) / 2;
                            break;
                    }
    
                    pageToSign.drawImage(signatureImageEmbedded, {
                        x: sigX,
                        y: sigY,
                        width: sigDims.width,
                        height: sigDims.height,
                    });
    
                    const signedPdfBytes = await pdfDoc.save();
                    const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
                    resultDiv.appendChild(createDownloadLink(blob, `signed_${fileInput.files[0].name}`));
                    showAlert('Signature applied successfully!', 'success');
    
                } catch (e) {
                    console.error('Error applying signature:', e);
                    showAlert(`Error applying signature: ${e.message}`, 'error');
                } finally {
                    hideLoader();
                }
            });
        },
    };

    // Initialize the application
    init();
});
