module.exports = {
  baseUrl: "http://localhost:3000",
  sets: {
    desktop: {
      files: "test/hermione",
    },
  },

  browsers: {
    chrome: {
      automationProtocol: "devtools",
      desiredCapabilities: {
        browserName: "chrome",
      },
    },
  },
  plugins: {
    "html-reporter/hermione": {
      enabled: true,
    },
  },
};
