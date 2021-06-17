var tank_controller = {
    id: null,
    my: null,
    loop_cb: [],
    scan_res: [],

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
    getHeat: () => {
        return tank_controller.my.heat;
    },
    checkFire: () => {
        return tank_controller.getHeat() <= 0;
    },
    scan: () => {
        return tank_controller.scan_res;
    },

    update: () => {
        if (tank_controller.id == null) {
            return;
        }

        let flag = true;
        for (let tk of game_state.tanks) {
            if (tk.id == tank_controller.id) {
                tank_controller.my = tk;
                flag = false;
                break;
            }
        }

        if (flag) {
            socket.disconnect();
            return;
        }
        
        for (let cb of tank_controller.loop_cb) {
            cb();
        }

        let my = tank_controller.my;
        let lineA = [[my.x, my.y], [update_pos_x(my.radar_angle + 15, 20) + x, update_pos_y(my.radar_angle + 15, 20) + y]];
        let lineB = [[my.x, my.y], [update_pos_x(my.radar_angle - 15, 20) + x, update_pos_y(my.radar_angle - 15, 20) + y]];
        tank_controller.scan_res = [];
        for (let tk of game_state.tanks) {
            if (tk.id == my.id) {
                continue;
            }

            if (cross_product([tk.x, tk.y], ...lineA) * cross_product([tk.x, tk.y], ...lineB) <= 0) {
                tank_controller.scan_res.push({
                    x: tk.x,
                    y: tk.y,
                    blood: tk.blood,
                    is_moveing: tk.is_moveing,
                    angle: tk.angle,
                });
            }
        }
    },
};