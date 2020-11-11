let iid_list = new Array<NodeJS.Timeout>();

function add(t: NodeJS.Timeout): number {
    iid_list.push(t);
    return iid_list.length - 1;
}

function stop(id: number): void {
    clearInterval(iid_list[id]);
    delete iid_list[id];
}

export {
    add as addTimeout,
    stop as stopTimeout,
};