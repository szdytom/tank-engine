import Position from './position';
import Config from './config';
import { AbstractEquipment } from './equipments';

interface FireInfo {
    type: string
    angle: number
    source: AbstractEquipment
    data: {
        level: number
        x: number
        y: number
    }
}

abstract class AbstractShell {
    static create(info: FireInfo): AbstractShell {
        if (info.type === 'TankShell') {
            if (TankShell.is_valid_info(info)) { return new TankShell(info); }
            else { return new NoShell() }
        } else if (info.type === 'AntiTankMineShell') {
            if (AntiTankMineShell.is_valid_info(info)) { return new AntiTankMineShell(info); }
            else { return new NoShell() }
        }

        console.warn(`Invaild shell type ${info.type}.`);
        return new NoShell();
    }

    static is_valid_info(_info: FireInfo): boolean { return true; }

    readonly type: string

    source: AbstractEquipment
    pos: Position
    angle: number

    constructor(type: string, info?: FireInfo) {
        this.type = type;

        if (!info) { return; }
        this.source = info.source;
        this.angle = info.angle;
        this.pos = this.source.pos.clone();
    }

    get_speed(): number { return undefined; }
    get_damage(): number { return undefined; }
    get_heat(): number { return undefined; }

    update(check_hit_callback: () => boolean): boolean {
        const move_splits = 4;
        for (let i = 1; i <= move_splits; i += 1) {
            this.pos.update(this.angle, this.get_speed() / move_splits);
            if (check_hit_callback() || this.check_out_of_space()) { return true; }
        }

        return false;
    }

    check_hit(equipments: AbstractEquipment[]): boolean {
        let result = false;
        equipments.forEach((target_tank: AbstractEquipment) => {
            if (result) { return; }
            if (this.source.id === target_tank.id) { return; }
            if (target_tank.blood <= 0) { return; }

            if (target_tank.check_hit(this.pos)) {
                console.log(`Hit damage ${this.get_damage()}.`);
                this.source.blood += Math.min(this.get_damage(), target_tank.blood) / 4;
                target_tank.blood -= this.get_damage();

                result = true;
                return;
            }
        });

        return result;
    }


    protected check_out_of_space() {
        if (this.pos.x < 0
            || this.pos.y < 0
            || this.pos.x > Config.space.width
            || this.pos.y > Config.space.height) {
            return true;
        }
        return false;
    }
}

class TankShell extends AbstractShell {
    static is_valid_info(info: FireInfo): boolean {
        let level = info.data.level;
        if (typeof (level) !== 'number') { return false; }
        if (level < 0 || level > Config.shells.Tank.damage.length) { return false; }
        return true;
    }

    private level: number

    constructor(info: FireInfo) {
        super('TankShell', info);

        this.level = info.data.level;
    }

    get_heat(): number { return Config.shells.Tank.heat[this.level]; }
    get_damage(): number { return Config.shells.Tank.damage[this.level]; }
    get_speed(): number { return Config.shells.Tank.speed; }
}

class AntiTankMineShell extends AbstractShell {
    static is_valid_info(_info: FireInfo): boolean { return true; }

    private time_to_live: number

    constructor(info: FireInfo) {
        super('AntiTankMineShell', info);

        this.time_to_live = Config.shells.AntiTankMine.ttl;
    }

    get_heat(): number { return Config.shells.AntiTankMine.damage; }
    get_damage(): number { return Config.shells.AntiTankMine.heat; }
    get_speed(): number { return 0; }

    update(check_hit_callback: () => boolean): boolean {
        if (check_hit_callback()) { return true; }
        if (this.time_to_live <= 0) { return true; }
        this.time_to_live -= 1;
        return false;
    }
}

class NoShell extends AbstractShell {
    constructor() {
        super('NoShell');

        this.pos = new Position({ x: 0, y: 0 });
        this.angle = 0;
        this.source = null;
    }

    get_heat(): number { return 0; }
    get_damage(): number { return 0; }
    get_speed(): number { return Infinity; }

    update(): boolean { return true; }
    check_hit(): boolean { return false; }
}

export { AbstractShell, FireInfo };