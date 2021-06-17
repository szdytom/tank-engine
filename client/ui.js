const ctx = document.getElementById('board').getContext('2d');

function draw() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, config.width, config.height);

    for (let i in game_state.tanks) {
        const e = game_state.tanks[i];
        if (e == null) {
            continue;
        }

        if (e.id == tank_controller.id) {
            ctx.fillStyle = 'green';
        } else {
            ctx.fillStyle = 'yellow';
        }

        let vertex = rect_xy(e.x, e.y, e.angle, config.tank.size);
        ctx.beginPath();
        ctx.moveTo(vertex[0][0], vertex[0][1]);
        ctx.lineTo(vertex[1][0], vertex[1][1]);
        ctx.lineTo(vertex[2][0], vertex[2][1]);
        ctx.lineTo(vertex[3][0], vertex[3][1]);
        ctx.fill();

        ctx.fillStyle = 'black';
        ctx.fillText(`${e.id}: ${Math.round(e.blood)}`, e.x - 20, e.y);
    }

    for (let i in game_state.shells) {
        const e = game_state.shells[i];

        ctx.fillStyle = 'black';
        ctx.strockStyle = 'black';
        if (e.level == 0) {
            ctx.strokeRect(e.x - 4, e.y - 4, 8, 8);
        } else {
            ctx.fillRect(e.x - 4, e.y - 4, 8, 8);
        }
    }
}