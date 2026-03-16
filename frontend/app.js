var API_URL = 'https://api.testnet.hiro.so';
var CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
var CONTRACT_NAME = 'timetablechain';
var userAddress = null;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('connectWallet').addEventListener('click', handleWalletClick);
    loadSlotCount();
    checkExistingSession();
});

function checkExistingSession() {
    try {
        var session = localStorage.getItem('blockstack-session');
        if (session) {
            var parsed = JSON.parse(session);
            if (parsed && parsed.userData) {
                var addr = parsed.userData.profile &&
                    parsed.userData.profile.stxAddress &&
                    parsed.userData.profile.stxAddress.testnet;
                if (addr) {
                    userAddress = addr;
                    onConnected(addr);
                }
            }
        }
    } catch (e) {
        // No session
    }
}

function handleWalletClick() {
    var btn = document.getElementById('connectWallet');
    if (userAddress) {
        localStorage.removeItem('blockstack-session');
        userAddress = null;
        btn.textContent = 'Connect Wallet';
        btn.classList.remove('connected');
        document.getElementById('walletStatus').textContent = '';
        return;
    }
    connectWallet();
}

function connectWallet() {
    if (typeof window.StacksProvider === 'undefined') {
        window.open('https://wallet.hiro.so/', '_blank');
        return;
    }

    var appConfig = {
        appDetails: {
            name: 'TimeChain Marketplace',
            icon: window.location.origin + '/favicon.svg'
        },
        onFinish: function (data) {
            if (data && data.userSession) {
                var userData = data.userSession.loadUserData();
                userAddress = userData.profile.stxAddress.testnet;
                onConnected(userAddress);
            }
        },
        onCancel: function () {
            console.log('Wallet connection cancelled');
        }
    };

    if (window.showConnect) {
        window.showConnect(appConfig);
    } else {
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/@stacks/connect@7/dist/index.umd.js';
        script.onload = function () {
            if (window.StacksConnect && window.StacksConnect.showConnect) {
                window.StacksConnect.showConnect(appConfig);
            }
        };
        document.head.appendChild(script);
    }
}

function onConnected(address) {
    var btn = document.getElementById('connectWallet');
    btn.textContent = address.slice(0, 6) + '...' + address.slice(-4);
    btn.classList.add('connected');
    document.getElementById('walletStatus').textContent = 'Connected';
    loadSlots();
}

function loadSlotCount() {
    callReadOnly('get-last-token-id', [])
        .then(function (data) {
            if (data && data.okay && data.result) {
                var count = parseInt(data.result.replace('0x01', ''), 16) || 0;
                if (count > 0) {
                    loadSlotsFromChain(count);
                } else {
                    renderSampleSlots();
                }
            } else {
                renderSampleSlots();
            }
        })
        .catch(function () {
            renderSampleSlots();
        });
}

function loadSlots() {
    loadSlotCount();
}

function loadSlotsFromChain(count) {
    var grid = document.getElementById('slotsGrid');
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    var loaded = 0;
    for (var i = 1; i <= Math.min(count, 20); i++) {
        (function (id) {
            callReadOnly('get-slot-details', ['0x01' + id.toString(16).padStart(32, '0')])
                .then(function (data) {
                    loaded++;
                    if (data && data.okay && data.result) {
                        appendSlotCard(grid, id, data.result);
                    }
                    if (loaded >= Math.min(count, 20) && grid.children.length === 0) {
                        renderSampleSlots();
                    }
                })
                .catch(function () {
                    loaded++;
                });
        })(i);
    }
}

function appendSlotCard(grid, id, slotData) {
    var card = document.createElement('div');
    card.className = 'slot-card';

    var title = document.createElement('h4');
    title.textContent = 'Slot #' + id;
    card.appendChild(title);

    var subject = document.createElement('p');
    subject.className = 'meta';
    subject.textContent = slotData.subject || 'Unknown Subject';
    card.appendChild(subject);

    if (slotData.grade) {
        var grade = document.createElement('p');
        grade.className = 'meta';
        grade.textContent = 'Grade ' + slotData.grade;
        card.appendChild(grade);
    }

    if (slotData['room-id']) {
        var room = document.createElement('p');
        room.className = 'meta';
        room.textContent = 'Room ' + slotData['room-id'];
        card.appendChild(room);
    }

    grid.appendChild(card);
}

function renderSampleSlots() {
    var grid = document.getElementById('slotsGrid');
    while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
    }

    var slots = [
        { id: 1, subject: 'Mathematics', grade: 10, room: 101, time: 'Morning' },
        { id: 2, subject: 'Physics', grade: 11, room: 205, time: 'Afternoon' },
        { id: 3, subject: 'English', grade: 9, room: 103, time: 'Morning' }
    ];

    slots.forEach(function (slot) {
        var card = document.createElement('div');
        card.className = 'slot-card';

        var title = document.createElement('h4');
        title.textContent = slot.subject;
        card.appendChild(title);

        var grade = document.createElement('p');
        grade.className = 'meta';
        grade.textContent = 'Grade ' + slot.grade;
        card.appendChild(grade);

        var room = document.createElement('p');
        room.className = 'meta';
        room.textContent = 'Room ' + slot.room;
        card.appendChild(room);

        var timeEl = document.createElement('p');
        timeEl.className = 'meta';
        timeEl.textContent = slot.time + ' Session';
        card.appendChild(timeEl);

        grid.appendChild(card);
    });
}

function callReadOnly(fnName, args) {
    var url = API_URL + '/v2/contracts/call-read/' +
        CONTRACT_ADDRESS + '/' + CONTRACT_NAME + '/' + fnName;
    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sender: CONTRACT_ADDRESS,
            arguments: args || []
        })
    }).then(function (res) { return res.json(); });
}

function loadSlotAnalytics() {
    callReadOnly('timetablechain', 'get-slot-analytics', []).then(function (data) {
        var totalSlots = document.getElementById('analyticsTotalSlots');
        var totalTransfers = document.getElementById('analyticsTotalTransfers');
        if (data && data.result) {
            if (totalSlots) totalSlots.textContent = data.result['total-slots'] || '0';
            if (totalTransfers) totalTransfers.textContent = data.result['total-transfers'] || '0';
        }
    }).catch(function () {});
}

function loadGovernanceParams() {
    callReadOnly('timetablechain', 'get-governance-params', []).then(function (data) {
        var maxSlots = document.getElementById('govMaxSlots');
        var govActions = document.getElementById('govActionCount');
        if (data && data.result) {
            if (maxSlots) maxSlots.textContent = data.result['max-slots-per-teacher'] || '--';
            if (govActions) govActions.textContent = data.result['governance-actions'] || '0';
        }
    }).catch(function () {});
}

function loadProtocolReport() {
    callReadOnly('timetablechain', 'get-protocol-report', []).then(function (data) {
        var snapCount = document.getElementById('reportSnapshotCount');
        var reportBlock = document.getElementById('reportBlock');
        if (data && data.result) {
            if (snapCount) snapCount.textContent = data.result['snapshot-count'] || '0';
            if (reportBlock) reportBlock.textContent = data.result['report-block'] || '--';
        }
    }).catch(function () {});
}

function loadTeacherTier(address) {
    if (!address) return;
    callReadOnly('timetablechain', 'get-teacher-tier', ['0x0516' + address], []).then(function (data) {
        var tierEl = document.getElementById('teacherTier');
        var bonusEl = document.getElementById('teacherBonus');
        if (tierEl && data && data.result) {
            var tierMap = { 1: 'Bronze', 2: 'Silver', 3: 'Gold' };
            var tierNum = parseInt(data.result, 16) || 1;
            tierEl.textContent = tierMap[tierNum] || 'Bronze';
        }
    }).catch(function () {});
}

function loadMarketplaceMetrics() {
    Promise.all([
        callReadOnly('timetablechain', 'get-marketplace-metrics', []),
        callReadOnly('timetablechain', 'get-market-summary', [])
    ]).then(function(results) {
        var activeSlots = document.getElementById('marketActiveSlots');
        var marketStatus = document.getElementById('marketStatus');
        var m = results[0] && results[0].result ? results[0].result : {};
        var s = results[1] && results[1].result ? results[1].result : {};
        if (activeSlots) activeSlots.textContent = m['active-slots'] || '0';
        if (marketStatus) marketStatus.textContent = s['is-paused'] ? 'Paused' : 'Active';
    }).catch(function(){});
}

function loadPauseState() {
    callReadOnly('timetablechain', 'get-pause-state', []).then(function (data) {
        var status = document.getElementById('pauseStatus');
        var pauseCount = document.getElementById('pauseCount');
        if (data && data.result) {
            var isPaused = data.result['is-paused'];
            if (status) { status.textContent = isPaused ? 'PAUSED' : 'Active'; status.style.color = isPaused ? '#ef4444' : '#10b981'; }
            if (pauseCount) pauseCount.textContent = data.result['pause-count'] || '0';
        }
    }).catch(function () {});
}

function loadPerformanceStats() {
    Promise.all([
        callReadOnly('timetablechain', 'get-performance-stats', []),
        callReadOnly('timetablechain', 'get-protocol-uptime', [])
    ]).then(function(results) {
        var txCount = document.getElementById('perfTxCount');
        var uptime = document.getElementById('perfUptime');
        var stats = results[0] && results[0].result ? results[0].result : {};
        if (txCount) txCount.textContent = stats['total-tx'] || '0';
        if (uptime && results[1] && results[1].result) uptime.textContent = parseInt(results[1].result, 16) + ' blocks';
    }).catch(function(){});
}

// Access control
async function loadAccessSummary() {
  const result = await callReadOnly('get-access-summary', []);
  if (result) {
    document.getElementById('access-summary').textContent = JSON.stringify(result);
  }
}

// Slot validation
async function loadValidationParams() {
  const result = await callReadOnly('get-validation-params', []);
  if (result) {
    document.getElementById('validation-params').textContent = JSON.stringify(result);
  }
}

async function loadPricingParams() {
  const r = await callReadOnly("timetablechain", "get-pricing-params", []);
  if (r) document.getElementById("pricing-data").textContent = JSON.stringify(r);
}

async function load_profile() {
  const r = await callReadOnly("timetablechain", "get-profile-stats", []);
  if (r) document.getElementById("profile-out").textContent = JSON.stringify(r);
}

async function load_template() {
  const r = await callReadOnly("timetablechain", "get-template-stats", []);
  if (r) document.getElementById("template-out").textContent = JSON.stringify(r);
}

async function load_exhist() {
  const r = await callReadOnly("timetablechain", "get-exchange-history-params", []);
  if (r) document.getElementById("exhist-out").textContent = JSON.stringify(r);
}

async function load_categ() { const r = await callReadOnly("timetablechain", "get-category-stats", []); if (r) document.getElementById("categ-out").textContent = JSON.stringify(r); }

async function load_rating() { const r = await callReadOnly("timetablechain", "get-rating-params", []); if (r) document.getElementById("rating-out").textContent = JSON.stringify(r); }
