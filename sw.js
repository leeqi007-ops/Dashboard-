/* 合併資產儀表板 Service Worker */
var CACHE = "wx-pwa-v1";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c){ return c.addAll(ASSETS); })
      .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys()
      .then(function(keys){
        return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
      })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  var url = new URL(req.url);
  if(url.origin !== location.origin) return;   // Firebase、報價、字型等外部請求不攔截

  if(req.mode === "navigate"){
    // 開啟頁面：先抓網路（確保拿到最新版），離線時退回快取
    e.respondWith(
      fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put("./index.html", cp); });
        return r;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  // 圖示等靜態檔：快取優先
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(r){
        var cp = r.clone();
        caches.open(CACHE).then(function(c){ c.put(req, cp); });
        return r;
      });
    })
  );
});
