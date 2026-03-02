// Admin Authentication Logic
const loginOverlay = document.getElementById('admin-login-overlay');
const usernameInput = document.getElementById('admin-username');
const passwordInput = document.getElementById('admin-password');
const btnLogin = document.getElementById('btn-admin-login');
const loginMsg = document.getElementById('admin-login-msg');

function checkAuth() {
    if (sessionStorage.getItem('zookz_admin_auth') === 'true') {
        loginOverlay.classList.add('hidden');
    } else {
        loginOverlay.classList.remove('hidden');
    }
}

if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();
        if (user === 'admin' && pass === 'admin123') {
            sessionStorage.setItem('zookz_admin_auth', 'true');
            loginOverlay.classList.add('hidden');
        } else {
            loginMsg.textContent = 'Invalid credentials';
        }
    });
}

const togglePasswordBtn = document.getElementById('toggle-password');
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePasswordBtn.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });
}

// Check on load
checkAuth();

// Tab Navigation logic
const menuLinks = document.querySelectorAll('.admin-menu a');
const sections = document.querySelectorAll('.admin-section');

menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class
        menuLinks.forEach(l => l.classList.remove('active'));
        sections.forEach(s => s.classList.add('hidden'));

        // Add active class to clicked
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');
    });
});

/* --- Global App State (Backend Sync) --- */
window.appData = {
    plans: [],
    settings: {},
    tariffs: {
        offPeak: { start: 22, end: 6, rate: 12 },
        standard: { start: 6, end: 16, rate: 18 },
        peak: { start: 16, end: 22, rate: 24 }
    }
};

async function fetchServerData() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            // Merge received data to handle missing fields
            window.appData.plans = data.plans || [];
            window.appData.settings = data.settings || {};
            window.appData.tariffs = data.tariffs || window.appData.tariffs;
        }
    } catch (error) {
        console.error("Failed to fetch data from backend", error);
    }
}

async function saveServerData() {
    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.appData)
        });
    } catch (error) {
        console.error("Failed to push data to backend", error);
    }
}

/* --- Storage Helpers (Redirected to Global State) --- */
function getStoredPlans() {
    return window.appData.plans;
}

function savePlans(plans) {
    window.appData.plans = plans;
    saveServerData();
}

function getStoredSettings() {
    return window.appData.settings;
}

function saveSettings(settings) {
    window.appData.settings = settings;
    saveServerData();
}

function getStoredTariffs() {
    return window.appData.tariffs;
}

function saveTariffs(tariffs) {
    window.appData.tariffs = tariffs;
    saveServerData();
}

/* --- Tariff Management --- */
const offpeakStart = document.getElementById('offpeak-start');
const offpeakEnd = document.getElementById('offpeak-end');
const offpeakRate = document.getElementById('offpeak-rate');

const standardStart = document.getElementById('standard-start');
const standardEnd = document.getElementById('standard-end');
const standardRate = document.getElementById('standard-rate');

const peakStart = document.getElementById('peak-start');
const peakEnd = document.getElementById('peak-end');
const peakRate = document.getElementById('peak-rate');

const btnSaveTariffs = document.getElementById('btn-save-tariffs');
const tariffMsg = document.getElementById('tariff-msg');

function populateTimeSelects() {
    const selects = document.querySelectorAll('.time-select');
    if (!selects.length) return;

    let html = '';
    for (let i = 0; i < 24; i++) {
        let hour = i % 12 || 12;
        let ampm = i < 12 ? 'AM' : 'PM';
        let formattedStr = `${hour}:00 ${ampm} (${i.toString().padStart(2, '0')}:00)`;
        html += `<option value="${i}">${formattedStr}</option>`;
    }

    selects.forEach(select => {
        select.innerHTML = html;
    });
}

function loadTariffsToUI() {
    const t = getStoredTariffs();
    if (t && offpeakStart) {
        offpeakStart.value = t.offPeak.start;
        offpeakEnd.value = t.offPeak.end;
        offpeakRate.value = t.offPeak.rate;

        standardStart.value = t.standard.start;
        standardEnd.value = t.standard.end;
        standardRate.value = t.standard.rate;

        peakStart.value = t.peak.start;
        peakEnd.value = t.peak.end;
        peakRate.value = t.peak.rate;
    }
}

if (btnSaveTariffs) {
    btnSaveTariffs.addEventListener('click', () => {
        const tariffs = {
            offPeak: {
                start: parseInt(offpeakStart.value) || 0,
                end: parseInt(offpeakEnd.value) || 0,
                rate: parseFloat(offpeakRate.value) || 0
            },
            standard: {
                start: parseInt(standardStart.value) || 0,
                end: parseInt(standardEnd.value) || 0,
                rate: parseFloat(standardRate.value) || 0
            },
            peak: {
                start: parseInt(peakStart.value) || 0,
                end: parseInt(peakEnd.value) || 0,
                rate: parseFloat(peakRate.value) || 0
            }
        };
        saveTariffs(tariffs);
        tariffMsg.textContent = "Tariff settings saved successfully!";
        tariffMsg.classList.add('success');
        setTimeout(() => { tariffMsg.textContent = ""; tariffMsg.classList.remove('success'); }, 3000);
    });
}

// Initialize tariff UI
populateTimeSelects();

/* --- Plans Management --- */
const titleInput = document.getElementById('plan-title');
const priceInput = document.getElementById('plan-price');
const featuresInput = document.getElementById('plan-features');
const btnAddPlan = document.getElementById('btn-add-plan');
const planMsg = document.getElementById('plan-msg');
const adminPlansList = document.getElementById('admin-plans-list');

// Add Plan
btnAddPlan.addEventListener('click', () => {
    const title = titleInput.value.trim();
    const price = parseFloat(priceInput.value);
    const featuresStr = featuresInput.value.trim();

    if (!title || isNaN(price) || !featuresStr) {
        planMsg.textContent = "Please fill all fields correctly.";
        return;
    }

    // Convert comma separated string to array
    const features = featuresStr.split(',').map(f => f.trim()).filter(f => f);

    const newPlan = {
        id: 'plan_' + Date.now(),
        title: title,
        price: price,
        unit: 'per kWh',
        features: features,
        createdAt: new Date().toISOString()
    };

    const plans = getStoredPlans();
    plans.push(newPlan);
    savePlans(plans);

    planMsg.className = "auth-msg success";
    planMsg.textContent = "Plan added to local storage!";

    // Clear forms
    titleInput.value = '';
    priceInput.value = '';
    featuresInput.value = '';

    setTimeout(() => { planMsg.textContent = ''; }, 3000);
    loadPlans(); // Reload list
});

// Load Plans
function loadPlans() {
    const plans = getStoredPlans();
    adminPlansList.innerHTML = ''; // Clear

    if (plans.length === 0) {
        adminPlansList.innerHTML = '<p class="text-muted">No plans found. Add one above.</p>';
        return;
    }

    plans.forEach((plan) => {
        const isRec = plan.recommended ? 'color: #fbbf24;' : 'color: #64748b;';
        const div = document.createElement('div');
        div.className = 'plan-item';
        div.innerHTML = `
            <div>
                <strong>${plan.title}</strong> - ₹${plan.price} ${plan.unit}
                <div style="font-size: 0.85rem; color: #666;">Features: ${plan.features.join(', ')}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="icon-btn toggle-rec-btn" data-id="${plan.id}" title="Mark as Recommended" style="${isRec} font-size: 1.25rem;"><i class="fa-solid fa-star"></i></button>
                <button class="btn-danger delete-plan-btn" data-id="${plan.id}">Delete</button>
            </div>
        `;
        adminPlansList.appendChild(div);
    });

    // Attach delete listeners
    document.querySelectorAll('.delete-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idToDelete = e.target.getAttribute('data-id');
            if (confirm("Are you sure you want to delete this plan?")) {
                let currentPlans = getStoredPlans();
                currentPlans = currentPlans.filter(p => p.id !== idToDelete);
                savePlans(currentPlans);
                loadPlans(); // Reload
            }
        });
    });

    // Attach recommend listeners
    document.querySelectorAll('.toggle-rec-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find the closest button if they click the icon inside
            const button = e.target.closest('.toggle-rec-btn');
            const idToToggle = button.getAttribute('data-id');
            let currentPlans = getStoredPlans();

            // Toggle recommended stat
            currentPlans = currentPlans.map(p => {
                if (p.id === idToToggle) {
                    p.recommended = !p.recommended;
                } else {
                    // Only one plan can be recommended at a time
                    p.recommended = false;
                }
                return p;
            });

            savePlans(currentPlans);
            loadPlans(); // Reload to update star color
        });
    });
}

/* --- Sidebar Content Management --- */
const adminPhone = document.getElementById('admin-phone');
const adminWhatsapp = document.getElementById('admin-whatsapp');
const adminFeatures = document.getElementById('admin-features');
const branchesContainer = document.getElementById('branches-container');
const btnAddBranch = document.getElementById('btn-add-branch');
const btnSaveSidebar = document.getElementById('btn-save-sidebar');
const sidebarMsg = document.getElementById('sidebar-msg');

function createBranchRow(name = '', link = '') {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.className = 'branch-row';
    div.innerHTML = `
        <input type="text" class="modern-input branch-name" placeholder="Name (e.g. Kochi)" value="${name}" style="flex: 1; margin: 0;">
        <input type="url" class="modern-input branch-link" placeholder="Google Maps Link" value="${link}" style="flex: 2; margin: 0;">
        <button type="button" class="btn-danger rm-branch-btn" style="padding: 0 1rem;" title="Remove Branch"><i class="fa-solid fa-trash"></i></button>
    `;
    div.querySelector('.rm-branch-btn').addEventListener('click', () => div.remove());
    branchesContainer.appendChild(div);
}

// Load config
function loadSidebarConfig() {
    const data = getStoredSettings();
    adminPhone.value = data.supportPhone || '';
    adminWhatsapp.value = data.whatsappUrl || '';
    adminFeatures.value = (data.features || []).join(', ');

    branchesContainer.innerHTML = '';
    const branches = data.branches || [];
    branches.forEach(b => {
        if (typeof b === 'string') {
            createBranchRow(b, '');
        } else {
            createBranchRow(b.name, b.link);
        }
    });
}

if (btnAddBranch) {
    btnAddBranch.addEventListener('click', () => createBranchRow());
}

// Save config
btnSaveSidebar.addEventListener('click', () => {
    const featuresArray = adminFeatures.value.split(',').map(f => f.trim()).filter(f => f);
    const branchRows = branchesContainer.querySelectorAll('.branch-row');
    const branchesArray = [];

    branchRows.forEach(row => {
        const name = row.querySelector('.branch-name').value.trim();
        const link = row.querySelector('.branch-link').value.trim();
        if (name) {
            branchesArray.push({ name, link });
        }
    });

    const settings = {
        supportPhone: adminPhone.value.trim(),
        whatsappUrl: adminWhatsapp.value.trim(),
        features: featuresArray,
        branches: branchesArray,
        updatedAt: new Date().toISOString()
    };

    saveSettings(settings);

    sidebarMsg.className = "auth-msg success";
    sidebarMsg.textContent = "Sidebar settings saved locally!";

    setTimeout(() => { sidebarMsg.textContent = ''; }, 3000); // Clear after 3s
});

// Init sequence
async function initAdminPanel() {
    await fetchServerData();
    loadTariffsToUI();
    loadPlans();
    loadSidebarConfig();
}

initAdminPanel();
