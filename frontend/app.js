// ---- Config ----
var CONFIG = {
    apiUrl: 'https://api.testnet.hiro.so',
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'timetablechain',
    network: 'testnet',
    maxSlotDisplay: 20,
    repoUrl: 'https://github.com/laykesydeoke/timetablechain'
};
// ---- End Config ----

var API_URL = CONFIG.apiUrl;
var CONTRACT_ADDRESS = CONFIG.contractAddress;
var CONTRACT_NAME = CONFIG.contractName;
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

function parseClarinetUint(hexResult) {
    if (!hexResult || typeof hexResult !== 'string') { return 0; }
    // Clarity ok-uint is prefixed with 0x0100...
    var clean = hexResult.replace(/^0x/, '');
    if (clean.startsWith('0100')) {
        clean = clean.slice(4);
    }
    var parsed = parseInt(clean, 16);
    return isNaN(parsed) ? 0 : parsed;
}

function encodeUint(id) {
    if (typeof id !== 'number' || id < 0 || !isFinite(id)) {
        throw new Error('Invalid id for encoding: ' + id);
    }
    return '0x' + id.toString(16).padStart(32, '0');
}

function loadSlotCount() {
    callReadOnly('get-last-token-id', [])
        .then(function (data) {
            if (data && data.okay && data.result) {
                var count = parseClarinetUint(data.result);
                if (count > 0) {
                    loadSlotsFromChain(count);
                } else {
                    renderSampleSlots();
                }
            } else {
                showError('No slots found on chain. Showing sample data.');
                renderSampleSlots();
            }
        })
        .catch(function (err) {
            showError('Failed to load slot count: ' + (err && err.message ? err.message : 'network error'));
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
