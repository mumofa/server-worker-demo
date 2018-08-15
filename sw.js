const CHECK_CRASH_INTERVAL = 10 * 1000; // 每 10s 检查一次
const CRASH_THRESHOLD = 15 * 1000; // 15s 超过15s没有心跳则认为已经 crash
const pages = {};
let timer;

function checkCrash() {
    const now = Date.now();
    for (var id in pages) {
        let page = pages[id];
        if ((now - page.t) > CRASH_THRESHOLD) {
            // 上报 crash
            delete pages[id];
        }
    }
    if (Object.keys(pages).length == 0) {
        clearInterval(timer);
        timer = null;
    }
}

worker.addEventListener('message', (e) => {
    const data = e.data;
    if (data.type === 'heartbeat') {
        pages[data.id] = {
            t: Date.now()
        }
        if (!timer) {
            timer = setInterval(function () {
                checkCrash();
            }, CHECK_CRASH_INTERVAL);
        }
    } else if (data.type === 'unload') {
        delete pages[data.id];
    }
});