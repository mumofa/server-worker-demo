const CHECK_CRASH_INTERVAL = 10 * 1000; // 每 10s 检查一次
const CRASH_THRESHOLD = 15 * 1000; // 15s 超过15s没有心跳则认为已经 crash
const pages = {};
const crashPages = [];
let timer;

function checkCrash(data) {
    const now = Date.now();
    for (var id in pages) {
        let page = pages[id];
        if ((now - page.t) > CRASH_THRESHOLD) {
            // 上报 crash
            crashPages.push(data);
            delete pages[id];
        }
    }
    if (Object.keys(pages).length == 0) {
        clearInterval(timer);
        timer = null;
    }
}

self.addEventListener('install', function (e) {
    console.log("安装完毕");
    // 说明有崩溃页面记录
    if (crashPages.length > 0) {
        console.log("有崩溃页面记录");
        self.clients.matchAll().then(function (clients) {
            clients.forEach(function (client) {
                crashPages.forEach(item => {
                    client.postMessage({
                        ...item,
                        type: "crash",
                        message: '之前的页面崩溃了'
                    });
                });
            })
        })
    }
})
self.addEventListener('activate', function (e) {
    console.log("激活完毕");
    // 说明有崩溃页面记录
})

self.addEventListener('message', (e) => {
    const data = e.data;
    if (data.type === 'heartbeat') {
        pages[data.id] = {
            t: Date.now()
        }
        if (!timer) {
            timer = setInterval(function () {
                checkCrash(data.data);
            }, CHECK_CRASH_INTERVAL);
        }

        self.clients.matchAll().then(function (clients) {
            clients.forEach(function (client) {
                if (crashPages.length > 0) {
                    console.log("有崩溃页面记录");
                    crashPages.forEach(item => {
                        client.postMessage({
                            ...item,
                            type: "crash",
                            message: '之前的页面崩溃了'
                        });
                    });
                } else {
                    client.postMessage({
                        command: 'broadcastOnRequest',
                        message: '接收到心跳信息'
                    });
                }
            })
        })
    } else if (data.type === 'unload') {
        delete pages[data.id];
    }
});

// var VERSION = 'v1';

// // 缓存
// self.addEventListener('install', function(event) {
//   event.waitUntil(
//     caches.open(VERSION).then(function(cache) {
//       return cache.addAll([
//         './start.html',
//         './static/jquery.min.js',
//         './static/mm1.jpg'
//       ]);
//     })
//   );
// });

// // 缓存更新
// self.addEventListener('activate', function(event) {
//   event.waitUntil(
//     caches.keys().then(function(cacheNames) {
//       return Promise.all(
//         cacheNames.map(function(cacheName) {
//           // 如果当前版本和缓存版本不一致
//           if (cacheName !== VERSION) {
//             return caches.delete(cacheName);
//           }
//         })
//       );
//     })
//   );
// });

// // 捕获请求并返回缓存数据
// self.addEventListener('fetch', function(event) {
//   event.respondWith(caches.match(event.request).catch(function() {
//     return fetch(event.request);
//   }).then(function(response) {
//     caches.open(VERSION).then(function(cache) {
//       cache.put(event.request, response);
//     });
//     return response.clone();
//   }).catch(function() {
//     return caches.match('./static/mm1.jpg');
//   }));
// });