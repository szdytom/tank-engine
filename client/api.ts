import Tank from '../shared/tanks';
import Config from '../shared/config';
import 'socket.io-client';
import { tanks, socket } from './global';

class TankController {
    private tank_id: string
    on_scan_callback: Function

    constructor(tank_id: string) {
        this.tank_id = tank_id;
        this.on_scan_callback = () => { this.do_nothing(); };
    }

    get_x() {
        return tanks[this.tank_id].pos.x;
    }

    get_y() {
        return tanks[this.tank_id].pos.y;
    }

    get_pos() {
        return tanks[this.tank_id].pos;
    }

    get_direction() {
        return tanks[this.tank_id].tank_dire;
    }

    get_gun_direction() {
        return tanks[this.tank_id].gun_dire;
    }

    get_radar_direction() {
        return tanks[this.tank_id].radar_dire;
    }

    get_blood() {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.blood;
    }

    can_fire() {
        let this_tank: Tank = tanks[this.tank_id];
        return this_tank.time_to_fire <= 0;
    }

    fire(level: number) {
        socket.emit('fire', level - 1);
    }

    turn_to(target: number) {
        socket.emit('turn-tank', target);
    }

    turn_gun_to(target: number) {
        socket.emit('turn-gun', target);
    }

    turn_radar_to(target: number) {
        socket.emit('turn-radar', target);
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
        let radar_angle = tanks[this.tank_id].radar_dire;
        let high_slope = get_line_slope(radar_angle + Config.tanks.radar_size);
        let low_slope = get_line_slope(radar_angle - Config.tanks.radar_size);
        let upper_slope = Math.min(high_slope, low_slope);
        let lower_slope = Math.max(high_slope, low_slope);
        for (let id in tanks) {
            let element = tanks[id];
            if (element.id == tanks[this.tank_id].id) { continue; }

            let target_slope = (element.pos.x - tanks[this.tank_id].pos.x) / (element.pos.y - tanks[this.tank_id].pos.y);
            if (upper_slope <= target_slope && target_slope <= lower_slope) {
                // scanned
                this.on_scan_callback({
                    x: element.pos.x,
                    y: element.pos.y,
                    name: element.name,
                });
            }
        };
    }

    do_nothing() { }

    get_config() {
        return JSON.parse(JSON.stringify(Config));
    }

    set_name(name: string) {
        socket.emit('set-name', name);
    }

    loop(callback: Function): void {
        setInterval(() => {
            callback();
        }, Config.game.update);
    }

    _update() {
        tanks[this.tank_id] = tanks[socket.id];
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
    tc._update();
    tc._do_scan();
}

function start_code(parsed_code: Function) {
    tc = new TankController(socket.id);
    let custom_var = {};
    parsed_code(tc, custom_var);
}

export {
    start_code,
    update_tanks
};
