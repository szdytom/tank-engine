import config from '../shared/config';
import { check_line_crash, update_pos_x, update_pos_y } from '../shared/move';
import { Tank } from './tank';

export class Shell {
    owner_id: number
    x: number
    y: number
    angle: number
    level: number

    constructor(level: number, x: number, y: number, angle: number, owner_id: number) {
        this.level = level;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.owner_id = owner_id;
    }

    is_alive() {
        return this.x >= 0 && this.x < config.width && this.y >= 0 && this.y < config.height;
    }

    update(tanks: Tank[]) {
        let xx = this.x + update_pos_x(this.angle, config.shell.speed);
        let yy = this.y + update_pos_y(this.angle, config.shell.speed);

        let mline = [
            [this.x, this.y],
            [xx, yy],
        ];

        for (let t of tanks) {
            if (t.id == this.owner_id) {
                continue;
            }

            let vertex = t.vertex_xy();
            if (check_line_crash([vertex[0], vertex[1]], mline)
                || check_line_crash([vertex[1], vertex[2]], mline)
                || check_line_crash([vertex[2], vertex[3]], mline)
                || check_line_crash([vertex[3], vertex[0]], mline)) {
                // crash!
                t.hit(config.shell.damage[this.level]);
                xx = -1;
                
                for (let t of tanks) {
                    if (t.id == this.owner_id) {
                        t.blood += config.tank.damage_blood_rate * config.shell.damage[this.level];
                        break;
                    }
                }

                break;
            }
        }

        this.x = xx;
        this.y = yy;
    }
};