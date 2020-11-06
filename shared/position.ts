import { covert_degree } from './Lfunctions';
import Config from './config';

class Position {
    x: number
    y: number

    constructor(info: { x: number, y: number }) {
        this.x = info.x;
        this.y = info.y;
    }

    update(angle: number, distance: number): void {
        this.x += distance * Math.cos(covert_degree(angle));
        this.y += distance * Math.sin(covert_degree(angle));
    }

    clone() {
        return new Position({ x: this.x, y: this.y });
    }
}

export default Position;