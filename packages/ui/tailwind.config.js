const sharedConfig = require('../../apps/frontend-web/tailwind.config');

module.exports = {
  ...sharedConfig,
  content: ['./src/**/*.{js,ts,jsx,tsx}', ...sharedConfig.content],
};
