let control_type = 'connect';

let socket = null;
let loaded_code;
var game_state;

function connect() {
    document.getElementById('control').innerHTML = 'start';
    control_type = 'start';
    socket = io();

    socket.on('connect', () => {
        console.log('Connected.');
    });

    socket.on('Disconnected', () => {
        console.log('Disconnected.');
    });

    socket.on('started', id => {
        tank_controller.id = id;
        setTimeout(() => {
            loaded_code(tank_controller);
        }, 0);
    });
    
    socket.on('sync-game', data => {
        game_state = data;
        draw();
        tank_controller.update();
    });
}

function start() {
    document.getElementById('control').innerHTML = 'stop';
    control_type = 'stop';
    if (socket == null) {
        console.error('Socket is null.');
        return;
    }

    const code = document.getElementById('code').value;
    loaded_code = new Function('tk', code);
    socket.emit('start');
}

function stop() {
    if (socket == null) {
        console.error('Socket is null.');
        return;
    }

    socket.disconnect();
    location.reload();
}

document.getElementById('control').addEventListener('click', () => {
    if (control_type == 'connect') {
        connect();
    } else if (control_type == 'start') {
        start();
    } else if (control_type == 'stop') {
        stop();
    }
});