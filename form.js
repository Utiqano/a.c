function showSection(section) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(s => s.classList.add('hidden'));
    const activeSection = document.getElementById(section);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    } else {
        console.error(`Section not found: ${section}`);
        return;
    }
    const buttons = document.querySelectorAll('.section-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`.section-btn[data-section="${section}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    } else {
        console.error(`Button for section not found: ${section}`);
    }
}

function submitForm(section) {
    const formData = {};
    const inputs = document.querySelectorAll(`#${section} .form-group[data-section="${section}"] input, #${section} .form-group[data-section="${section}"] select, #${section} .form-group[data-section="${section}"] textarea`);
    inputs.forEach(input => {
        formData[input.id.replace(`${section}-`, '')] = input.value;
    });
    formData.section = section;
    formData.timestamp = new Date().toISOString();
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    submissions.push(formData);
    localStorage.setItem('submissions', JSON.stringify(submissions));
    alert('Form submitted: ' + JSON.stringify(formData, null, 2));
    inputs.forEach(input => input.value = '');
    updateCharts();
    updateArchiveTable();
}

function exportExcel() {
    if (typeof XLSX === 'undefined') {
        console.error('SheetJS not loaded');
        alert('Export failed: SheetJS library not loaded');
        return;
    }
    console.log('XLSX version', XLSX.version);
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const ws = XLSX.utils.json_to_sheet(submissions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Archive');
    try {
        XLSX.writeFile(wb, 'crre_dashboard.xlsx');
    } catch (e) {
        console.error('Excel export failed:', e);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        saveAs(blob, 'crre_dashboard.csv');
    }
}

function updateArchiveTable() {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const tableBody = document.getElementById('archive-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    submissions.forEach((submission, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${submission.section}</td>
            <td>${submission.timestamp}</td>
            <td>${submission.result || submission.percentage || submission.status || submission['realised'] || submission.line || '-'}</td>
            <td>${submission.uap || '-'}</td>
            <td>${submission.week || '-'}</td>
            <td>${submission.date || '-'}</td>
            <td>
                <button class="view-btn" data-index="${index}">View</button>
                <button class="delete-btn" data-index="${index}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function viewSubmission(index) {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const submission = submissions[index];
    if (submission) {
        const modal = document.getElementById('details-modal');
        const modalDetails = document.getElementById('modal-details');
        if (modal && modalDetails) {
            modalDetails.textContent = JSON.stringify(submission, null, 2);
            modal.classList.remove('hidden');
        }
    }
}

function deleteSubmission(index) {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    submissions.splice(index, 1);
    localStorage.setItem('submissions', JSON.stringify(submissions));
    updateArchiveTable();
    updateCharts();
}

function updateCharts() {
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const charts = {
        'chart-audit-5s': { section: 'audit-5s', key: 'result', type: 'bar' },
        'chart-audit-gemba': { section: 'audit-gemba', key: 'result', type: 'bar' },
        'chart-emplissage-tableau': { section: 'emplissage-tableau', key: 'percentage', type: 'bar' },
        'chart-taux-absenteisme': { section: 'taux-absenteisme', key: 'status', type: 'bar' },
        'chart-taux-realisation-gemba': { section: 'taux-realisation-gemba', key: 'realised', type: 'bar' },
        'chart-taux-realisation-5s': { section: 'taux-realisation-5s', key: 'realised', type: 'bar' }
    };

    Object.keys(charts).forEach(chartId => {
        const { section, key, type } = charts[chartId];
        const canvas = document.getElementById(chartId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const data = submissions
            .filter(s => s.section === section)
            .map(s => ({
                label: s.line || s.name || s.week || s.date,
                value: parseFloat(s[key]) || 0,
                date: s.date,
                uap: s.uap
            }));

        const labels = data.map(d => d.label || 'Unknown');
        const values = data.map(d => d.value);
        const backgroundColors = values.map(v => v >= 85 ? '#4caf50' : v >= 75 ? '#ff9800' : '#f44336');

        if (window[chartId]) {
            window[chartId].destroy();
        }

        window[chartId] = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: section.replace(/-/g, ' ').toUpperCase(),
                    data: values,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true, max: section.includes('realisation') ? undefined : 100 }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const index = context.dataIndex;
                                const item = data[index];
                                return [
                                    `${context.dataset.label}: ${context.raw}`,
                                    `Date: ${item.date || 'N/A'}`,
                                    `UAP: ${item.uap || 'N/A'}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    });
}

function applyFilters() {
    const uap = document.getElementById('dashboard-filter-uap').value;
    const week = document.getElementById('filter-week').value;
    const date = document.getElementById('filter-date').value;
    const submissions = JSON.parse(localStorage.getItem('submissions') || '[]');
    const filtered = submissions.filter(s => {
        return (!uap || s.uap === uap) &&
               (!week || s.week == week) &&
               (!date || s.date === date);
    });
    localStorage.setItem('submissions', JSON.stringify(filtered));
    updateCharts();
    updateArchiveTable();
}
