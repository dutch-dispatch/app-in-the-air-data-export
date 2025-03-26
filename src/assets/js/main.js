// Main Vue.js application entry point
import FlightView from '../../components/FlightView.js';
import StatisticsView from '../../components/StatisticsView.js';

// Define routes
const routes = [
  { path: '/', redirect: '/flights' },
  { path: '/flights', component: FlightView },
  { path: '/statistics', component: StatisticsView }
];

// Create router instance
const router = new VueRouter({
  routes
});

// Create and mount the Vue application
new Vue({
  el: '#app',
  router,
  data: {
    apiBaseUrl: 'http://localhost:3000/api'
  }
});