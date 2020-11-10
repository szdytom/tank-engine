import Config from "./config";

function covert_degree(x: number): number {
    return x * Math.PI / 180;
}

function get_random_direction(): number {
    return (Math.random() * 720) % 360;
}

function get_random_position(): { x: number, y: number } {
    return {
        x: (Math.random() * 100000) % Config.space.width,
        y: (Math.random() * 100000) % Config.space.height,
    };
}

function get_line_slope(d: number): number {
    return 1 / Math.tan(covert_degree(d));
}

export {
    covert_degree,
    get_random_direction,
    get_random_position,
    get_line_slope
};