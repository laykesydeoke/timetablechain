// ---- Config ----
var STACKS_API = {
    testnet: 'https://api.testnet.hiro.so',
    mainnet: 'https://api.hiro.so'
};

var CONFIG = {
    apiUrl: STACKS_API.testnet,
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'timetablechain',
    network: 'testnet',
    maxSlotDisplay: 20,
    repoUrl: 'https://github.com/laykesydeoke/timetablechain',
    txPollIntervalMs: 3000,
    txPollMaxAttempts: 20
};
// ---- End Config ----

var API_URL = CONFIG.apiUrl;
var CONTRACT_ADDRESS = CONFIG.contractAddress;
var CONTRACT_NAME = CONFIG.contractName;
var userAddress = null;
var currentBlockHeight = 0;

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('connectWallet').addEventListener('click', handleWalletClick);
    loadSlotCount();
    checkExistingSession();
    initNetworkStatusBar();
    getBlockHeight().then(function (h) {
        currentBlockHeight = h;
        updateBlockHeightDisplay(h);
    }).catch(function () {});
});

// ---- Network Status Bar ----
function initNetworkStatusBar() {
    var bar = document.getElementById('networkStatusBar');
    if (!bar) return;
    bar.textContent = 'Network: ' + CONFIG.network + ' | Block: loading...';
    setInterval(function () {
        getBlockHeight().then(function (h) {
            currentBlockHeight = h;
            updateBlockHeightDisplay(h);
        }).catch(function () {});
    }, 30000);
}

function updateBlockHeightDisplay(height) {
    var bar = document.getElementById('networkStatusBar');
    if (bar) {
        bar.textContent = 'Network: ' + CONFIG.network + ' | Block: #' + height;
    }
    var el = document.getElementById('currentBlockHeight');
    if (el) el.textContent = '#' + height;
}

// ---- Stacks API Helpers ----

/**
 * Call a read-only function on the timetablechain contract.
 * Uses /v2/contracts/call-read/ endpoint.
 */
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

/**
 * Get recent transactions for a given STX address.
 * Returns the raw JSON from the Stacks API.
 */
function getRecentTransactions(address) {
    var url = API_URL + '/extended/v1/address/' + address + '/transactions?limit=10';
    return fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(function (res) { return res.json(); });
}

/**
 * Get the current Stacks block height.
 * Returns a promise resolving to the block height as a number.
 */
function getBlockHeight() {
    var url = API_URL + '/v2/info';
    return fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(function (res) { return res.json(); })
      .then(function (data) {
          return data && data.stacks_tip_height ? data.stacks_tip_height : 0;
      });
}

/**
 * Poll for transaction confirmation.
 * Calls onConfirmed(txData) when confirmed, or onFailed(err) on timeout/failure.
 */
function pollTransactionConfirmation(txId, onConfirmed, onFailed) {
    var attempts = 0;
    var url = API_URL + '/extended/v1/tx/' + txId;

    function poll() {
        attempts++;
        if (attempts > CONFIG.txPollMaxAttempts) {
            if (onFailed) onFailed(new Error('Transaction confirmation timed out'));
            return;
        }
        fetch(url, { headers: { 'Content-Type': 'application/json' } })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data && data.tx_status === 'success') {
                    if (onConfirmed) onConfirmed(data);
                } else if (data && data.tx_status === 'abort_by_response') {
                    if (onFailed) onFailed(new Error('Transaction aborted: ' + (data.tx_result && data.tx_result.repr)));
                } else {
                    setTimeout(poll, CONFIG.txPollIntervalMs);
                }
            })
            .catch(function (err) {
                if (onFailed) onFailed(err);
            });
    }

    setTimeout(poll, CONFIG.txPollIntervalMs);
}

// ---- Wallet ----
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
        hideMySlotsSection();
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
    loadMySlots(address);
}

// ---- Slot Loading ----
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

    var limit = Math.min(count, CONFIG.maxSlotDisplay);
    var loaded = 0;

    for (var i = 1; i <= limit; i++) {
        (function (id) {
            var encoded;
            try {
                encoded = '0x01' + encodeUint(id).replace(/^0x/, '');
            } catch (e) {
                loaded++;
                return;
            }
            callReadOnly('get-slot-details', [encoded])
                .then(function (data) {
                    loaded++;
                    if (data && data.okay && data.result) {
                        appendSlotCard(grid, id, data.result);
                    } else if (data && !data.okay) {
                        showError('Error loading slot ' + id + ': ' + (data.cause || 'unknown'));
                    }
                    if (loaded >= limit && grid.children.length === 0) {
                        renderSampleSlots();
                    }
                })
                .catch(function (err) {
                    loaded++;
                    showError('Network error loading slot ' + id + ': ' + (err && err.message ? err.message : ''));
                });
        })(i);
    }
}

// ---- Slot Expiration Helpers ----

/**
 * Calculate blocks remaining until slot expires.
 * Returns a positive number if not expired, 0 or negative if expired.
 */
function blocksUntilExpiry(timeBlock) {
    if (!timeBlock || typeof timeBlock !== 'number') return -1;
    return timeBlock - currentBlockHeight;
}

/**
 * Format blocks remaining into a human-readable string.
 * Stacks produces ~1 block per 10 minutes.
 */
function formatTimeRemaining(blocksLeft) {
    if (blocksLeft <= 0) return 'EXPIRED';
    var minutes = blocksLeft * 10;
    if (minutes < 60) return blocksLeft + ' blocks (~' + minutes + 'm)';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return blocksLeft + ' blocks (~' + hours + 'h)';
    var days = Math.floor(hours / 24);
    return blocksLeft + ' blocks (~' + days + 'd)';
}

// ---- UI Error / Status ----
function showError(msg) {
    var errEl = document.getElementById('errorBanner');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'errorBanner';
        errEl.style.cssText = 'background:#fee;color:#c00;padding:8px 16px;border-radius:4px;margin:8px 0;font-size:0.9em;';
        var grid = document.getElementById('slotsGrid');
        if (grid && grid.parentNode) {
            grid.parentNode.insertBefore(errEl, grid);
        }
    }
    errEl.textContent = msg;
    errEl.style.display = 'block';
    setTimeout(function () { errEl.style.display = 'none'; }, 5000);
}

function showTxStatus(msg, isSuccess) {
    var el = document.getElementById('txStatus');
    if (!el) return;
    el.textContent = msg;
    el.className = 'tx-status tx-status--' + (isSuccess ? 'success' : 'pending');
    el.style.display = 'block';
    if (isSuccess) {
        setTimeout(function () { el.style.display = 'none'; }, 8000);
    }
}

// ---- Slot Card Rendering ----
function getSlotStatus(slotData) {
    if (!slotData['is-active']) { return 'inactive'; }
    var timeBlock = slotData['time-block'];
    if (timeBlock && typeof timeBlock === 'number') {
        if (currentBlockHeight > 0 && timeBlock <= currentBlockHeight) {
            return 'expired';
        }
    }
    return 'active';
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

    // Expiry display
    var timeBlock = slotData['time-block'];
    if (timeBlock && typeof timeBlock === 'number') {
        var blocksLeft = blocksUntilExpiry(timeBlock);
        var expiryEl = document.createElement('p');
        expiryEl.className = 'meta slot-expiry';
        if (blocksLeft <= 0) {
            expiryEl.textContent = 'EXPIRED (block ' + timeBlock + ')';
            expiryEl.style.color = '#c00';
            expiryEl.style.fontWeight = 'bold';
        } else {
            expiryEl.textContent = 'Expires: ' + formatTimeRemaining(blocksLeft);
        }
        card.appendChild(expiryEl);
    }

    var isActive = slotData['is-active'];
    var slotStatus = getSlotStatus(slotData);
    var status = document.createElement('span');
    status.className = 'slot-status slot-status--' + slotStatus;
    status.textContent = slotStatus === 'expired' ? 'Expired' : (isActive ? 'Active' : 'Inactive');
    card.appendChild(status);

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

// ---- My Slots Section ----

function loadMySlots(address) {
    var section = document.getElementById('mySlots');
    if (!section) return;
    section.style.display = 'block';

    var grid = document.getElementById('mySlotsGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="placeholder">Loading your slots...</p>';

    // Encode the principal address
    var encodedAddr = encodePrincipal(address);
    callReadOnly('get-teacher-slot-list', [encodedAddr])
        .then(function (data) {
            if (data && data.okay && data.result) {
                renderMySlots(grid, data.result, address);
            } else {
                grid.innerHTML = '<p class="placeholder">No slots found for your address.</p>';
            }
        })
        .catch(function (err) {
            grid.innerHTML = '<p class="placeholder">Error loading slots: ' + (err && err.message ? err.message : '') + '</p>';
        });
}

function hideMySlotsSection() {
    var section = document.getElementById('mySlots');
    if (section) section.style.display = 'none';
}

function encodePrincipal(address) {
    // Encode a Stacks principal as a hex argument for call-read
    // Standard principal: 0x05 + version byte + 20-byte hash160
    // For simplicity, pass as string using the Clarity hex encoding
    // The API accepts the address string directly in some implementations
    // We use the standard encoding: type prefix 0x05, then c32-decoded address
    return '0x' + addressToHex(address);
}

function addressToHex(address) {
    // c32check decode: version + 20-byte hash
    // For testnet STX addresses (ST prefix), version = 26 (0x1a)
    // For mainnet (SP prefix), version = 22 (0x16)
    // We encode as: 05 (StandardPrincipal type) + version + 20 bytes hash160
    // Since we can't easily do c32 decode in vanilla JS, we use the API's
    // address string format via the Hiro API's principal encoding
    // The /v2/contracts/call-read endpoint accepts hex-encoded Clarity values
    // For a principal, the Clarity wire format is:
    //   type byte: 0x05 (standard principal)
    //   version byte: 0x1a for testnet
    //   20 bytes: hash160 of the address

    // Attempt to use a simple lookup for common addresses, or fall back to
    // passing address as a UTF-8 string which some API implementations handle
    try {
        return '05' + c32ToHex(address);
    } catch (e) {
        // Fallback: encode as Clarity StringAscii if c32 not available
        var bytes = '';
        for (var i = 0; i < address.length; i++) {
            bytes += address.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return '0d' + address.length.toString(16).padStart(8, '0') + bytes;
    }
}

function c32ToHex(address) {
    // Simplified c32check decode for Stacks testnet addresses
    // Returns version byte + 20-byte hash as hex
    var C32_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    // Remove prefix (ST or SP) and decode
    var prefix = address.slice(0, 2);
    var payload = address.slice(2);
    var version = prefix === 'ST' ? 0x1a : 0x16;

    var bytes = [];
    var num = BigInt(0);
    for (var i = 0; i < payload.length; i++) {
        var c = payload[i].toUpperCase();
        var idx = C32_CHARS.indexOf(c);
        if (idx < 0) continue;
        num = num * BigInt(32) + BigInt(idx);
    }

    // Extract 21 bytes (1 version + 20 hash + 4 checksum, but we drop checksum)
    var arr = [];
    for (var j = 0; j < 24; j++) {
        arr.unshift(Number(num & BigInt(0xff)));
        num = num >> BigInt(8);
    }
    // arr[0] is version, arr[1..20] is hash160
    var hex = version.toString(16).padStart(2, '0');
    for (var k = 1; k <= 20; k++) {
        hex += arr[k].toString(16).padStart(2, '0');
    }
    return hex;
}

function renderMySlots(grid, resultHex, ownerAddress) {
    // Parse the result - it's an ok(list) from get-teacher-slot-list
    // For now, display the raw result and fetch each slot
    grid.innerHTML = '';

    // Try to parse the list from hex result
    var ids = parseSlotIdList(resultHex);
    if (ids.length === 0) {
        grid.innerHTML = '<p class="placeholder">You have no slots yet.</p>';
        return;
    }

    ids.forEach(function (tokenId) {
        var encoded;
        try {
            encoded = '0x01' + encodeUint(tokenId).replace(/^0x/, '');
        } catch (e) { return; }

        callReadOnly('get-slot-details', [encoded])
            .then(function (data) {
                if (data && data.okay && data.result) {
                    appendMySlotCard(grid, tokenId, data.result, ownerAddress);
                }
            })
            .catch(function () {});
    });
}

function parseSlotIdList(hexResult) {
    // Very basic parser: extract uint values from the hex response
    // The result format is 0x 07 (ok) 0b (list) [length 4 bytes] [items...]
    // Each uint item: 0x01 [16 bytes big-endian uint]
    var ids = [];
    if (!hexResult || typeof hexResult !== 'string') return ids;
    var clean = hexResult.replace(/^0x/, '');
    // Skip ok wrapper (07 prefix) if present
    if (clean.startsWith('07')) clean = clean.slice(2);
    // Skip list prefix (0b) and 4-byte length
    if (clean.startsWith('0b')) {
        clean = clean.slice(2); // skip 0b
        clean = clean.slice(8); // skip 4-byte count
        // Parse each uint (type 0x01 + 16 bytes)
        while (clean.length >= 34) {
            var typeByte = clean.slice(0, 2);
            if (typeByte !== '01') break;
            var numHex = clean.slice(2, 34);
            var num = parseInt(numHex, 16);
            if (!isNaN(num) && num > 0) ids.push(num);
            clean = clean.slice(34);
        }
    }
    return ids;
}

function appendMySlotCard(grid, id, slotData, ownerAddress) {
    var card = document.createElement('div');
    card.className = 'slot-card slot-card--mine';

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

    var timeBlock = slotData['time-block'];
    if (timeBlock && typeof timeBlock === 'number') {
        var blocksLeft = blocksUntilExpiry(timeBlock);
        var expiryEl = document.createElement('p');
        expiryEl.className = 'meta slot-expiry';
        expiryEl.textContent = blocksLeft <= 0
            ? 'EXPIRED'
            : 'Expires: ' + formatTimeRemaining(blocksLeft);
        if (blocksLeft <= 0) expiryEl.style.color = '#c00';
        card.appendChild(expiryEl);
    }

    var isActive = slotData['is-active'];
    var status = document.createElement('span');
    status.className = 'slot-status slot-status--' + (isActive ? 'active' : 'inactive');
    status.textContent = isActive ? 'Active' : 'Inactive';
    card.appendChild(status);

    // Management actions
    var actions = document.createElement('div');
    actions.className = 'slot-actions';

    if (isActive) {
        var deactivateBtn = document.createElement('button');
        deactivateBtn.className = 'btn-action btn-action--deactivate';
        deactivateBtn.textContent = 'Deactivate';
        deactivateBtn.addEventListener('click', function () {
            initiateDeactivate(id, ownerAddress);
        });
        actions.appendChild(deactivateBtn);
    }

    card.appendChild(actions);
    grid.appendChild(card);
}

// ---- Transaction Initiation ----

function initiateDeactivate(tokenId, senderAddress) {
    showTxStatus('Preparing deactivate transaction for slot #' + tokenId + '...', false);
    if (!window.StacksProvider) {
        showError('Please install Hiro Wallet to send transactions.');
        return;
    }
    // Placeholder: actual Stacks.js transaction call would go here
    // This requires @stacks/connect to call contract functions
    showTxStatus('Transaction initiated for slot #' + tokenId + '. Check your wallet.', false);
    showError('Transaction signing requires the Hiro Wallet browser extension.');
}
