import $ = require('jquery');
import 'socket.io-client';

import vt from './vt';
import Config from '../shared/config';
import Position from '../shared/position';
import game_runtime_info from './global';
import { get_line_slope } from '../shared/Lfunctions';

let gre = game_runtime_info.get_instance();

class EquipmentController {
    private equipment_id: string
    private on_scan_callback: (target: any) => void
    private on_broadcast_callback: (data: any) => void;

    constructor(equipment_id: string) {
        this.equipment_id = equipment_id;
        this.on_scan_callback = () => { this.do_nothing(); };
        this.on_broadcast_callback = () => { this.do_nothing(); };
        gre.socket.on('broadcast', (data: any) => { this.on_broadcast_callback(data); });
    }

    get_x(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.pos.x;
    }

    get_y(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.pos.y;
    }

    get_pos(): Position {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.pos;
    }

    get_angle(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.angle.main;
    }

    get_gun_angle(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.angle.gun;
    }

    get_radar_angle(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.angle.radar;
    }

    get_blood(): number {
        let this_equipment = gre.get_equipment(this.equipment_id);
        return this_equipment.blood;
    }

    get_config(): any {
        return JSON.parse(JSON.stringify(Config));
    }

    can_fire(): boolean {
        let this_equipment = gre.get_equipment(this.equipment_id);
        if (!this_equipment.time_to_fire) {
            return true;
        }

        return this_equipment.time_to_fire <= 0;
    }

    fire(level: number): void {
        let this_equipment = gre.get_equipment(this.equipment_id);
        this_equipment.time_to_fire = Infinity;
        gre.socket.emit('fire', {
            type: 'TankShell',
            data: {
                level: level,
            },
        });
    }

    turn_to(target: number): void {
        gre.socket.emit('turn', {
            type: 'main',
            target: target,
        });
    }

    turn_gun_to(target: number): void {
        gre.socket.emit('turn', {
            type: 'gun',
            target: target,
        });
    }

    turn_radar_to(target: number): void {
        gre.socket.emit('turn', {
            type: 'radar',
            target: target,
        });
    }

    move(): boolean {
        let this_equipment = gre.get_equipment(this.equipment_id);
        if (this_equipment.is_moving) { return false; }
        gre.socket.emit("move", true);
        return true;
    }

    stop(): boolean {
        let this_equipment = gre.get_equipment(this.equipment_id);
        if (!this_equipment.is_moving) { return false; }
        gre.socket.emit('move', false);
        return false;
    }

    on_scan(callback: (target: any) => void): void {
        this.on_scan_callback = callback;
    }

    on_broadcast(callback: (data: any) => void): void {
        this.on_broadcast_callback = callback;
    }

    do_nothing(): void { }

    set_name(name: string): void {
        gre.socket.emit('set-name', name);
    }

    broadcast(data: any): void {
        gre.socket.emit('broadcast', data);
    }

    vt_debug(msg: any): void {
        vt.debug(msg);
    }

    vt_info(msg: any): void {
        vt.info(JSON.stringify(msg));
    }

    vt_warn(msg: any): void {
        vt.warn(JSON.stringify(msg));
    }

    vt_error(msg: any): void {
        vt.error(JSON.stringify(msg));
    }

    _tick_update(): void {
        this._do_scan();
    }

    private _do_scan(): void {
        let this_equipment = gre.get_equipment(this.equipment_id);

        let half_radar_size: number = Config.equipments[this_equipment.type].radar_size / 2;

        let radar_angle = this_equipment.angle.radar;
        let high_slope = get_line_slope(radar_angle + half_radar_size);
        let low_slope = get_line_slope(radar_angle - half_radar_size);
        let upper_slope = Math.min(high_slope, low_slope);
        let lower_slope = Math.max(high_slope, low_slope);
        gre.equipments.forEach((target_equipment) => {
            if (target_equipment.id == this.equipment_id) { return; }

            let target_slope = (target_equipment.pos.x - this_equipment.pos.x) / (target_equipment.pos.y - this_equipment.pos.y);
            if (upper_slope <= target_slope && target_slope <= lower_slope) {
                // scanned
                this.on_scan_callback({
                    x: target_equipment.pos.x,
                    y: target_equipment.pos.y,
                    blood: target_equipment.blood,
                    is_moving: target_equipment.is_moving,
                    name: target_equipment.name,
                });
            }
        });
    }
}

let ec: EquipmentController = null;

function update_equipments() {
    if (ec) { ec._tick_update(); }
}

function start_code(parsed_code: Function, load_control_code: Promise<void>) {
    let room_id: number = parseInt($('#room-id').val().toString());
    let equipment_type: string = <string>$('#equipment-type').val();

    vt.info(`Joining room ${room_id} as ${equipment_type}`);
    gre.socket.emit('join-space', { room_id: room_id, equipment_type: equipment_type });

    ec = new EquipmentController(gre.socket.id);

    load_control_code.then(() => {
        vt.info('Equipment control codes loaded.');
        parsed_code(ec);
    });
}

function set_up_control() {
    let set_disable = (element: JQuery<HTMLElement>) => {
        element.attr('disabled', 'true');
        setTimeout(() => { element.removeAttr('disabled'); }, 5000);
    }

    $('#ctr-tk-fire').on('click', () => { ec.fire(2); set_disable($('#ctr-tk-fire')); });
    $('#ctr-tk-move').on('click', () => { ec.move(); set_disable($('#ctr-tk-move')); });
    $('#ctr-tk-stop').on('click', () => { ec.stop(); set_disable($('#ctr-tk-stop')); });
}

export {
    start_code,
    update_equipments,
    set_up_control,
};
