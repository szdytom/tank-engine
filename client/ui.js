const ctx = document.getElementById('board').getContext('2d');

function draw() {
    ctx.fillStyle = 'white';
    ctx.fillReact(0, 0, config.width, config.height);

    for (let i in game_state.tanks) {
        const e = game_state.tanks[i];
        if (game_state.tanks.id == tank_controller.id) {
            ctx.fillStyle = 'green';
        } else {
            ctx.fillStyle = 'yellow';
        }

        let vertex = rect_xy(e.x, e.y, e.angle, config.tanks.size);
        ctx.beginPath();
        ctx.moveTo(vertex[0][0], vertex[0][1]);
        ctx.lineTo(vertex[1][0], vertex[1][1]);
        ctx.lineTo(vertex[2][0], vertex[2][1]);
        ctx.lineTo(vertex[3][0], vertex[3][1]);
        ctx.fill();
    }

    for (let i in game_state.shells) {
        const e = game_state.shells[i];

        ctx.fillStyle = 'black';
        ctx.strockStyle = 'black';
        if (e.level == 0) {
            ctx.strockRect(e.x - 1, e.x - 1, 2, 2);
        } else {
            ctx.fillRect(e.x - 1, e.x - 1, 2, 2);
        }
    }
}