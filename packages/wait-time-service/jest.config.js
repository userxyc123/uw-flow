const base = require("../../jest.config.base");
module.exports = {
  ...base,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
