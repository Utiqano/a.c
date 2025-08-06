let sectionsLoaded = 0;
const totalSections = 8; // audit-5s, audit-gemba, emplissage-tableau, taux-absenteisme, etc.

function loadFallbackXLSX() {
    console.warn('Primary SheetJS CDN failed, trying local fallback...');
    const localScript = document.createElement('script');
    localScript.src = 'xlsx.full.min.js';
    localScript.onerror = () => {
        console.error('Local SheetJS fallback failed...');
        alert('Failed to load SheetJS library...');
    };
    document.head.appendChild(localScript);
}

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
                const sectionElement = document.getElementById(section);
                if (sectionElement) {
                    sectionElement.innerHTML = sectionHtml.replace(/{{section}}/g, section);
                    const submitButton = document.querySelector(`#${section} .submit-btn[data-section="${section}"]`);
                    if (submitButton) {
                        submitButton.addEventListener('click', () => submitForm(section));
                    }
                    sectionsLoaded++;
                    if (sectionsLoaded === totalSections && window.pendingLogin) {
                        showSection('dashboard-section');
                    }
                } else {
                    console.error(`Section container not found: ${section}`);
                }
            })
            .catch(err => console.error(`Failed to load form.html for ${section}:`, err));
    });

    // Login button
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            handleLogin();
        });
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

    // Archive table buttons
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

// Attach fallback for SheetJS
const sheetJSScript = document.querySelector('script[src*="xlsx.full.min.js"]');
if (sheetJSScript) {
    sheetJSScript.addEventListener('error', loadFallbackXLSX);
}
