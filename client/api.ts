import Tank from '../shared/tanks';
import Config from '../shared/config';
import 'socket.io-client';
import { tanks, socket } from './global';
import Position from '../shared/positions';
import $ = require('jquery');

class TankController {
    private tank_id: string
    on_scan_callback: Function

    constructor(tank_id: string) {
        this.tank_id = tank_id;
        this.on_scan_callback = () => { this.do_nothing(); };
    }

    get_x(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.pos.x;
    }

    get_y(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.pos.y;
    }

    get_pos(): Position {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.pos;
    }

    get_direction(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.angle.tank;
    }

    get_gun_direction(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.angle.gun;
    }

    get_radar_direction(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.angle.radar;
    }

    get_blood(): number {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.blood;
    }

    can_fire(): boolean {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.time_to_fire <= 0;
    }

    fire(level: number): void {
        socket.emit('fire', level - 1);
    }

    turn_to(target: number): void {
        socket.emit('turn', {
            type: 'tank',
            target: target,
        });
    }

    turn_gun_to(target: number): void {
        socket.emit('turn', {
            type: 'gun',
            target: target,
        });
    }

    turn_radar_to(target: number): void {
        socket.emit('turn', {
            type: 'radar',
            target: target,
        });
    }

    move(): boolean {
        if (tanks[this.tank_id].is_moving) { return false; }
        socket.emit("move", true);
        return true;
    }

    stop(): boolean {
        if (!tanks[this.tank_id].is_moving) { return false; }
        socket.emit('move', false);
        return false;
    }

    on_scan(callback: Function): void {
        this.on_scan_callback = callback;
    }

    _do_scan(): void {
        let this_tank: Tank = tanks[this.tank_id];
        let radar_angle = this_tank.angle.radar;
        let high_slope = get_line_slope(radar_angle + Config.tanks.radar_size);
        let low_slope = get_line_slope(radar_angle - Config.tanks.radar_size);
        let upper_slope = Math.min(high_slope, low_slope);
        let lower_slope = Math.max(high_slope, low_slope);
        for (let id in tanks) {
            let element = tanks[id];
            if (element.id == this.tank_id) { continue; }

            let target_slope = (element.pos.x - this_tank.pos.x) / (element.pos.y - this_tank.pos.y);
            if (upper_slope <= target_slope && target_slope <= lower_slope) {
                // scanned
                this.on_scan_callback({
                    x: element.pos.x,
                    y: element.pos.y,
                    blood: element.blood,
                    is_moving: element.is_moving,
                    name: element.name,
                });
            }
        };
    }

    do_nothing(): void { }

    get_config(): any {
        return JSON.parse(JSON.stringify(Config));
    }

    set_name(name: string): void {
        socket.emit('set-name', name);
    }

    loop(callback: Function): void {
        setInterval(() => {
            callback();
        }, Config.game.update);
    }
}

let tc: TankController;

// covert angle to radian
function covert_degree(x: number): number {
    return x * Math.PI / 180;
}

function get_line_slope(d: number): number {
    return 1 / Math.tan(covert_degree(d));
}

function update_tanks() {
    if (tc === undefined) { return; }
    tc._do_scan();
}

function start_code(parsed_code: Function) {
    tc = new TankController(socket.id);
    let custom_var = {};
    parsed_code(tc, custom_var);
}

function set_up() {
    $('#ctr-tk-fire').on('click', () => { tc.fire(2); });
    $('#ctr-tk-move').on('click', () => { tc.move(); });
    $('#ctr-tk-stop').on('click', () => { tc.stop(); });
}

export {
    start_code,
    update_tanks,
    set_up,
};
