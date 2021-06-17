function covert_degree(x) {
    return x * Math.PI / 180;
};

function update_pos_x(angle, dis) {
    return dis * Math.cos(covert_degree(angle));
};

function update_pos_y(angle, dis) {
    return dis * Math.sin(covert_degree(angle));
};

function vector_add(a, b) {
    return a.map((x, i) => {
        return x + b[i];
    });
};

function rect_xy(cx, cy, angle, size) {
    size /= 2;

    function rotate(x, y) {
        const c = Math.cos(covert_degree(angle));
        const s = Math.sin(covert_degree(angle));
        return [
            x * c - y * s, x * s + y * c
        ];
    }

    return [
        vector_add(rotate(size, size), [cx, cy]),
        vector_add(rotate(-size, size), [cx, cy]),
        vector_add(rotate(-size, -size), [cx, cy]),
        vector_add(rotate(size, -size), [cx, cy]),
    ];
};

function cross_product(A, B, C) {
    return (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]);
}

function check_line_crash(A, B) {
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