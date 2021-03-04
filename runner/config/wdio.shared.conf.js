exports.config = {
  runner: "local",
  path: "/wd/hub",
  maxInstances: 10,
  maxInstancesPerCapability: 10,
  logLevel: "info",
  logLevels: {
    webdriver: "info",
    "@wdio/applitools-service": "info",
  },
  bail: 1,
  baseUrl: "http://localhost",
  waitforTimeout: 20000,
  filesToWatch: [],
  connectionRetryTimeout: 15000,
  connectionRetryCount: 0,
  framework: "mocha",
  reporters: ["spec"],
  services: [
    // "devtools",
    // ["devtools", { debuggerAddress: "chrome:9222" }],
  ],
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
    bail: true,
  },
};
