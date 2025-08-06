function loadFallbackXLSX() {
    console.warn('Primary SheetJS CDN failed, trying local fallback...');
    const localScript = document.createElement('script');
    localScript.src = 'xlsx.full.min.js';
    localScript.onerror = () => {
        console.error('Local SheetJS fallback failed. Ensure xlsx.full.min.js (version 0.21.0) is in the same directory as index.html. Download it from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js.');
        alert('Failed to load SheetJS library. Please download xlsx.full.min.js (version 0.21.0) from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js, place it in the same directory as index.html, check your internet connection, and disable ad-blockers.');
    };
    document.head.appendChild(localScript);
}

// Load forms and attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    const sections = [
        'audit-5s',
        'audit-gemba',
        'emplissage-tableau',
        'taux-absenteisme',
        'taux-realisation-gemba',
        'taux-realisation-5s',
        'top-action-gemba',
        'top-action-5s'
    ];
    sections.forEach(section => {
        fetch('form.html')
            .then(response => response.text())
            .then(html => {
                const sectionHtml = html.replace(/id="([^"]+)"/g, (match, id) => `id="${section}-${id}"`);
                document.getElementById(section).innerHTML = sectionHtml.replace(/{{section}}/g, section);
                const submitButton = document.querySelector(`#${section} .submit-btn[data-section="${section}"]`);
                if (submitButton) {
                    submitButton.addEventListener('click', () => submitForm(section));
                }
            })
            .catch(err => console.error(`Failed to load form.html for ${section}:`, err));
    });

    // Login button
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }

    // Sidebar navigation
    const sectionButtons = document.querySelectorAll('.section-btn');
    sectionButtons.forEach(button => {
        button.addEventListener('click', () => showSection(button.dataset.section));
    });

    // Filter button
    const filterButton = document.getElementById('apply-filters-button');
    if (filterButton) {
        filterButton.addEventListener('click', applyFilters);
    }

    // Export button
    const exportButton = document.getElementById('export-excel-button');
    if (exportButton) {
        exportButton.addEventListener('click', exportExcel);
    }

    // Modal close button
    const closeModalButton = document.getElementById('close-modal-button');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

    // Archive table buttons (view/delete)
    const archiveTableBody = document.getElementById('archive-table-body');
    if (archiveTableBody) {
        archiveTableBody.addEventListener('click', (event) => {
            const target = event.target;
            if (target.classList.contains('view-btn')) {
                const index = target.dataset.index;
                if (index) viewSubmission(parseInt(index));
            } else if (target.classList.contains('delete-btn')) {
                const index = target.dataset.index;
                if (index) deleteSubmission(parseInt(index));
            }
        });
    }
});

// Attach fallback for SheetJS (loaded dynamically if CDN fails)
const sheetJSScript = document.querySelector('script[src*="xlsx.full.min.js"]');
if (sheetJSScript) {
    sheetJSScript.addEventListener('error', loadFallbackXLSX);
}
