let sectionsLoaded = 0;
const totalSections = 8;

function loadFallbackXLSX() {
    console.warn('Primary SheetJS CDN failed, trying local fallback...');
    const localScript = document.createElement('script');
    localScript.src = 'xlsx.full.min.js';
    localScript.onerror = () => {
        console.error('Local SheetJS fallback failed. Ensure xlsx.full.min.js (version 0.20.3) is in the same directory.');
        alert('Failed to load SheetJS library. Please download xlsx.full.min.js (version 0.20.3) from https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3/package/dist/xlsx.full.min.js.');
    };
    document.head.appendChild(localScript);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing sections...');
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
        const sectionElement = document.getElementById(section);
        if (!sectionElement) {
            console.error(`Section container not found in index.html: ${section}`);
            return;
        }
        fetch('form.html')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch form.html`);
                return response.text();
            })
            .then(html => {
                console.log(`Loading form.html for section: ${section}`);
                const sectionHtml = html.replace(/id="([^"]+)"/g, (match, id) => `id="${section}-${id}"`);
                sectionElement.innerHTML = sectionHtml.replace(/{{section}}/g, section);
                const submitButton = document.querySelector(`#${section} .submit-btn[data-section="${section}"]`);
                if (submitButton) {
                    submitButton.addEventListener('click', () => {
                        console.log(`Submit button clicked for section: ${section}`);
                        submitForm(section);
                    });
                } else {
                    console.error(`Submit button not found for section: ${section}`);
                }
                sectionsLoaded++;
                console.log(`Sections loaded: ${sectionsLoaded}/${totalSections}`);
                if (sectionsLoaded === totalSections) {
                    console.log('All sections loaded');
                    updateCharts();
                    updateArchiveTable();
                    if (window.pendingLogin) {
                        showSection('dashboard-section');
                        window.pendingLogin = false;
                    }
                }
            })
            .catch(err => {
                console.error(`Failed to load form.html for ${section}:`, err);
                sectionElement.innerHTML = `<p>Error loading form for ${section}. Please ensure form.html exists.</p>`;
            });
    });

    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log('Login button clicked');
            handleLogin();
        });
    } else {
        console.error('Login button not found');
    }

    const sectionButtons = document.querySelectorAll('.section-btn');
    sectionButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log(`Section button clicked: ${button.dataset.section}`);
            showSection(button.dataset.section);
        });
    });

    const filterButton = document.getElementById('apply-filters-button');
    if (filterButton) {
        filterButton.addEventListener('click', () => {
            console.log('Apply filters button clicked');
            applyFilters();
        });
    }

    const exportButton = document.getElementById('export-excel-button');
    if (exportButton) {
        exportButton.addEventListener('click', () => {
            console.log('Export button clicked');
            exportExcel();
        });
    }

    const closeModalButton = document.getElementById('close-modal-button');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }

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

    // Initial chart and table update
    updateCharts();
    updateArchiveTable();
});

const sheetJSScript = document.querySelector('script[src*="xlsx.full.min.js"]');
if (sheetJSScript) {
    sheetJSScript.addEventListener('error', loadFallbackXLSX);
}
