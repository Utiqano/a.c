// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyARc68C9RvqPHedrAtxJcZCUeZIEfn1XnA",
    authDomain: "dashbord-10e83.firebaseapp.com",
    projectId: "dashbord-10e83",
    storageBucket: "dashbord-10e83.firebasestorage.app",
    messagingSenderId: "1060154426951",
    appId: "1:1060154426951:web:121e08b5f1ec5323f49362",
    measurementId: "G-97L4PN4Q0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let chartInstances = {};

// Handle authentication state
onAuthStateChanged(auth, user => {
    console.log('Auth state:', user ? `User ${user.uid} (${user.email})` : 'No user');
    if (user) {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        showSection('dashboard-section');
    } else {
        document.getElementById('login-container').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

window.handleLogin = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('error');

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            error.classList.add('hidden');
        })
        .catch(err => {
            error.textContent = err.message;
            error.classList.remove('hidden');
        });
};

window.handleLogout = function() {
    signOut(auth)
        .catch(err => {
            alert('Error logging out: ' + err.message);
        });
};

window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
};

window.showSection = function(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    document.querySelectorAll('.sidebar button').forEach(button => {
        button.classList.remove('bg-indigo-600');
        button.classList.add('bg-gray-700');
    });
    const activeButton = document.querySelector(`button[onclick="showSection('${sectionId}')"]`);
    activeButton.classList.remove('bg-gray-700');
    activeButton.classList.add('bg-indigo-600');

    if (sectionId === 'dashboard-section') {
        applyFilters();
    } else if (sectionId === 'archive-section') {
        updateArchiveTable();
    }
};

window.submitForm = async function(sectionName, inputIds) {
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to submit data.');
            document.getElementById('login-container').classList.remove('hidden');
            document.getElementById('dashboard').classList.add('hidden');
            return;
        }
        const formData = { 
            section: sectionName, 
            timestamp: new Date().toISOString(),
            userId: user.uid 
        };
        inputIds.forEach(id => {
            const value = document.getElementById(id).value;
            formData[id] = value === null || value === undefined ? '' : String(value).replace(/[^\x20-\x7E]/g, '');
        });

        console.log('Submitting formData:', formData);
        await addDoc(collection(db, 'submissions'), formData);
        alert(`${sectionName} submitted successfully`);

        document.querySelectorAll(`#${sectionName.toLowerCase().replace(/\s+/g, '-')}-section input, #${sectionName.toLowerCase().replace(/\s+/g, '-')}-section textarea, #${sectionName.toLowerCase().replace(/\s+/g, '-')}-section select`).forEach(input => {
            input.value = '';
        });

        applyFilters();
        if (!document.getElementById('archive-section').classList.contains('hidden')) {
            updateArchiveTable();
        }
    } catch (err) {
        console.error('Submit error:', err);
        alert('Error submitting form: ' + err.message);
    }
};

function getBarColor(value) {
    if (value >= 85) return 'rgba(75, 192, 192, 0.8)';
    if (value >= 75) return 'rgba(255, 159, 64, 0.8)';
    return 'rgba(255, 99, 132, 0.8)';
}

window.applyFilters = async function() {
    const filterUAP = document.getElementById('filter-uap').value.toLowerCase();
    const filterWeek = document.getElementById('filter-week').value;
    const filterDate = document.getElementById('filter-date').value;
    const filterLine = document.getElementById('filter-line').value;

    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to view data.');
            return;
        }
        const q = query(collection(db, 'submissions'), where('userId', '==', user.uid));
        const submissions = [];

        console.log('Applying filters:', { filterUAP, filterWeek, filterDate, filterLine });

        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            let matchesUAP = true;
            let matchesWeek = true;
            let matchesDate = true;
            let matchesLine = true;

            if (filterUAP) {
                matchesUAP = (data['audit-5s-uap'] || data['audit-gemba-uap'] || data['emplissage-uap'] || '').toLowerCase().includes(filterUAP);
            }
            if (filterWeek) {
                matchesWeek = (
                    data['audit-5s-week'] === filterWeek ||
                    data['audit-gemba-week'] === filterWeek ||
                    data['absenteisme-week'] === filterWeek ||
                    data['realisation-gemba-week'] === filterWeek ||
                    data['realisation-5s-week'] === filterWeek ||
                    data['emplissage-week'] === filterWeek
                );
            }
            if (filterDate) {
                matchesDate = (
                    data['audit-5s-date'] === filterDate ||
                    data['audit-gemba-date'] === filterDate ||
                    data['absenteisme-date'] === filterDate ||
                    data['emplissage-date'] === filterDate
                );
            }
            if (filterLine) {
                matchesLine = (
                    data['audit-5s-line'] === filterLine ||
                    data['audit-gemba-line'] === filterLine ||
                    data['emplissage-line'] === filterLine
                );
            }

            if (matchesUAP && matchesWeek && matchesDate && matchesLine) {
                submissions.push(data);
            }
        });

        console.log('Filtered submissions:', submissions);
        if (submissions.length === 0) {
            alert('No data matches the selected filters.');
        }

        updateCharts(submissions);
        updateActionTables(submissions);
    } catch (err) {
        console.error('Filter error:', err);
        alert('Error fetching submissions: ' + err.message);
    }
};

function updateCharts(submissions) {
    const chartConfigs = [
        {
            id: 'chart-audit-5s',
            label: 'Audit 5S Result (%)',
            data: submissions
                .filter(s => s.section === 'Audit 5S')
                .map(s => ({
                    x: s['audit-5s-week'] || s.timestamp,
                    y: parseFloat(s['audit-5s-result']) || 0,
                    submission: s
                })),
            key: 'audit-5s-result'
        },
        {
            id: 'chart-audit-gemba',
            label: 'Audit Gemba Result (%)',
            data: submissions
                .filter(s => s.section === 'Audit Gemba')
                .map(s => ({
                    x: s['audit-gemba-week'] || s.timestamp,
                    y: parseFloat(s['audit-gemba-result']) || 0,
                    submission: s
                })),
            key: 'audit-gemba-result'
        },
        {
            id: 'chart-emplissage-tableau',
            label: 'Emplissage Tableau Pourcentage (%)',
            data: submissions
                .filter(s => s.section === 'Emplissage Tableau de Bord')
                .map(s => ({
                    x: s['emplissage-week'] || s.timestamp,
                    y: parseFloat(s['emplissage-percentage']) || 0,
                    submission: s
                })),
            key: 'emplissage-percentage'
        },
        {
            id: 'chart-taux-absenteisme',
            label: 'Taux Absenteisme Status (%)',
            data: submissions
                .filter(s => s.section === 'Taux Absenteisme')
                .map(s => ({
                    x: s['absenteisme-week'] || s.timestamp,
                    y: parseInt(s['absenteisme-status']) === 1 ? 100 : 0,
                    submission: s
                })),
            key: 'absenteisme-status'
        },
        {
            id: 'chart-taux-realisation-gemba',
            label: 'Taux Realisation Gemba (%)',
            data: submissions
                .filter(s => s.section === 'Taux Realisation Gemba')
                .map(s => ({
                    x: s['realisation-gemba-week'] || s.timestamp,
                    y: Math.min((parseFloat(s['realisation-gemba-realised']) / parseFloat(s['realisation-gemba-audits']) * 100) || 0, 100),
                    submission: s
                })),
            key: 'realisation-gemba'
        },
        {
            id: 'chart-taux-realisation-5s',
            label: 'Taux Realisation 5S (%)',
            data: submissions
                .filter(s => s.section === 'Taux Realisation 5S')
                .map(s => ({
                    x: s['realisation-5s-week'] || s.timestamp,
                    y: Math.min((parseFloat(s['realisation-5s-realised']) / parseFloat(s['realisation-5s-audits']) * 100) || 0, 100),
                    submission: s
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
                                const data = context.dataset.customData[context.dataIndex].submission;
                                const lines = [`${context.dataset.label}: ${context.raw.toFixed(2)}%`];
                                
                                // Include all non-empty fields from the submission
                                Object.entries(data).forEach(([key, value]) => {
                                    if (value && value !== '' && key !== 'userId' && key !== 'id') {
                                        // Format key for readability (e.g., 'audit-5s-result' -> 'Result')
                                        const formattedKey = key.replace(/^(audit-5s-|audit-gemba-|emplissage-|absenteisme-|realisation-gemba-|realisation-5s-|top-gemba-|top-5s-)/, '')
                                            .replace(/-/g, ' ')
                                            .replace(/\b\w/g, c => c.toUpperCase());
                                        lines.push(`${formattedKey}: ${value}`);
                                    }
                                });
                                
                                return lines;
                            }
                        }
                    }
                }
            }
        });
    });
}

function updateActionTables(submissions) {
    const gembaTbody = document.getElementById('top-action-gemba-table');
    const fiveSTbody = document.getElementById('top-action-5s-table');
    gembaTbody.innerHTML = '';
    fiveSTbody.innerHTML = '';

    const gembaSubmissions = submissions.filter(s => s.section === 'Top Action Gemba');
    const fiveSSubmissions = submissions.filter(s => s.section === 'Top Action 5S');

    gembaSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        row.className = 'odd:bg-gray-50 hover:bg-gray-100';
        row.innerHTML = `
            <td class="p-3 text-gray-800">${new Date(submission.timestamp).toLocaleString()}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-line'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-action1'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-action2'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-action3'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-action4'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-gemba-action5'] || '-'}</td>
        `;
        gembaTbody.appendChild(row);
    });

    fiveSSubmissions.forEach(submission => {
        const row = document.createElement('tr');
        row.className = 'odd:bg-gray-50 hover:bg-gray-100';
        row.innerHTML = `
            <td class="p-3 text-gray-800">${new Date(submission.timestamp).toLocaleString()}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-line'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-action1'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-action2'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-action3'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-action4'] || '-'}</td>
            <td class="p-3 text-gray-800">${submission['top-5s-action5'] || '-'}</td>
        `;
        fiveSTbody.appendChild(row);
    });
}

window.updateArchiveTable = async function() {
    const tbody = document.getElementById('archive-table-body');
    tbody.innerHTML = '';
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Please log in to view archive.');
            return;
        }
        const q = query(collection(db, 'submissions'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            const submission = { id: doc.id, ...doc.data() };
            const row = document.createElement('tr');
            row.className = 'odd:bg-gray-50 hover:bg-gray-100';
            const keyData = Object.entries(submission)
                .filter(([key, value]) => key !== 'id' && key !== 'userId' && key !== 'section' && key !== 'timestamp' && value && value !== '')
                .map(([key, value]) => `${key.replace(/^(audit-5s-|audit-gemba-|emplissage-|absenteisme-|realisation-gemba-|realisation-5s-|top-gemba-|top-5s-)/, '')}: ${value}`)
                .join(', ');
            row.innerHTML = `
                <td class="p-3 text-gray-800">${submission.section}</td>
                <td class="p-3 text-gray-800">${new Date(submission.timestamp).toLocaleString()}</td>
                <td class="p-3 text-gray-800">${keyData || '-'}</td>
                <td class="p-3 text-gray-800">${submission['audit-5s-uap'] || submission['audit-gemba-uap'] || submission['emplissage-uap'] || '-'}</td>
                <td class="p-3 text-gray-800">${submission['audit-5s-week'] || submission['audit-gemba-week'] || submission['absenteisme-week'] || submission['realisation-gemba-week'] || submission['realisation-5s-week'] || submission['emplissage-week'] || '-'}</td>
                <td class="p-3 text-gray-800">${submission['audit-5s-date'] || submission['audit-gemba-date'] || submission['absenteisme-date'] || submission['emplissage-date'] || '-'}</td>
                <td class="p-3 text-gray-800">${submission['audit-5s-line'] || submission['audit-gemba-line'] || submission['emplissage-line'] || submission['top-gemba-line'] || submission['top-5s-line'] || '-'}</td>
                <td class="p-3"><button onclick="showDetails('${submission.id}')" class="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Details</button></td>
            `;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error('Archive error:', err);
        alert('Error fetching archive: ' + err.message);
    }
};

window.showDetails = async function(docId) {
    try {
        const docRef = doc(db, 'submissions', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            const modalDetails = document.getElementById('modal-details');
            modalDetails.textContent = JSON.stringify(data, null, 2);
            document.getElementById('details-modal').classList.remove('hidden');
            document.getElementById('details-modal').querySelector('.transform').classList.remove('translate-y-full');
            document.getElementById('details-modal').querySelector('.transform').classList.add('translate-y-0');
        } else {
            alert('No such document!');
        }
    } catch (err) {
        console.error('Details error:', err);
        alert('Error fetching details: ' + err.message);
    }
};

window.closeModal = function() {
    const modal = document.getElementById('details-modal');
    modal.querySelector('.transform').classList.remove('translate-y-0');
    modal.querySelector('.transform').classList.add('translate-y-full');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};