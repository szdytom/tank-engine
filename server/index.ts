import SocketIO = require('socket.io');
import Express = require('express');
import http_server = require('http');
import path = require('path');
import axios from 'axios';
import Config from '../shared/config';
import { AbstractEquipment, Tank, TurningInfo } from '../shared/equipments';
import { AbstractShell, FireInfo } from '../shared/shells';

interface RoomInfo {
    room_id: string
    equipments: AbstractEquipment[]
    shells: AbstractShell[]
}

function create_new_room(id: number): RoomInfo {
    return {
        room_id: `Space_${id}`,
        equipments: new Array<AbstractEquipment>(),
        shells: new Array<AbstractShell>(),
    };
}

function is_bad_equipment(this_equipment: AbstractEquipment): boolean {
    if (this_equipment == null) { return true; }
    if (this_equipment.blood <= 0) { return true; }
    return false;
}

const app = Express();
const http = new http_server.Server(app);
const io = new SocketIO.Server(http);
let rooms = new Array<RoomInfo>();

io.on('connect', (socket: SocketIO.Socket): void => {
    console.log(`One client connected: ${socket.id} @ ${socket.handshake.address}`);

    let this_equipment: AbstractEquipment = null;
    let room_id: number = null;

    socket.on('disconnect', (): void => {
        console.log(`Client ${socket.id} disconnected.`);
        if (is_bad_equipment(this_equipment)) { return; }
        this_equipment.blood = -Infinity;
    });

    socket.on('join-space', (info: { room_id: number, equipment_type: string }): void => {
        if (typeof info.room_id !== 'number' || info.room_id > Config.max_rooms || info.room_id < 0) {
            console.warn(`Invalid Argument of room_id='${room_id}'.`);
            return;
        }
        room_id = Math.floor(info.room_id);

        if (!rooms[room_id]) {
            rooms[room_id] = create_new_room(room_id);
        }

        console.log(`Client ${socket.id} joined room '${room_id}' as ${info.equipment_type}.`);

        socket.join(rooms[room_id].room_id);
        if (info.equipment_type === 'Tank') {
            this_equipment = new Tank(socket.id);
            rooms[info.room_id].equipments.push(this_equipment);
        } else {
            console.warn(`Unknown equipment type ${info.equipment_type}.`);
        }
    });

    socket.on('turn', (info: TurningInfo): void => {
        if (is_bad_equipment(this_equipment)) { return; }
        this_equipment.turn_to(info);
    });

    socket.on('fire', (info: FireInfo): void => {
        if (is_bad_equipment(this_equipment)) { return; }
        if (!this_equipment.can_fire()) {
            this_equipment.blood -= this_equipment.get_fire_too_much_damage();
            console.log('Fire too much.');
            return;
        }

        info.angle = this_equipment.angle.gun;
        info.source = this_equipment;

        let this_shell = AbstractShell.create(info);
        rooms[room_id].shells.push(this_shell);
        this_equipment.time_to_fire += this_shell.get_heat();
    });

    socket.on('move', (state: boolean): void => {
        if (is_bad_equipment(this_equipment)) { return; }
        this_equipment.is_moving = state;
    });

    socket.on('set-name', (name: string): void => {
        if (is_bad_equipment(this_equipment)) { return; };
        this_equipment.set_name(name);
    });

    socket.on('broadcast', (data: any): void => {
        if (is_bad_equipment(this_equipment)) { return; }
        socket.to(rooms[room_id].room_id).broadcast.emit('broadcast', data);
    });
});

setInterval((): void => {
    rooms.forEach((this_room: RoomInfo): void => {
        let equipment_id_map = new Object();

        this_room.shells.forEach((this_shell: AbstractShell, i: number): void => {
            if (this_shell.update((): boolean => { return this_shell.check_hit(this_room.equipments); })) {
                delete this_room.shells[i];
                console.log(`Shell ${i} has been deleted`);
                return;
            }
        });

        this_room.equipments.forEach((this_equipment: AbstractEquipment, i: number, array: AbstractEquipment[]): void => {
            if (this_equipment.update()) {
                console.log(`Equipment ${this_equipment.id} was destroyed.`);
                io.to(this_equipment.id).emit('equipment-destroy');
                this_equipment.blood = -Infinity;
                delete array[i];
                return;
            }

            equipment_id_map[this_equipment.id] = i;
        });

        io.to(this_room.room_id).emit('update', {
            shells: this_room.shells,
            equipments: this_room.equipments,
            map: equipment_id_map,
        });
    });
}, Config.tick_speed);

app.use('/', Express.static(path.join(__dirname, '../client')));
app.get('/webjs', (req, res): void => {
    let url: string = req.query.url.toString();
    console.log(`Web JS Fetch: ${url}`);

    if (url === undefined || !url.startsWith('http')) {
        res.status(400).send(`Not a url: ${url}.`);
        return;
    }

    axios.get(url, { timeout: 10000 })
        .then((result): void => {
            res.send(result.data);
        })
        .catch((): void => {
            res.status(400).send(`Failed to get ${url}.`);
        });
});

let server_port = parseInt(process.env.PORT) | 3000;
http.listen(server_port, (): void => { console.log(`Server started on port ${server_port}.`); });