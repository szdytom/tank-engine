import $ = require('jquery');
import { tanks, bullets, socket } from './global';
import Config from '../shared/config';
import Tank from '../shared/tanks';

export default function () {
    let this_tank: Tank = tanks[socket.id];
    $('#data-move-angle').text(this_tank.angle.tank);
    $('#data-gun-angle').text(this_tank.angle.gun);
    $('#data-radar-angle').text(this_tank.angle.radar);
    $('#data-pos-x').text(this_tank.pos.x.toString());
    $('#data-pos-y').text(this_tank.pos.y.toString());
    $('#data-time-to-fire').text(this_tank.time_to_fire.toString());
    $('#data-blood').text(this_tank.blood.toString());

    const canvas = <HTMLCanvasElement>document.getElementById('space');
    const ctx = canvas.getContext('2d', { alpha: false });

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, Config.space.width, Config.space.height);

    ctx.fillStyle = "brown";
    const bullect_draw_size = 4;
    for (let id in bullets) {
        let this_bullet = bullets[id];
        if (this_bullet.level > 0) {
            ctx.fillRect(
                Math.floor(this_bullet.pos.x - bullect_draw_size / 2),
                Math.floor(this_bullet.pos.y - bullect_draw_size / 2),
                bullect_draw_size,
                bullect_draw_size);
        } else {
            ctx.strokeRect(
                Math.floor(this_bullet.pos.x - bullect_draw_size / 2),
                Math.floor(this_bullet.pos.y - bullect_draw_size / 2),
                bullect_draw_size,
                bullect_draw_size);
        }
    }

    for (let id in tanks) {
        let this_tank = tanks[id];
        if (id === socket.id) { ctx.fillStyle = "green"; }
        else { ctx.fillStyle = "orange"; }

        ctx.fillRect(
            Math.floor(this_tank.pos.x - Config.tanks.size / 2),
            Math.floor(this_tank.pos.y - Config.tanks.size / 2),
            Config.tanks.size,
            Config.tanks.size);

        ctx.fillStyle = "black";
        ctx.fillText(
            Math.ceil(this_tank.blood * 100).toString() + '%', 
            Math.floor(this_tank.pos.x), 
            Math.floor(this_tank.pos.y));
    }
};