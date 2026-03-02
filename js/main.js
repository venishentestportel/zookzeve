// Remove firebase firestore imports, keep config for auth if needed later

// DOM Elements
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');
const openSidebarBtn = document.getElementById('open-sidebar');
const closeSidebarBtn = document.getElementById('close-sidebar');

// Sidebar Dynamic Elements
const supportNumberEl = document.getElementById('support-number');
const whatsappSupportBtn = document.getElementById('whatsapp-support');
const branchesListEl = document.getElementById('branches-list');
const featuresListEl = document.getElementById('features-list');
const plansContainer = document.getElementById('plans-container');
const searchPlanInput = document.getElementById('search-plan');

// Tariff Calculator Elements
const calcKw = document.getElementById('calc-kw');
const calcHours = document.getElementById('calc-hours');
const calcMins = document.getElementById('calc-mins');
const currentRateEl = document.getElementById('current-rate');
const calcTotal = document.getElementById('calc-total');

// Modals
const tariffModal = document.getElementById('tariff-modal');
const openTariffBtn = document.getElementById('open-tariff-modal');
const closeTariffBtn = document.getElementById('close-tariff-modal');

// State
let allPlans = [];
let currentActivePlanId = null;

// Sidebar Toggles
function toggleSidebar() {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('hidden');
}

openSidebarBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);
overlay.addEventListener('click', toggleSidebar);

// Tariff Calculation Logic - Time of Use (ToU)
const STORAGE_KEY_TARIFFS = 'zookzevc_tariffs';

function isHourInRange(hour, start, end) {
    if (start <= end) {
        return hour >= start && hour < end;
    } else {
        // Overnight, e.g., 22 to 6
        return hour >= start || hour < end;
    }
}

function getCurrentRate() {
    const currentHour = new Date().getHours();

    // Load dynamic tariffs or use defaults
    let t = {
        offPeak: { start: 22, end: 6, rate: 12 },
        standard: { start: 6, end: 16, rate: 18 },
        peak: { start: 16, end: 22, rate: 24 }
    };

    try {
        const stored = localStorage.getItem(STORAGE_KEY_TARIFFS);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.offPeak && parsed.standard && parsed.peak) {
                t = parsed;
            }
        }
    } catch (e) { console.error("Error parsing tariffs", e); }

    // Determine ToU based on current hour
    if (isHourInRange(currentHour, t.offPeak.start, t.offPeak.end)) {
        return { name: 'Off-Peak', rate: t.offPeak.rate, color: '#10b981' }; // Green
    } else if (isHourInRange(currentHour, t.peak.start, t.peak.end)) {
        return { name: 'Peak', rate: t.peak.rate, color: '#ef4444' }; // Red
    } else {
        // Fallback or Standard
        return { name: 'Standard', rate: t.standard.rate, color: '#f59e0b' }; // Yellow
    }
}

function calculateTariff() {
    const powerKw = parseFloat(calcKw.value) || 0;
    const hours = parseFloat(calcHours.value) || 0;
    const mins = parseFloat(calcMins.value) || 0;

    const totalTimeHours = hours + (mins / 60);
    const touData = getCurrentRate();

    const energyKwh = powerKw * totalTimeHours;
    const totalCost = energyKwh * touData.rate;

    // Update UI
    currentRateEl.innerHTML = `₹${touData.rate}/kWh <span style="font-size: 0.8rem; color: ${touData.color}; margin-left: 4px;">(${touData.name})</span>`;
    calcTotal.textContent = `₹${totalCost.toFixed(2)}`;

    // Update live clock
    const timeDisplay = document.getElementById('current-time-display');
    if (timeDisplay) {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeDisplay.textContent = `${h}:${m} ${ampm}`;
    }
}

calcKw.addEventListener('input', calculateTariff);
calcHours.addEventListener('input', calculateTariff);
calcMins.addEventListener('input', calculateTariff);

// Update rate every minute to catch hour rollovers while modal is open
setInterval(calculateTariff, 60000);

// Initial calculation is now handled by the async init() function

// Tariff Modal Toggles
if (openTariffBtn) {
    openTariffBtn.addEventListener('click', () => {
        tariffModal.classList.remove('hidden');
    });
}
if (closeTariffBtn) {
    closeTariffBtn.addEventListener('click', () => {
        tariffModal.classList.add('hidden');
    });
}

/* --- Local Storage Data Fetching --- */

const STORAGE_KEY_PLANS = 'zookzevc_plans';
const STORAGE_KEY_SETTINGS = 'zookzevc_settings';

function fetchDynamicData() {
    try {
        // 1. Fetch Sidebar Static Settings
        const settingsData = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (settingsData) {
            const data = JSON.parse(settingsData);
            supportNumberEl.innerHTML = `<i class="fa-solid fa-phone"></i> Support: ${data.supportPhone || 'N/A'}`;

            if (data.whatsappUrl) {
                whatsappSupportBtn.href = data.whatsappUrl;
            } else {
                whatsappSupportBtn.style.display = 'none';
            }

            // Features
            if (featuresListEl) {
                featuresListEl.innerHTML = '';
                const features = data.features || [];
                if (features.length === 0) {
                    featuresListEl.innerHTML = '<li><i class="fa-solid fa-info-circle"></i> No specific features listed</li>';
                } else {
                    features.forEach(feat => {
                        featuresListEl.innerHTML += `<li><i class="fa-solid fa-check" style="color: var(--primary-color);"></i> ${feat}</li>`;
                    });
                }
            }

            // Branches
            branchesListEl.innerHTML = '';
            const branches = data.branches || [];
            if (branches.length === 0) {
                branchesListEl.innerHTML = '<li>No other branches found</li>';
            } else {
                branches.forEach(branch => {
                    const bName = typeof branch === 'string' ? branch : branch.name;
                    const bLink = typeof branch === 'string' ? '' : branch.link;

                    if (bLink) {
                        branchesListEl.innerHTML += `
                        <li style="display: flex; justify-content: space-between; align-items: center;">
                            <span><i class="fa-solid fa-code-branch"></i> ${bName}</span>
                            <a href="${bLink}" target="_blank" class="auth-btn btn-success" style="padding: 0.25rem 0.5rem; width: auto; font-size: 0.8rem; margin: 0; text-decoration: none;"><i class="fa-solid fa-map-location-dot"></i> Map</a>
                        </li>`;
                    } else {
                        branchesListEl.innerHTML += `<li><i class="fa-solid fa-code-branch"></i> ${bName}</li>`;
                    }
                });
            }
        } else {
            supportNumberEl.innerHTML = `<i class="fa-solid fa-phone"></i> Support: N/A`;
            branchesListEl.innerHTML = '<li>No other branches configured</li>';
            if (featuresListEl) featuresListEl.innerHTML = '<li>No specific features listed</li>';
        }

        // 2. Fetch Charging Plans
        allPlans = appData.plans || [];
        renderPlans(allPlans);

    } catch (error) {
        console.error("Error fetching local data:", error);
        plansContainer.innerHTML = '<p style="color:red; grid-column: 1/-1; text-align: center;">Error loading localized data.</p>';
        supportNumberEl.innerHTML = `<i class="fa-solid fa-phone"></i> Error loading`;
        branchesListEl.innerHTML = '<li>Error loading branches</li>';
    }
}

function renderPlans(plansToRender) {
    plansContainer.innerHTML = '';

    if (plansToRender.length === 0) {
        plansContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; background: var(--white); border-radius: var(--radius-sm); border: 1px dashed #ccc;">No plans available. Add them in the Admin panel.</p>';
        return;
    }

    // Sort by price ascending
    plansToRender.sort((a, b) => a.price - b.price);

    plansToRender.forEach((plan) => {
        const card = document.createElement('div');
        card.className = 'plan-card';
        if (plan.recommended) {
            card.classList.add('recommended');
        }

        card.innerHTML = `
            ${plan.recommended ? '<div class="rec-badge"><i class="fa-solid fa-star"></i> Recommended</div>' : ''}
            <div class="plan-header">
                <h4 class="plan-title">${plan.title}</h4>
            </div>
            <div class="plan-price">₹${plan.price} <span>${plan.unit || 'per kWh'}</span></div>
            <ul class="plan-features">
                ${(plan.features || []).map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
            </ul>
            <button class="pay-btn" data-plan-id="${plan.id}">Select & Pay</button>
        `;
        plansContainer.appendChild(card);
    });

    // Attach listener for payment
    document.querySelectorAll('.pay-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentActivePlanId = e.target.getAttribute('data-plan-id');
            const btnEl = e.target;

            // Fast-track mock payment sequence
            const originalText = btnEl.innerHTML;
            btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            btnEl.disabled = true;

            setTimeout(() => {
                alert(`Direct Payment initiated for plan #${currentActivePlanId}!\nRedirecting to secure gateway...`);
                btnEl.innerHTML = originalText;
                btnEl.disabled = false;
            }, 800);
        });
    });
}

// Search Functionality
searchPlanInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allPlans.filter(plan =>
        plan.title.toLowerCase().includes(query) ||
        (plan.features && plan.features.some(f => f.toLowerCase().includes(query)))
    );
    renderPlans(filtered);
});

async function init() {
    // Load dynamic data on start
    await fetchDynamicData();

    // Tariff calculation dependencies
    tariffRates = await getDynamicTariffs();

    // Fallback if no prices exist in system
    if (!tariffRates) {
        tariffRates = {
            offPeak: { start: 22, end: 6, rate: 12 },
            standard: { start: 6, end: 16, rate: 18 },
            peak: { start: 16, end: 22, rate: 24 }
        };
    }

    updateTariffUI();
    calculateTariff();
}

async function getDynamicTariffs() {
    try {
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            if (data.tariffs) {
                return data.tariffs;
            }
        }
    } catch (e) {
        console.warn("Failed fetching tariffs from backend, falling back to defaults.", e);
    }
    return null;
}

init();
