let submissions = [];
let chartInstances = {};

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    document.querySelectorAll('.sidebar button').forEach(button => {
        button.classList.remove('active');
    });
    document.querySelector(`button[onclick="showSection('${sectionId}')"]`).classList.add('active');

    if (sectionId === 'dashboard-section') {
        applyFilters();
    } else if (sectionId === 'archive-section') {
        updateArchiveTable();
    }
}

function submitForm(sectionId) {
    const sectionName = sectionId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const inputIds = {
        'Audit 5S': ['audit-5s-date', 'audit-5s-week', 'audit-5s-line', 'audit-5s-uap', 'audit-5s-result'],
        'Audit Gemba': ['audit-gemba-date', 'audit-gemba-week', 'audit-gemba-line', 'audit-gemba-uap', 'audit-gemba-result'],
        'Emplissage Tableau': ['emplissage-uap', 'emplissage-percentage', 'emplissage-commentaire'],
        'Taux Absenteisme': ['absenteisme-date', 'absenteisme-name', 'absenteisme-week', 'absenteisme-status'],
        'Taux Realisation Gemba': ['realisation-gemba-audits', 'realisation-gemba-week', 'realisation-gemba-realised'],
        'Taux Realisation 5S': ['realisation-5s-audits', 'realisation-5s-week', 'realisation-5s-realised'],
        'Top Action Gemba': ['top-gemba-line', 'top-gemba-action1', 'top-gemba-action2', 'top-gemba-action3', 'top-gemba-action4', 'top-gemba-action5'],
        'Top Action 5S': ['top-5s-line', 'top-5s-action1', 'top-5s-action2', 'top-5s-action3', 'top-5s-action4', 'top-5s-action5']
    }[sectionName];

    const formData = { section: sectionName, timestamp: new Date().toISOString() };
    inputIds.forEach(id => {
        const element = document.getElementById(`${sectionId}-${id}`);
        const value = element ? element.value : '';
        formData[id] = value === null || value === undefined ? '' : String(value).replace(/[^\x20-\x7E]/g, '');
    });
    submissions.push(formData);
    alert(`${sectionName} submitted: ${JSON.stringify(formData)}`);
    document.querySelectorAll(`#${sectionId} input, #${sectionId} textarea, #${sectionId} select`).forEach(input => {
        input.value = '';
    });
    applyFilters();
    if (!document.getElementById('archive-section').classList.contains('hidden')) {
        updateArchiveTable();
    }
}

function getBarColor(value) {
    if (value >= 85) return 'rgba(75, 192, 192, 0.8)';
    if (value >= 75) return 'rgba(255, 159, 64, 0.8)';
    return 'rgba(255, 99, 132, 0.8)';
}

function applyFilters() {
    const filterUAP = document.getElementById('dashboard-filter-uap').value.toLowerCase();
    const filterWeek = document.getElementById('filter-week').value;
    const filterDate = document.getElementById('filter-date').value;

    const filteredSubmissions = submissions.filter(s => {
        let matchesUAP = true;
        let matchesWeek = true;
        let matchesDate = true;

        if (filterUAP) {
            matchesUAP = (s['audit-5s-uap'] || s['audit-gemba-uap'] || s['emplissage-uap'] || '').toLowerCase().includes(filterUAP);
        }
        if (filterWeek) {
            matchesWeek = (
                s['audit-5s-week'] === filterWeek ||
                s['audit-gemba-week'] === filterWeek ||
                s['absenteisme-week'] === filterWeek ||
                s['realisation-gemba-week'] === filterWeek ||
                s['realisation-5s-week'] === filterWeek
            );
        }
        if (filterDate) {
            matchesDate = (
                s['audit-5s-date'] || s['audit-gemba-date'] || s['absenteisme-date'] || '-'
            ) === filterDate;
        }

        return matchesUAP && matchesWeek && matchesDate;
    });

    updateCharts(filteredSubmissions);
    updateActionTables(filteredSubmissions);
}

function updateCharts(filteredSubmissions = submissions) {
    const chartConfigs = [
        {
            id: 'chart-audit-5s',
            label: 'Audit 5S Result (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Audit 5S')
                .map(s => ({
                    x: s['audit-5s-week'] || s.timestamp,
                    y: parseFloat(s['audit-5s-result']) || 0,
                    line: s['audit-5s-line'] || '-',
                    date: s['audit-5s-date'] || '-',
                    uap: s['audit-5s-uap'] || '-'
                })),
            key: 'audit-5s-result'
        },
        {
            id: 'chart-audit-gemba',
            label: 'Audit Gemba Result (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Audit Gemba')
                .map(s => ({
                    x: s['audit-gemba-week'] || s.timestamp,
                    y: parseFloat(s['audit-gemba-result']) || 0,
                    line: s['audit-gemba-line'] || '-',
                    date: s['audit-gemba-date'] || '-',
                    uap: s['audit-gemba-uap'] || '-'
                })),
            key: 'audit-gemba-result'
        },
        {
            id: 'chart-emplissage-tableau',
            label: 'Emplissage Tableau Pourcentage (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Emplissage Tableau')
                .map(s => ({
                    x: s.timestamp,
                    y: parseFloat(s['emplissage-percentage']) || 0,
                    uap: s['emplissage-uap'] || '-',
                    commentaire: s['emplissage-commentaire'] || '-',
                    timestamp: new Date(s.timestamp).toLocaleString()
                })),
            key: 'emplissage-percentage'
        },
        {
            id: 'chart-taux-absenteisme',
            label: 'Taux Absenteisme Status (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Taux Absenteisme')
                .map(s => ({
                    x: s['absenteisme-week'] || s.timestamp,
                    y: parseInt(s['absenteisme-status']) === 1 ? 100 : 0,
                    date: s['absenteisme-date'] || '-',
                    name: s['absenteisme-name'] || '-',
                    week: s['absenteisme-week'] || '-',
                    status: s['absenteisme-status'] === '1' ? 'Present' : 'Absent'
                })),
            key: 'absenteisme-status'
        },
        {
            id: 'chart-taux-realisation-gemba',
            label: 'Taux Realisation Gemba (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Taux Realisation Gemba')
                .map(s => ({
                    x: s['realisation-gemba-week'] || s.timestamp,
                    y: Math.min((parseFloat(s['realisation-gemba-realised']) / parseFloat(s['realisation-gemba-audits']) * 100) || 0, 100),
                    week: s['realisation-gemba-week'] || '-',
                    audits: s['realisation-gemba-audits'] || '-',
                    realised: s['realisation-gemba-realised'] || '-'
                })),
            key: 'realisation-gemba'
        },
        {
            id: 'chart-taux-realisation-5s',
            label: 'Taux Realisation 5S (%)',
            data: filteredSubmissions
                .filter(s => s.section === 'Taux Realisation 5S')
                .map(s => ({
                    x: s['realisation-5s-week'] || s.timestamp,
                    y: Math.min((parseFloat(s['realisation-5s-realised']) / parseFloat(s['realisation-5s-audits']) * 100) || 0, 100),
                    week: s['realisation-5s-week'] || '-',
                    audits: s['realisation-5s-audits'] || '-',
                    realised: s['realisation-5s-realised'] || '-'
                })),
            key: 'realisation-5s'
        }
    ];

    chartConfigs.forEach(config => {
        const ctx = document.getElementById(config.id).getContext('2d');
        if (chartInstances[config.id]) {
            chartInstances[config.id].destroy();
        }

        const backgroundColors = config.data.map(data => getBarColor(data.y));

        chartInstances[config.id] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: config.data.map(d => d.x),
                datasets: [{
                    label: config.label,
                    data: config.data.map(d => d.y),
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(color => color.replace('0.8', '1')),
                    borderWidth: 1,
                    customData: config.data
                }]
            },
            options: {
                scales: {
                    x: {
                        title: { display: true, text: 'Week or Timestamp' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Percentage (%)' }
                    }
                },
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const data = context.dataset.customData[context.dataIndex];
                                if (context.dataset.label.includes('Audit 5S') || context.dataset.label.includes('Audit Gemba')) {
                                    return [
                                        `${context.dataset.label}: ${context.raw.toFixed(2)}%`,
                                        `Line: ${data.line}`,
                                        `Date: ${data.date}`,
                                        `Week: ${data.x}`,
                                        `UAP: ${data.uap}`
                                    ];
                                } else if (context.dataset.label.includes('Emplissage')) {
                                    return [
                                        `${context.dataset.label}: ${context.raw.toFixed(2)}%`,
                                        `UAP: ${data.uap}`,
                                        `Commentaire: ${data.commentaire}`,
                                        `Timestamp: ${data.timestamp}`
                                    ];
                                } else if (context.dataset.label.includes('Absenteisme')) {
                                    return [
                                        `${context.dataset.label}: ${context.raw.toFixed(2)}%`,
                                        `Date: ${data.date}`,
                                        `Name: ${data.name}`,
                                        `Week: ${data.week}`,
                                        `Status: ${data.status}`
                                    ];
                                } else if (context.dataset.label.includes('Realisation Gemba') || context.dataset.label.includes('Realisation 5S')) {
                                    return [
                                        `${context.dataset.label}: ${context.raw.toFixed(2)}%`,
                                        `Week: ${data.week}`,
                                        `Audits: ${data.audits}`,
                                        `Realised: ${data.realised}`
                                    ];
                                }
                                return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }
                }
            }
        });
    });
}

function updateActionTables(filteredSubmissions = submissions) {
    const gembaTbody = document.getElementById('top-action-gemba-table');
    const fiveSTbody = document.getElementById('top-action-5s-table');
    gembaTbody.innerHTML = '';
    fiveSTbody.innerHTML = '';

    const gembaSubmissions = filteredSubmissions.filter(s => s.section === 'Top Action Gemba');
    const fiveSSubmissions = filteredSubmissions.filter(s => s.section === 'Top Action 5S');

    gembaSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(submission.timestamp).toLocaleString()}</td>
            <td>${submission['top-gemba-line'] || '-'}</td>
            <td>${submission['top-gemba-action1'] || '-'}</td>
            <td>${submission['top-gemba-action2'] || '-'}</td>
            <td>${submission['top-gemba-action3'] || '-'}</td>
            <td>${submission['top-gemba-action4'] || '-'}</td>
            <td>${submission['top-gemba-action5'] || '-'}</td>
        `;
        gembaTbody.appendChild(row);
    });

    fiveSSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(submission.timestamp).toLocaleString()}</td>
            <td>${submission['top-5s-line'] || '-'}</td>
            <td>${submission['top-5s-action1'] || '-'}</td>
            <td>${submission['top-5s-action2'] || '-'}</td>
            <td>${submission['top-5s-action3'] || '-'}</td>
            <td>${submission['top-5s-action4'] || '-'}</td>
            <td>${submission['top-5s-action5'] || '-'}</td>
        `;
        fiveSTbody.appendChild(row);
    });
}

function updateArchiveTable() {
    const tbody = document.getElementById('archive-table-body');
    tbody.innerHTML = '';
    submissions.forEach((submission, index) => {
        const row = document.createElement('tr');
        const keyData = getKeyData(submission);
        row.innerHTML = `
            <td>${submission.section}</td>
            <td>${new Date(submission.timestamp).toLocaleString()}</td>
            <td>${keyData}</td>
            <td>${submission['audit-5s-uap'] || submission['audit-gemba-uap'] || submission['emplissage-uap'] || '-'}</td>
            <td>${submission['audit-5s-week'] || submission['audit-gemba-week'] || submission['absenteisme-week'] || submission['realisation-gemba-week'] || submission['realisation-5s-week'] || '-'}</td>
            <td>${submission['audit-5s-date'] || submission['audit-gemba-date'] || submission['absenteisme-date'] || '-'}</td>
            <td>
                <button class="view-btn" onclick="viewSubmission(${index})">View</button>
                <button class="delete-btn" onclick="deleteSubmission(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getKeyData(submission) {
    switch (submission.section) {
        case 'Audit 5S':
            return `${submission['audit-5s-result']}%`;
        case 'Audit Gemba':
            return `${submission['audit-gemba-result']}%`;
        case 'Emplissage Tableau':
            return `${submission['emplissage-percentage']}%`;
        case 'Taux Absenteisme':
            return submission['absenteisme-status'] === '1' ? 'Present' : 'Absent';
        case 'Taux Realisation Gemba':
            return `${((parseFloat(submission['realisation-gemba-realised']) / parseFloat(submission['realisation-gemba-audits']) * 100) || 0).toFixed(2)}%`;
        case 'Taux Realisation 5S':
            return `${((parseFloat(submission['realisation-5s-realised']) / parseFloat(submission['realisation-5s-audits']) * 100) || 0).toFixed(2)}%`;
        case 'Top Action Gemba':
            return `${([submission['top-gemba-action1'], submission['top-gemba-action2'], submission['top-gemba-action3'], submission['top-gemba-action4'], submission['top-gemba-action5']].filter(a => a).length / 5 * 100).toFixed(2)}%`;
        case 'Top Action 5S':
            return `${([submission['top-5s-action1'], submission['top-5s-action2'], submission['top-5s-action3'], submission['top-5s-action4'], submission['top-5s-action5']].filter(a => a).length / 5 * 100).toFixed(2)}%`;
        default:
            return '-';
    }
}

function viewSubmission(index) {
    const submission = submissions[index];
    document.getElementById('modal-details').textContent = JSON.stringify(submission, null, 2);
    document.getElementById('details-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('details-modal').style.display = 'none';
}

function deleteSubmission(index) {
    if (confirm('Are you sure you want to delete this submission?')) {
        submissions.splice(index, 1);
        updateArchiveTable();
        applyFilters();
    }
}

function exportExcel() {
    try {
        if (!navigator.onLine) {
            console.error('No internet connection detected');
            alert('No internet connection. Please connect to the internet or ensure xlsx.full.min.js (version 0.21.0) is in the same directory as index.html. Download it from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js if missing.');
            return;
        }
        if (typeof XLSX === 'undefined') {
            console.error('SheetJS library not loaded');
            alert('SheetJS library failed to load. Please download xlsx.full.min.js (version 0.21.0) from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js, place it in the same directory as index.html, check your internet connection, or disable ad-blockers.');
            return;
        }
        if (typeof saveAs === 'undefined') {
            console.error('FileSaver.js not loaded');
            alert('FileSaver.js library failed to load. Please check your internet connection or disable ad-blockers and try again.');
            return;
        }

        const workbook = XLSX.utils.book_new();
        console.log('Browser:', navigator.userAgent, 'Online:', navigator.onLine, 'Submissions count:', submissions.length);

        const sectionMappings = {
            'Audit 5S': {
                fields: ['Date', 'Week', 'Line', 'UAP', 'Result'],
                fieldKeys: ['audit-5s-date', 'audit-5s-week', 'audit-5s-line', 'audit-5s-uap', 'audit-5s-result']
            },
            'Audit Gemba': {
                fields: ['Date', 'Week', 'Line', 'UAP', 'Result'],
                fieldKeys: ['audit-gemba-date', 'audit-gemba-week', 'audit-gemba-line', 'audit-gemba-uap', 'audit-gemba-result']
            },
            'Emplissage Tableau': {
                fields: ['UAP', 'Percentage', 'Commentaire'],
                fieldKeys: ['emplissage-uap', 'emplissage-percentage', 'emplissage-commentaire']
            },
            'Taux Absenteisme': {
                fields: ['Date', 'Name', 'Week', 'Status'],
                fieldKeys: ['absenteisme-date', 'absenteisme-name', 'absenteisme-week', 'absenteisme-status']
            },
            'Taux Realisation Gemba': {
                fields: ['Audits', 'Week', 'Realised'],
                fieldKeys: ['realisation-gemba-audits', 'realisation-gemba-week', 'realisation-gemba-realised']
            },
            'Taux Realisation 5S': {
                fields: ['Audits', 'Week', 'Realised'],
                fieldKeys: ['realisation-5s-audits', 'realisation-5s-week', 'realisation-5s-realised']
            },
            'Top Action Gemba': {
                fields: ['Line', 'Action1', 'Action2', 'Action3', 'Action4', 'Action5'],
                fieldKeys: ['top-gemba-line', 'top-gemba-action1', 'top-gemba-action2', 'top-gemba-action3', 'top-gemba-action4', 'top-gemba-action5']
            },
            'Top Action 5S': {
                fields: ['Line', 'Action1', 'Action2', 'Action3', 'Action4', 'Action5'],
                fieldKeys: ['top-5s-line', 'top-5s-action1', 'top-5s-action2', 'top-5s-action3', 'top-5s-action4', 'top-5s-action5']
            }
        };

        let hasData = false;
        for (const section in sectionMappings) {
            const mapping = sectionMappings[section];
            const sectionData = submissions
                .filter(s => s.section === section)
                .map(s => {
                    const row = { Timestamp: new Date(s.timestamp).toLocaleString() };
                    mapping.fields.forEach((field, index) => {
                        const value = s[mapping.fieldKeys[index]];
                        row[field] = value === null || value === undefined ? '' : String(value).replace(/[^\x20-\x7E]/g, '');
                    });
                    return row;
                });

            if (sectionData.length > 0) {
                try {
                    const worksheet = XLSX.utils.json_to_sheet(sectionData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, section);
                    hasData = true;
                } catch (wsError) {
                    console.error(`Error creating worksheet for ${section}:`, wsError);
                    alert(`Failed to create worksheet for ${section}: ${wsError.message}`);
                }
            }
        }

        if (hasData) {
            try {
                const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
                const blob = new Blob([wbout], { type: 'application/octet-stream' });
                saveAs(blob, 'crre_dashboard.xlsx');
            } catch (writeError) {
                console.error('Error writing Excel file:', writeError, 'Browser:', navigator.userAgent);
                alert('Failed to write Excel file: ' + writeError.message + '. Trying CSV fallback...');
                try {
                    const csvData = submissions.map(s => {
                        const row = [s.section, new Date(s.timestamp).toLocaleString()];
                        const mapping = sectionMappings[s.section];
                        if (mapping) {
                            mapping.fieldKeys.forEach(key => {
                                row.push(String(s[key] || '').replace(/[^\x20-\x7E]/g, ''));
                            });
                        }
                        return row.join(',');
                    }).join('\n');
                    const csvHeader = 'Section,Timestamp,' + Object.values(sectionMappings).map(m => m.fields.join(',')).join(',');
                    const csvBlob = new Blob([csvHeader + '\n' + csvData], { type: 'text/csv' });
                    saveAs(csvBlob, 'crre_dashboard.csv');
                    alert('Exported as CSV due to Excel failure.');
                } catch (csvError) {
                    console.error('CSV fallback failed:', csvError);
                    alert('CSV export failed: ' + csvError.message + '. Please download xlsx.full.min.js (version 0.21.0) from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js, place it in the same directory as index.html, check your internet connection, or try a different browser (e.g., Chrome, Firefox).');
                }
            }
        } else {
            alert('No data available to export.');
        }
    } catch (error) {
        console.error('Export error:', error, 'Browser:', navigator.userAgent, 'Online:', navigator.onLine);
        alert('An error occurred while exporting: ' + error.message + '. Please download xlsx.full.min.js (version 0.21.0) from https://unpkg.com/xlsx@0.21.0/dist/xlsx.full.min.js, place it in the same directory as index.html, check your internet connection, disable ad-blockers, or try a different browser (e.g., Chrome, Firefox).');
    }
}