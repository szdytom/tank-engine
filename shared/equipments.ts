import Position from './position';
import Config from './config';
import { addTimeout, stopTimeout } from './timeout-id';
import { get_random_direction, get_random_position } from './Lfunctions';

interface TurningInfo {
    type: string
    target: number
}

interface AngleInfo {
    radar: number
    gun: number
    main: number
}

abstract class AbstractEquipment {
    readonly type: string

    pos: Position
    angle: AngleInfo
    is_moving: boolean
    blood: number
    name: string
    id: string
    time_to_fire: number

    protected turning_iid: AngleInfo

    constructor(type: string, id: string) {
        this.type = type;
        this.id = id;
        this.name = `unnamed < ${id} >`;

        this.is_moving = false;
        this.turning_iid = {
            main: null,
            gun: null,
            radar: null,
        };
        this.time_to_fire = 0;
    }

    get_speed(): number { return undefined; }
    get_size(): number { return undefined; }
    get_crash_wall_damage(): number { return undefined; }
    get_fire_too_much_damage(): number { return undefined; }

    check_hit(shell_pos: Position): boolean {
        let half_size = this.get_size() / 2;
        if (shell_pos.x >= shell_pos.x - half_size
            && shell_pos.x <= shell_pos.x + half_size
            && shell_pos.y >= shell_pos.y - half_size
            && shell_pos.y <= shell_pos.y + half_size) {
            return true;
        }
        return false;
    }

    update(): boolean {
        if (this.is_moving) { this.update_move(); }
        if (this.blood <= 0) { return true; }
        return false;
    }

    turn_to(info: TurningInfo): void {
        info.target %= 360;
        if (info.target < 0) { info.target += 360; }

        if (!['main', 'gun', 'radar'].includes(info.type)) {
            console.warn(`Invailed turning type ${info.type} for this equipment.`);
            return;
        }

        this.angle[info.type] = info.target;
    }

    can_fire(): boolean { return true; }
    set_name(name: string) { this.name = `${name} < ${this.id} >`; }

    protected update_move() {
        this.pos.update(this.angle.main, this.get_speed());

        if (this.check_out_of_space()) {
            this.blood -= this.get_crash_wall_damage();

            let half_size = this.get_size() / 2;

            this.pos.x = Math.min(Config.space.width - half_size, this.pos.x);
            this.pos.y = Math.min(Config.space.width - half_size, this.pos.y);

            this.pos.x = Math.max(half_size, this.pos.x);
            this.pos.y = Math.max(half_size, this.pos.y);
        }
    }

    protected check_out_of_space() {
        let half_size = this.get_size() / 2;

        if (this.pos.x < half_size
            || this.pos.y < half_size
            || this.pos.x > Config.space.width - half_size
            || this.pos.y > Config.space.height - half_size) {
            return true;
        }
        return false;
    }
}

class Tank extends AbstractEquipment {
    constructor(id: string) {
        super('Tanks', id);
        this.blood = Config.equipments.Tanks.blood;
        this.pos = new Position(get_random_position());

        let init_angle = get_random_direction();
        this.angle = {
            main: init_angle,
            radar: init_angle,
            gun: init_angle,
        };
    }

    get_size(): number { return Config.equipments.Tanks.size; }
    get_speed(): number { return Config.equipments.Tanks.speed; }
    get_crash_wall_damage(): number { return Config.equipments.Tanks.crash_wall_damage; }
    get_fire_too_much_damage(): number { return Config.equipments.Tanks.fire_too_much_damage; }

    update(): boolean {
        if (this.time_to_fire > 0) { this.time_to_fire -= 1; }
        return super.update();
    }

    turn_to(info: TurningInfo): void {
        let target = info.target % 360;
        if (target < 0) { target += 360; }

        let type_id: string = info.type;

        if (!['main', 'gun', 'radar'].includes(type_id)) {
            console.warn(`Invailed turning type ${info.type} for Tank.`);
            return;
        }

        let once_update: number = Config.equipments.Tanks.turn_speed[type_id];

        if (once_update >= 360) {
            this.angle[type_id] = target;
            return;
        }

        once_update %= 360;
        if (Math.abs(target - this.angle[type_id]) > 180) {
            once_update *= -1;
        }

        if (this.turning_iid[type_id] !== null) {
            stopTimeout(this.turning_iid[type_id]);
        }

        this.turning_iid[type_id] = addTimeout(setInterval((): void => {
            if (this.angle[type_id] === target) {
                stopTimeout(this.turning_iid[type_id]);
                this.turning_iid[type_id] = null;
                return;
            }

            if (Math.abs(target - this.angle[type_id]) <= Math.abs(once_update)) {
                this.angle[type_id] = target;
            } else {
                this.angle[type_id] += once_update;
                this.angle[type_id] %= 360;

                if (this.angle[type_id] < 0) { this.angle[type_id] += 360; }
            }
        }, Config.tick_speed));
    }
}

export { AbstractEquipment, Tank, TurningInfo };