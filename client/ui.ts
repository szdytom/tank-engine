import $ = require('jquery');
import game_runtime_info from './global';
import Config from '../shared/config';

let gre = game_runtime_info.get_instance();

export default function () {
    let this_equipment = gre.get_equipment(gre.socket.id);
    $('#data-move-angle').text(this_equipment.angle.main);
    $('#data-gun-angle').text(this_equipment.angle.gun);
    $('#data-radar-angle').text(this_equipment.angle.radar);
    $('#data-pos-x').text(this_equipment.pos.x.toString());
    $('#data-pos-y').text(this_equipment.pos.y.toString());
    $('#data-time-to-fire').text(this_equipment.time_to_fire.toString());
    $('#data-blood').text((this_equipment.blood).toString());

    const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('space');;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

    ctx.clearRect(0, 0, Config.space.width, Config.space.height);

    ctx.fillStyle = 'brown';
    const bullect_draw_size = 4;
    gre.shells.forEach((this_shell) => {
        if (this_shell.level > 0) {
            ctx.fillRect(
                Math.floor(this_shell.pos.x - bullect_draw_size / 2),
                Math.floor(this_shell.pos.y - bullect_draw_size / 2),
                bullect_draw_size,
                bullect_draw_size);
        } else {
            ctx.strokeRect(
                Math.floor(this_shell.pos.x - bullect_draw_size / 2),
                Math.floor(this_shell.pos.y - bullect_draw_size / 2),
                bullect_draw_size,
                bullect_draw_size);
        }
    });

    gre.equipments.forEach((this_equipment) => {
        let equipment_size: number = Config.equipments[this_equipment.type].size;

        if (this_equipment.id === gre.socket.id) { ctx.fillStyle = 'green'; }
        else { ctx.fillStyle = 'orange'; }

        ctx.fillRect(
            Math.floor(this_equipment.pos.x - equipment_size / 2),
            Math.floor(this_equipment.pos.y - equipment_size / 2),
            equipment_size,
            equipment_size);

        ctx.fillStyle = 'black';
        ctx.fillText(
            Math.ceil(this_equipment.blood).toString(),
            Math.floor(this_equipment.pos.x),
            Math.floor(this_equipment.pos.y),
            40);
    });
};