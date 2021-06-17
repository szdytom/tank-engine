import SocketIO = require('socket.io');
import Express = require('express');
import http_server = require('http');
import path = require('path');
import { Tank } from './tank';
import { Shell } from './shell';
import config from '../shared/config';

const app = Express();
const http = new http_server.Server(app);
const io = new SocketIO.Server(http);

let shells: Shell[] = [];
let tanks: Tank[] = [];

function pack_data() {
    return {
        t: tanks,
        s: shells,
    };
}

io.on('connection', (socket) => {
    console.log(`Client connect: ${socket.id} @ ${socket.handshake.address}.`);

    let tank: Tank = null;

    socket.on('start', () => {
        if (tank != null) {
            return;
        }

        tank = new Tank(socket.id);
        tanks.push(tank);
        socket.emit('started', tank.id);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnect: ${socket.id}.`);
        if (tank != null) {
            tank.kill();
            tank = null;
        }
    });

    socket.on('move', (state: boolean) => {
        if (tank == null || !tank.is_alive()) {
            return;
        }

        tank.move(state);
    });

    socket.on('fire', (level: number) => {
        if (tank == null || !tank.is_alive()) {
            return;
        }

        if (tank.try_fire()) {
            shells.push(new Shell(level, tank.x, tank.y, tank.gun_angle, tank.id));
            tank.heat += config.shell.heat[level];
        }
    });

    socket.on('turn', (type: string, target: number) => {
        if (tank == null || !tank.is_alive()) {
            return;
        }

        tank.turn_to(type, target % 360);
    });
});

setInterval(() => {
    for (let e of shells) {
        if (e == null) { continue; }
        e.update(tanks);
    }

    for (let t of tanks) {
        if (t != null) {
            t.update();
        }
    }

    let next_tk: Tank[] = [];
    for (let t of tanks) {
        if (t.is_alive()) {
            next_tk.push(t);
        }
    }
    tanks = next_tk;

    let next_shells: Shell[] = [];
    for (let e of shells) {
        if (e.is_alive()) {
            next_shells.push(e);
        }
    }
    shells = next_shells;
    io.emit('sync-game', pack_data());
}, config.tick_speed);

app.use('/', Express.static(path.join(__dirname, '../client')));
app.use('/shared', Express.static(path.join(__dirname, '../shared')));

const server_port = 3000;
http.listen(server_port, () => {
    console.log(`Server start @ port ${server_port}.`);

    process.on('SIGINT', () => {
        console.log(`Stop server. Please wait...`);
        io.disconnectSockets();
        http.close();
        process.exit();
    });
});
