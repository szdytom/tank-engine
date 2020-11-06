import SocketIO = require('socket.io');
import Express = require('express');
import http_server = require('http');
import path = require('path');
import axios from 'axios';
import Config from '../shared/config';
import Position from '../shared/position';
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

const app = Express();
const http = new http_server.Server(app);
const io = new SocketIO(http);
let rooms = new Array<RoomInfo>();

io.on('connection', (socket: SocketIO.Socket) => {
    console.log(`One tank joined: ${socket.id} @ ${socket.handshake.address}`);

    let this_equipment: AbstractEquipment = null;
    let room_id: number = null;

    socket.on('disconnect', () => {
        console.log(`Tank ${socket.id} disconnected.`);
    });

    socket.on('join', (info: { room_id: number, equipment_type: string }) => {
        if (typeof info.room_id !== 'number' || info.room_id > Config.max_rooms || info.room_id < 0) { return; }
        room_id = Math.floor(info.room_id);

        if (!rooms[room_id]) {
            rooms[room_id] = create_new_room(room_id);
        }

        socket.join(rooms[room_id].room_id);
        if (info.equipment_type === 'Tank') {
            this_equipment = new Tank(socket.id);
            rooms[info.room_id].equipments.push(this_equipment);
        } else {
            console.warn(`Unknow equipment type ${info.equipment_type}`);
        }
    });

    socket.on('turn', (info: TurningInfo) => {
        if (this_equipment === null) { return; }
        this_equipment.turn_to(info);
    });

    socket.on('fire', (info: FireInfo) => {
        if (this_equipment === null) { return; }
        if (!this_equipment.can_fire()) {
            this_equipment.blood -= this_equipment.get_fire_too_much_damage();
            return;
        }

        rooms[room_id].shells.push(AbstractShell.create(info));
    });

    socket.on('move', (state: boolean) => { this_equipment.is_moving = state; });

    socket.on('set-name', (name: string) => { this_equipment.name = `${name} < ${socket.id} >`; });

    // socket.on('boardcast', (data: any) => {
    //     io.emit('boardcast', data);
    // });
});


setInterval(() => {
    rooms.forEach((this_room: RoomInfo) => {
        this_room.shells.forEach((this_shell: AbstractShell, i: number, array: AbstractShell[]) => {
            if (this_shell.update((): boolean => { return this_shell.check_hit(this_room.equipments); })) {
                delete array[i];
            }
        });

        this_room.equipments.forEach((this_equipemt: AbstractEquipment, i: number, array: AbstractEquipment[]) => {
            if (this_equipemt.update()) {
                delete array[i];
            }
        });

        io.to(this_room.room_id).emit('update', {
            shells: this_room.shells,
            equipments: this_room.equipments,
        });
    });
}, Config.tick_speed);

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
