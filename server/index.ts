import SocketIO = require('socket.io');
import Express = require('express');
import http_server = require('http');
import path = require('path');
import axios from 'axios';
import Config from '../shared/config';
import Position from '../shared/positions';
import Tank from '../shared/tanks';
import Bullet from '../shared/bullet';

function get_random_position(): Position {
    let x = (Math.random() * 10000) % Config.space.width;
    let y = (Math.random() * 10000) % Config.space.height;
    return { x: x, y: y };
}

function get_random_direction(): number {
    return (Math.random() * 10000) % 360;
}

// covert angle to radian
function covert_degree(x: number): number {
    return x * Math.PI / 180;
}

function get_line_slope(d: number): number {
    return 1 / Math.tan(covert_degree(d));
}

function create_tank(id: string): Tank {
    let default_angle = get_random_direction();
    return {
        pos: get_random_position(),
        blood: 1.0,
        name: `unnamed < ${id} >`,
        time_to_fire: 0,
        angle: {
            tank: default_angle,
            gun: default_angle,
            radar: default_angle,
        },
        is_moving: false,
        id: id,
    };
}

function create_bullet(tank: Tank, level: number) {
    let this_bullet: Bullet = {
        pos: {
            x: tank.pos.x,
            y: tank.pos.y,
        },
        dire: tank.angle.gun,
        level: level,
        source: tank.id,
    };
    bullets.push(this_bullet);
}

function check_crash_bullet(this_bullet: Bullet) {
    const this_bullet_damage = Config.bullet.damage[this_bullet.level];

    for (let id in tanks) {
        if (this_bullet.source === id) { continue; }

        let this_tank: Tank = tanks[id];
        if (this_bullet.pos.x >= this_tank.pos.x - Config.tanks.size / 2
            && this_bullet.pos.x <= this_tank.pos.x + Config.tanks.size / 2
            && this_bullet.pos.y >= this_tank.pos.y - Config.tanks.size / 2
            && this_bullet.pos.y <= this_tank.pos.y + Config.tanks.size / 2) {

            let source_tank: Tank = tanks[this_bullet.source];
            if (source_tank !== undefined) {
                source_tank.blood += Math.min(this_bullet_damage, this_tank.blood) / 5;
            }

            this_tank.blood -= this_bullet_damage;

            return true;
        }
    }

    return false;
}

function check_outof_space(pos: Position) {
    let half_tank_size = Config.tanks.size / 2;

    if (pos.x < half_tank_size
        || pos.y < half_tank_size
        || pos.x > Config.space.width - half_tank_size
        || pos.y > Config.space.height - half_tank_size) {
        return true;
    }
    return false;
}

function move_position(pos: Position, angle: number, distance: number) {
    pos.x += distance * Math.cos(covert_degree(angle));
    pos.y += distance * Math.sin(covert_degree(angle));
}

const app = Express();
const http = new http_server.Server(app);
const io = new SocketIO(http);
let bullets = new Array<Bullet>();
let tanks = new Object();
let socket_list = new Array<SocketIO.Socket>();

io.on('connection', (socket: SocketIO.Socket) => {
    console.log(`One tank joined: ${socket.id} @ ${socket.handshake.address}`);

    socket_list[socket.id] = socket;
    let this_tank = create_tank(socket.id);
    tanks[socket.id] = this_tank;

    let turning_iid: { tank: NodeJS.Timeout, gun: NodeJS.Timeout, radar: NodeJS.Timeout } = {
        tank: null,
        gun: null,
        radar: null,
    };

    socket.on('disconnect', () => {
        delete tanks[socket.id];
        console.log(`Tank ${socket.id} disconnected.`);
    });

    socket.on('turn', (info: { type: string, target: number }) => {
        let target = info.target % 360;
        if (target < 0) { target += 360; }

        let type_id: string = info.type;

        let once_update: number = Config.tanks.turn_speed[type_id];

        if (once_update >= 360) {
            this_tank.angle[type_id] = target;
            return;
        }

        once_update %= 360;
        if (Math.abs(target - this_tank.angle[type_id]) > 180) {
            once_update *= -1;
        }

        if (turning_iid[type_id] != null) {
            clearInterval(turning_iid[type_id]);
        }

        turning_iid[type_id] = setInterval(() => {
            if (this_tank.angle[type_id] == target) {
                clearInterval(turning_iid[type_id]);
                turning_iid[type_id] = null;
                return;
            }

            if (Math.abs(target - this_tank.angle[type_id]) <= Math.abs(once_update)) {
                this_tank.angle[type_id] = target;
            } else {
                this_tank.angle[type_id] += once_update;
                this_tank.angle[type_id] %= 360;

                if (this_tank.angle[type_id] < 0) { this_tank.angle[type_id] += 360; }
            }
        }, Config.game.update);
    });

    socket.on('fire', (level: number) => {
        if (this_tank.time_to_fire > 0) {
            console.log('Fire too much.');
            this_tank.blood -= Config.tanks.fire_too_much_damage;
            return;
        }

        if (typeof level !== 'number' || level > 5 || level < 0) {
            console.log('Invaild arguments.');
            return;
        }

        this_tank.time_to_fire = Config.tanks.fire_speed[level];
        create_bullet(this_tank, level);
    });

    socket.on('move', (state: boolean) => { this_tank.is_moving = state; });

    socket.on('set-name', (name: string) => { this_tank.name = `${name} < ${socket.id} >`; });

    socket.on('boardcast', (data: any) => {
        io.emit('boardcast', data);
    });
});


setInterval(() => {
    for (let id in bullets) {
        let this_bullet = bullets[id];

        const move_split_time = 5;
        for (let i = 1; i <= move_split_time; i += 1) {
            move_position(this_bullet.pos, this_bullet.dire, Config.bullet.speed / move_split_time);
            if (check_crash_bullet(this_bullet) || check_outof_space(this_bullet.pos)) {
                bullets.splice(<number><any>id, 1);
                break;
            }
        }
    }

    for (let id in tanks) {
        let this_tank: Tank = tanks[id];

        if (this_tank.time_to_fire > 0) {
            this_tank.time_to_fire -= 1;
        }

        if (this_tank.blood <= 0) {
            let this_socket: SocketIO.Socket = socket_list[this_tank.id];
            this_socket.disconnect();
            delete tanks[id];
            continue;
        }

        if (!this_tank.is_moving) {
            continue;
        }

        move_position(this_tank.pos, this_tank.angle.tank, Config.tanks.max_speed);

        if (check_outof_space(this_tank.pos)) {
            this_tank.blood -= Config.tanks.crash_damage;

            let half_tank_size = Config.tanks.size / 2;
            this_tank.pos.x = Math.min(Config.space.width - half_tank_size, this_tank.pos.x);
            this_tank.pos.y = Math.min(Config.space.width - half_tank_size, this_tank.pos.y);

            this_tank.pos.x = Math.max(half_tank_size, this_tank.pos.x);
            this_tank.pos.y = Math.max(half_tank_size, this_tank.pos.y);
        }
    }

    io.emit('update', { tanks: tanks, bullets: bullets });
}, Config.game.update);

app.use('/', Express.static(path.join(__dirname + '../../../../client/')));
app.get('/webjs', (req, res) => {
    let url: string = req.query.url.toString();
    console.log(`Web JS Fetch: ${url}`);

    if (url === undefined || !url.startsWith('http')) {
        res.status(400).send(`Not a url: ${url}.`);
        return;
    }

    axios.get(url, { timeout: 10000 })
        .then((resualt) => {
            res.send(resualt.data);
        })
        .catch(() => {
            res.status(400).send(`Failed to get ${url}.`);
        });
});

http.listen(3000, () => { console.log("Server started on Port 3000."); });
