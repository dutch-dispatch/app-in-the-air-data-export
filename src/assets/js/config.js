// API Configuration
const API_CONFIG = {
  getBaseUrl: function() {
    // Get the current server host and port
    const host = window.location.hostname;
    const port = window.location.port;
    return `http://${host}:${port}/api`;
  }
};

export default API_CONFIG;