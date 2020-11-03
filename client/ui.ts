import {tanks, bullets, socket} from './global';
import Config from '../shared/config';

export default function () {
    const canvas = <HTMLCanvasElement>document.getElementById('space');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, Config.space.width, Config.space.height);
    
    ctx.fillStyle = "brown";
    const bullect_draw_size = 5;
    for (let id in bullets) {
        let this_bullet = bullets[id];
        if (this_bullet.level > 0) {
            ctx.fillRect(
                this_bullet.pos.x - bullect_draw_size / 2, 
                this_bullet.pos.y - bullect_draw_size / 2, 
                bullect_draw_size, 
                bullect_draw_size);
        } else {
            ctx.strokeRect(
                this_bullet.pos.x - bullect_draw_size / 2, 
                this_bullet.pos.y - bullect_draw_size / 2, 
                bullect_draw_size, 
                bullect_draw_size);
        }
    }

    for (let id in tanks) {
        let this_tank = tanks[id];
        if (id === socket.id) { ctx.fillStyle = "green"; }
        else { ctx.fillStyle = "orange"; }

        ctx.fillRect(this_tank.pos.x - Config.tanks.size / 2,
            this_tank.pos.y - Config.tanks.size / 2,
            Config.tanks.size,
            Config.tanks.size);

        ctx.fillStyle = "black";
        ctx.fillText(Math.ceil(this_tank.blood * 100).toString() + '%', this_tank.pos.x, this_tank.pos.y);
    }
};