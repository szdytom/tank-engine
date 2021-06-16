var tank_controller = {
    id: null,
    loop_cb: [],

    fire: (level) => {
        socket.emit('fire', level);
    },
    turnTo: (target) => {
        socket.emit('turn', 'main', target);
    },
    turnGunTo: (target) => {
        socket.emit('turn', 'gun', target);
    },
    turnRadarTo: (target) => {
        socket.emit('turn', 'radar', target);
    },
    move: () => {
        socket.emit('move', true);
    },
    stop: () => {
        socket.emit('move', false);
    },
    loop: (cb) => {
        tank_controller.loop_cb.push(cb);
    },
    update: () => {
        for (let cb of loop_cb) {
            cb();
        }
    },
};