# Introduction

The goal of this repository is to succeed at leveraging Docker containers, WebdriverIO, Selenoid, and Chrome DevTools Protocol.

# Setup

First, let's set up a simple environment.

Pull the official selenoid and selenoid-ui images :
```
docker-compose pull
```

Pull the two Chrome images that will/may be used :
```
docker pull cdtp/chrome:89.0
docker pull selenoid/chrome:89.0
```

Run Selenoid and Selenoid-UI in the background :
```
docker-compose up -d
```

Build a small WebdriverIO runner Docker image :
```
docker build -t runner runner
```

# Basic run

Run a simple script that goes to Google :
```
docker run --network wdio --rm -v $(pwd)/runner/src:/src -v $(pwd)/runner/config:/config -v $(pwd)/runner/scripts/script.js:/script.js runner
```

This should work fine and output the following :
```
➜ docker run --network wdio --rm -v $(pwd)/runner/src:/src -v $(pwd)/runner/config:/config -v $(pwd)/runner/scripts/script.js:/script.js runner

> runner@1.0.0 start
> node src/index.js


Execution of 1 spec files started at 2021-03-04T21:23:17.836Z

2021-03-04T21:23:17.845Z INFO @wdio/cli:launcher: Run onPrepare hook
2021-03-04T21:23:17.850Z INFO @wdio/cli:launcher: Run onWorkerStart hook
2021-03-04T21:23:17.852Z INFO @wdio/local-runner: Start worker 0-0 with arg:
[0-0] 2021-03-04T21:23:18.706Z INFO @wdio/local-runner: Run worker command: run
[0-0] RUNNING in chrome - script.js
[0-0] 2021-03-04T21:23:18.989Z INFO webdriver: Initiate new session using the WebDriver protocol
[0-0] 2021-03-04T21:23:18.991Z INFO webdriver: [POST] http://selenoid:4444/wd/hub/session
[0-0] 2021-03-04T21:23:18.991Z INFO webdriver: DATA {
  capabilities: {
    alwaysMatch: {
      browserName: 'chrome',
      browserVersion: '89.0',
      'selenoid:options': {},
      'goog:chromeOptions': [Object]
    },
    firstMatch: [ {} ]
  },
  desiredCapabilities: {
    browserName: 'chrome',
    browserVersion: '89.0',
    'selenoid:options': {},
    'goog:chromeOptions': { args: [Array] }
  }
}
[0-0] 2021-03-04T21:23:20.397Z INFO webdriver: COMMAND navigateTo("http://google.com/")
[0-0] 2021-03-04T21:23:20.398Z INFO webdriver: [POST] http://selenoid:4444/wd/hub/session/4d44d991397c3bb190f4c6a10fc57928/url
[0-0] 2021-03-04T21:23:20.398Z INFO webdriver: DATA { url: 'http://google.com/' }
[0-0] 2021-03-04T21:23:21.151Z INFO webdriver: COMMAND deleteSession()
[0-0] 2021-03-04T21:23:21.151Z INFO webdriver: [DELETE] http://selenoid:4444/wd/hub/session/4d44d991397c3bb190f4c6a10fc57928
[0-0] PASSED in chrome - script.js
2021-03-04T21:23:21.340Z INFO @wdio/cli:launcher: Run onComplete hook

Spec Files:	 1 passed, 1 total (100% completed) in 00:00:03

2021-03-04T21:23:21.341Z INFO @wdio/local-runner: Shutting down spawned worker
2021-03-04T21:23:21.597Z INFO @wdio/local-runner: Waiting for 0 to shut down gracefully
2021-03-04T21:23:21.598Z INFO @wdio/local-runner: shutting down
```

---

# DevTools run #1

Then let's do the following changes in an attempt to run Chrome DevTools Protocol :

Load the modified version of Selenoid :
```
docker load < selenoid_latest
```

And replace `image: aerokube/selenoid:1.10.1` by `image: selenoid:latest` in the `docker-compose.yml` file :
```diff
diff --git i/docker-compose.yml w/docker-compose.yml
index bf17cf2..f110675 100644
--- i/docker-compose.yml
+++ w/docker-compose.yml
@@ -7,8 +7,8 @@ networks:
 services:

   selenoid:
-    image: aerokube/selenoid:1.10.1
-    # image: selenoid:latest
+    # image: aerokube/selenoid:1.10.1
+    image: selenoid:latest
     container_name: selenoid
     volumes:
       - "./selenoid:/etc/selenoid"
```

This will force the Chrome Selenoid container to use a static name (`chrome`) instead of the default random names, allowing us to refer to the browser by its name throughout WebdriverIO's files.

Restart Selenoid :
```
docker-compose up -d
```

Run a more complex script from [WebdriverIO's documentation](https://webdriver.io/docs/devtools-service/#cdp-command) that uses Chrome DevTools Protocol :
```
docker run --network wdio --rm -v $(pwd)/runner/src:/src -v $(pwd)/runner/config:/config -v $(pwd)/runner/scripts/script-cdp.js:/script.js runner
```

This version should fail with
```
TypeError: browser.cdp is not a function
```

---

# DevTools run #2

Let's add the `devtools` service by uncommenting this line in `runner/config/wdio.shared.conf.js` :
```diff
diff --git i/runner/config/wdio.shared.conf.js w/runner/config/wdio.shared.conf.js
index f594afb..aa59a74 100644
--- i/runner/config/wdio.shared.conf.js
+++ w/runner/config/wdio.shared.conf.js
@@ -17,7 +17,7 @@ exports.config = {
   framework: "mocha",
   reporters: ["spec"],
   services: [
-    // "devtools",
+    "devtools",
     // ["devtools", { debuggerAddress: "chrome:9222" }],
   ],
   mochaOpts: {
```

And run the script again :
```
docker run --network wdio --rm -v $(pwd)/runner/src:/src -v $(pwd)/runner/config:/config -v $(pwd)/runner/scripts/script-cdp.js:/script.js runner
```

This time there is another error before the `TypeError: browser.cdp is not a function` one :
```
[0-0] 2021-03-04T21:48:06.423Z ERROR @wdio/sync: FetchError: Failed to fetch browser webSocket URL from http://localhost:9222/json/version: request to http://localhost:9222/json/version failed, reason: connect ECONNREFUSED 127.0.0.1:9222
```
It seems thet WebdriverIO is trying to communicate with a local browser instead of the Chrome container.

---

# Further attempts

At this point, we tried many combinations, including adding the `debuggerAddress` capability :
```diff
diff --git i/runner/src/index.js w/runner/src/index.js
index 22777e5..54ba421 100644
--- i/runner/src/index.js
+++ w/runner/src/index.js
@@ -18,7 +18,7 @@ const wdio = new Launcher(`config/wdio.shared.conf.js`, {
         "--remote-debugging-address=0.0.0.0",
         "--remote-debugging-port=9222",
       ],
-      // debuggerAddress: "chrome:9222",
+      debuggerAddress: "chrome:9222",
     },
   }],
 });
```

Playing with other capabilities :
```diff
diff --git i/runner/src/index.js w/runner/src/index.js
index 22777e5..2d891a4 100644
--- i/runner/src/index.js
+++ w/runner/src/index.js
@@ -13,8 +13,8 @@ const wdio = new Launcher(`config/wdio.shared.conf.js`, {
     "goog:chromeOptions": {
       args: [
         "--headless",
-        // "--no-sandbox",
-        // "--disable-gpu",
+        "--no-sandbox",
+        "--disable-gpu",
         "--remote-debugging-address=0.0.0.0",
         "--remote-debugging-port=9222",
       ],
```

Using a different [Chrome image targeted towards the Chrome Developer Tools Protocol](https://aerokube.com/images/latest/#_chrome_developer_tools_protocol) :
```diff
diff --git i/runner/src/index.js w/runner/src/index.js
index 22777e5..063a7a7 100644
--- i/runner/src/index.js
+++ w/runner/src/index.js
@@ -6,8 +6,8 @@ const wdio = new Launcher(`config/wdio.shared.conf.js`, {
   port: 4444,
   capabilities: [{
     browserName: "chrome",
-    browserVersion: "89.0",
-    // browserVersion: "cdtp-89.0",
+    // browserVersion: "89.0",
+    browserVersion: "cdtp-89.0",
     "selenoid:options": {
     },
     "goog:chromeOptions": {
```

And changing the `devtools` service's configuration :
```diff
diff --git i/runner/config/wdio.shared.conf.js w/runner/config/wdio.shared.conf.js
index f594afb..b339a21 100644
--- i/runner/config/wdio.shared.conf.js
+++ w/runner/config/wdio.shared.conf.js
@@ -18,7 +18,7 @@ exports.config = {
   reporters: ["spec"],
   services: [
     // "devtools",
-    // ["devtools", { debuggerAddress: "chrome:9222" }],
+    ["devtools", { debuggerAddress: "chrome:9222" }],
   ],
   mochaOpts: {
     ui: "bdd",
```

Without any success.