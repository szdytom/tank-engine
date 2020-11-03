import Bullet from "../shared/bullet";
import Tank from "../shared/tanks";
import 'socket.io-client';

let bullets: Bullet[];
let tanks: Tank[];
let socket: SocketIOClient.Socket;

function set_socket(value: SocketIOClient.Socket) {
    socket = value;
}

function set_tanks(value: Tank[]) {
    tanks = value;
}

function set_bullets(value: Bullet[]) {
    bullets = value
}

export {bullets, tanks, socket, set_bullets, set_socket, set_tanks};