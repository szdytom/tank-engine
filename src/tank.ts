import config from "../shared/config";
import { rect_xy, update_pos_x, update_pos_y } from "../shared/move";

function update_angle(angle: number, target: number, speed: number): number {
    if (Math.abs(angle - target) <= speed) {
        return target;
    }
    
    let lg_target = target < angle ? target + 360 : target;
    if (angle + 180 >= lg_target) {
        return (angle + speed) % 360;
    }
    return (angle - speed + 360) % 360;
}

let tank_id_counter = 1;

export class Tank {
    blood: number
    x: number
    y: number
    is_moving: boolean

    angle: number
    gun_angle: number
    radar_angle: number

    angle_target: number
    gun_angle_target: number

    heat: number
    id: number
    owner_id: string

    constructor(owner_id: string) {
        this.owner_id = owner_id;
        this.id = tank_id_counter;
        tank_id_counter += 1;

        this.x = (config.width - config.tank.size) * Math.random() + config.tank.size / 2;
        this.y = (config.height - config.tank.size) * Math.random() + config.tank.size / 2;

        this.blood = config.tank.blood;
        
        this.angle = 0;
        this.gun_angle = 0;
        this.radar_angle = 0;
        this.angle_target = 0;
        this.gun_angle_target = 0;

        this.is_moving = false;
        this.heat = 0;
    }

    is_alive() {
        return this.blood > 0;
    }

    kill() {
        this.blood = -Infinity;
    }

    hit(x: number) {
        this.blood -= x;
    }

    can_fire() {
        return this.heat <= 0;
    }

    try_fire() {
        if (this.can_fire()) {
            return true;
        }
        this.blood -= config.tank.fire_too_much_damage;
        return false;
    }

    fire(h: number) {
        this.heat += h;
    }

    turn_to(type: string, target: number) {
        if (type === 'radar') {
            this.radar_angle = target;
        } else if (type === 'main') {
            this.angle_target = target;
        } else if (type === 'gun') {
            this.gun_angle_target = target;
        }
    }

    move(state: boolean) {
        this.is_moving = state;
    }

    pack() {
        return {
            x: this.x,
            y: this.y,
            is_moving: this.is_moving,
            angle: this.angle,
            gun_angle: this.gun_angle,
            radar_angle: this.radar_angle,
            id: this.id,
            owner_id: this.owner_id,
            heat: this.heat,
            blood: this.blood,
        };
    }

    update() {
        if (this.angle_target != this.angle) {
            this.angle = update_angle(this.angle, this.angle_target, config.tank.turn_speed.main);
        }

        if (this.gun_angle_target != this.gun_angle) {
            this.gun_angle = update_angle(this.gun_angle, this.gun_angle_target, config.tank.turn_speed.gun);
        }

        if (this.is_moving) {
            this.x += update_pos_x(this.angle, config.tank.speed);
            this.y += update_pos_y(this.angle, config.tank.speed);

            if (this.x < 0 || this.x >= config.width || this.y < 0 || this.y >= config.height) {
                this.blood -= config.tank.crash_damage;

                // TODO: include tank size when checking crash 
                if (this.x < 0) { this.x = 0; }
                if (this.x >= config.width) { this.x = config.width - 1; }
                if (this.y < 0) { this.y = 0; }
                if (this.y >= config.height) { this.y = config.height - 1; }
            }
        }

        this.heat -= 1;
        if (this.heat < 0) {
            this.heat = 0;
        }
    }

    vertex_xy() {
        return rect_xy(this.x, this.y, this.angle, config.tank.size);
    }
};