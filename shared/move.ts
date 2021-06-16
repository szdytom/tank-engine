export function covert_degree(x: number): number {
    return x * Math.PI / 180;
};

export function update_pos_x(angle: number, dis: number): number {
    return dis * Math.cos(covert_degree(angle));
};

export function update_pos_y(angle: number, dis: number): number {
    return dis * Math.sin(covert_degree(angle));
};

function vector_add(a: number[], b: number[]): number[] {
    return a.map((x, i) => {
        return x + b[i];
    });
};

export function rect_xy(cx: number, cy: number, angle: number, size: number): number[][] {
    function rotate(x: number, y: number) {
        const c = Math.cos(covert_degree(angle));
        const s = Math.sin(covert_degree(angle));
        return [
            x * c - y * s, x * s + y * c
        ];
    }

    return [
        vector_add(rotate(size, size), [cx, cy]),
        vector_add(rotate(-size, size), [cx, cy]),
        vector_add(rotate(size, -size), [cx, cy]),
        vector_add(rotate(-size, -size), [cx, cy]),
    ];
};

function cross_product(A: number[], B: number[], C: number[]) {
    return (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
}

export function check_line_crash(A: number[][], B: number[][]) {
    if (Math.max(A[0][0], A[1][0]) < Math.min(B[0][0], B[1][0]) || Math.min(A[0][0], A[1][0]) > Math.max(B[0][0], B[1][0])
        || Math.max(A[0][1], A[1][1]) < Math.min(B[0][0], B[1][0]) || Math.min(A[0][1], B[1][1]) > Math.max(B[0][1], B[1][1])) {
        return false;
    }

    if (cross_product(B[0], A[0], A[1]) * cross_product(B[1], A[0], A[1]) <= 0
        && cross_product(A[0], B[0], B[1]) * cross_product(A[1], B[0], B[1]) <= 0) {
        return true;
    }

    return false;
};