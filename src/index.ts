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
        t: tanks.map(x => x.pack()),
        s: shells,
    };
}

io.on('connection', (socket) => {
    console.log(`Client Connect: ${socket.id} @ ${socket.handshake.address}.`);

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
        tank.kill();
        tank = null;
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
    for (let i in shells) {
        shells[i].update(tanks);
        if (!shells[i].is_alive()) {
            delete shells[i];
        }
    }

    for (let t of tanks) {
        t.update();
    }

    for (let i in tanks) {
        if (!tanks[i].is_alive()) {
            delete tanks[i];
        }
    }
}, config.tick_speed);

setInterval(() => {
    io.emit('sync-game', pack_data());
}, config.tick_speed * config.sync_speed);

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
