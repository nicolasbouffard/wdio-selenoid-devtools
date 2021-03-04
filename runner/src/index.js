const Launcher = require('@wdio/cli').default

const wdio = new Launcher(`config/wdio.shared.conf.js`, {
  specs: ["script.js"],
  hostname: "selenoid",
  port: 4444,
  capabilities: [{
    browserName: "chrome",
    browserVersion: "89.0",
    // browserVersion: "cdtp-89.0",
    "selenoid:options": {
    },
    "goog:chromeOptions": {
      args: [
        "--headless",
        // "--no-sandbox",
        // "--disable-gpu",
        "--remote-debugging-address=0.0.0.0",
        "--remote-debugging-port=9222",
      ],
      // debuggerAddress: "chrome:9222",
    },
  }],
});

wdio.run().then(
  (code) => {
    process.exit(code);
  },
  (error) => {
    console.error("Launcher failed to start the test", error.stacktrace);
    process.exit(1);
  }
);
