const API_URL = 'https://stacks-node-api.testnet.stacks.co';
const CONTRACT_ADDRESS = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'timetablechain';

document.addEventListener('DOMContentLoaded', function () {
    var connectBtn = document.getElementById('connectWallet');
    connectBtn.addEventListener('click', connectWallet);
    renderSampleSlots();
});

function connectWallet() {
    var btn = document.getElementById('connectWallet');
    if (typeof window.StacksProvider !== 'undefined') {
        window.StacksProvider.authenticationRequest()
            .then(function () {
                btn.textContent = 'Connected';
                btn.disabled = true;
            })
            .catch(function (err) {
                console.error('Connection failed:', err);
            });
    } else {
        window.open('https://wallet.hiro.so/', '_blank');
    }
}

function renderSampleSlots() {
    var grid = document.getElementById('slotsGrid');
    var slots = [
        { id: 1, subject: 'Mathematics', grade: 10, room: 101, time: 'Morning' },
        { id: 2, subject: 'Physics', grade: 11, room: 205, time: 'Afternoon' },
        { id: 3, subject: 'English', grade: 9, room: 103, time: 'Morning' }
    ];

    grid.textContent = '';
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
        body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: args || [] })
    }).then(function (res) { return res.json(); });
}
