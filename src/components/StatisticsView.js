// Statistics View Component
import API_CONFIG from '../assets/js/config.js';

export default {
  template: `
    <div>
      <h2>Flight Statistics</h2>
      <div v-if="loading" class="loading">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else>
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-primary text-white">
                Overall Statistics
              </div>
              <div class="card-body">
                <div class="list-group">
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    Total Flights
                    <span class="badge bg-primary rounded-pill">{{ statistics.totalFlights }}</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    Total Flight Duration
                    <span class="badge bg-primary rounded-pill">{{ formatDuration(statistics.totalDuration) }}</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    Total Airports Visited
                    <span class="badge bg-primary rounded-pill">{{ statistics.totalAirports }}</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    Total Countries Visited
                    <span class="badge bg-primary rounded-pill">{{ statistics.totalCountries }}</span>
                  </div>
                  <div class="list-group-item d-flex justify-content-between align-items-center">
                    Total Continents Visited
                    <span class="badge bg-primary rounded-pill">{{ statistics.totalContinents }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-success text-white">
                Annual Statistics
              </div>
              <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                <div class="list-group">
                  <div v-for="(year, index) in yearlyStats" :key="index" class="list-group-item">
                    <div class="d-flex justify-content-between">
                      <strong>{{ year.year }}</strong>
                      <span>{{ year.count }} flights</span>
                    </div>
                    <div class="d-flex justify-content-between">
                      <small>Total Duration:</small>
                      <small>{{ formatDuration(year.duration) }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-info text-white">
                Flights Per Year
              </div>
              <div class="card-body">
                <canvas id="flightsPerYearChart"></canvas>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card">
              <div class="card-header bg-warning text-dark">
                Flights Per Month
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="yearSelect" class="form-label">Select Year:</label>
                  <select id="yearSelect" class="form-select" v-model="selectedYear" @change="updateMonthlyChart">
                    <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                  </select>
                </div>
                <canvas id="flightsPerMonthChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div class="row mb-4">
          <div class="col-md-12">
            <div class="card">
              <div class="card-header bg-secondary text-white">
                Aircraft Types
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Aircraft Type</th>
                        <th>Manufacturer</th>
                        <th>Model</th>
                        <th>Number of Flights</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="aircraft in sortedAircraftStats" :key="aircraft.code">
                        <td>{{ aircraft.code }}</td>
                        <td>{{ aircraft.manufacturer || 'Unknown' }}</td>
                        <td>{{ aircraft.model || 'Unknown' }}</td>
                        <td>{{ aircraft.flightCount }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row mb-4">
          <div class="col-md-12">
            <div class="card">
              <div class="card-header bg-info text-white">
                Countries Visited
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th>Country</th>
                        <th>Number of Visits</th>
                        <th>Percentage of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="country in sortedCountryStats" :key="country.name">
                        <td>{{ country.name }}</td>
                        <td>{{ country.visits }}</td>
                        <td>{{ formatPercentage(country.visits) }}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      flights: [],
      statistics: {
        totalFlights: 0,
        totalDuration: 0,
        totalAirports: 0,
        totalCountries: 0,
        totalContinents: 0
      },
      yearlyStats: [],
      loading: true,
      apiBaseUrl: API_CONFIG.getBaseUrl(),
      yearlyChartInstance: null,
      monthlyChartInstance: null,
      selectedYear: null,
      availableYears: [],
      aircraftStats: {},
      countryStats: {},
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ]
    };
  },
  computed: {
    sortedCountryStats() {
      return Object.entries(this.countryStats)
        .map(([name, visits]) => ({ name, visits }))
        .sort((a, b) => b.visits - a.visits);
    },
    sortedAircraftStats() {
      return Object.entries(this.aircraftStats)
        .map(([code, data]) => ({
          code,
          manufacturer: data.manufacturer,
          model: data.model,
          flightCount: data.flightCount
        }))
        .sort((a, b) => b.flightCount - a.flightCount);
    }
  },
  mounted() {
    this.fetchFlights();
    this.loadChartJsScript();
  },
  methods: {
    loadChartJsScript() {
      if (typeof Chart !== 'undefined') {
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => console.log('Chart.js loaded');
      document.head.appendChild(script);
    },
    fetchFlights() {
      this.loading = true;
      axios.get(`${this.apiBaseUrl}/flights`)
        .then(response => {
          this.flights = response.data;
          this.calculateStatistics()
            .then(() => {
              this.loading = false;
              this.$nextTick(() => {
                this.renderCharts();
              });
            });
        })
        .catch(error => {
          console.error('Error fetching flights:', error);
          this.loading = false;
        });
    },
    calculateStatistics() {
      return new Promise((resolve) => {
        const airports = new Set();
        const countries = new Set();
        const continents = new Set();
        let totalDuration = 0;
        
        // Reset country stats
        this.countryStats = {};
        
        // Group flights by year and collect aircraft types
        const flightsByYear = {};
        const aircraftCounts = {};
        
        // Process each flight
        const aircraftPromises = this.flights.map(flight => {
          if (!flight.departure_time || !flight.arrival_time) return Promise.resolve();
          
          const departureDate = new Date(flight.departure_time);
          const arrivalDate = new Date(flight.arrival_time);
          const year = departureDate.getFullYear();
          const month = departureDate.getMonth();
          
          // Calculate duration in hours
          const duration = (arrivalDate - departureDate) / (1000 * 60 * 60);
          totalDuration += duration;
          
          // Add airports, countries and continents
          if (flight.origin_airport) {
            airports.add(flight.origin_airport.name);
            if (flight.origin_airport.continent) {
              continents.add(flight.origin_airport.continent);
            }
          }
          if (flight.destination_airport) {
            airports.add(flight.destination_airport.name);
            if (flight.destination_airport.country) {
              countries.add(flight.destination_airport.country);
              this.countryStats[flight.destination_airport.country] = (this.countryStats[flight.destination_airport.country] || 0) + 1;
            }
            if (flight.destination_airport.continent) {
              continents.add(flight.destination_airport.continent);
            }
          }
          
          // Group by year for yearly stats
          if (!flightsByYear[year]) {
            flightsByYear[year] = { 
              count: 0, 
              duration: 0,
              byMonth: Array(12).fill(0)
            };
          }
          
          flightsByYear[year].count++;
          flightsByYear[year].duration += duration;
          flightsByYear[year].byMonth[month]++;

          // Count aircraft types
          if (flight.aircraft) {
            if (!aircraftCounts[flight.aircraft]) {
              aircraftCounts[flight.aircraft] = { flightCount: 0 };
            }
            aircraftCounts[flight.aircraft].flightCount++;
            
            // If we haven't fetched details yet, do it now
            if (!aircraftCounts[flight.aircraft].manufacturer) {
              return fetch(`${this.apiBaseUrl}/aircraft/${flight.aircraft}`)
                .then(response => response.json())
                .then(data => {
                  aircraftCounts[flight.aircraft] = {
                    ...aircraftCounts[flight.aircraft],
                    manufacturer: data.manufacturer,
                    model: data.model
                  };
                })
                .catch(() => {
                  // Keep the existing count even if fetch fails
                });
            }
          }
          return Promise.resolve();
        });

        // Wait for all aircraft details to be fetched
        Promise.all(aircraftPromises).then(() => {
          this.aircraftStats = aircraftCounts;

          // Convert to sorted array
          this.yearlyStats = Object.keys(flightsByYear)
            .map(year => ({
              year: parseInt(year),
              count: flightsByYear[year].count,
              duration: flightsByYear[year].duration,
              byMonth: flightsByYear[year].byMonth
            }))
            .sort((a, b) => b.year - a.year);
          
          // Set available years and default selected year
          this.availableYears = this.yearlyStats.map(stat => stat.year);
          this.selectedYear = this.availableYears.length > 0 ? this.availableYears[0] : null;
          
          // Update statistics object
          this.statistics.totalFlights = this.flights.length;
          this.statistics.totalDuration = totalDuration;
          this.statistics.totalAirports = airports.size;
          this.statistics.totalCountries = countries.size;
          this.statistics.totalContinents = continents.size;

          resolve();
        });
      });
    },
    formatDuration(hours) {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      const minutes = Math.floor((hours % 1) * 60);
      
      let result = '';
      if (days > 0) result += `${days}d `;
      if (remainingHours > 0 || days > 0) result += `${remainingHours}h `;
      result += `${minutes}m`;
      
      return result;
    },
    formatPercentage(visits) {
      const total = this.flights.length; // Only counting destinations now
      return ((visits / total) * 100).toFixed(1);
    },
    renderCharts() {
      this.renderYearlyChart();
      this.updateMonthlyChart();
    },
    renderYearlyChart() {
      // Make sure Chart.js is loaded
      if (typeof Chart === 'undefined') {
        setTimeout(() => this.renderYearlyChart(), 500);
        return;
      }
      
      const ctx = document.getElementById('flightsPerYearChart');
      
      // Sort years chronologically for the chart
      const sortedYearlyStats = [...this.yearlyStats].sort((a, b) => a.year - b.year);
      
      const data = {
        labels: sortedYearlyStats.map(stat => stat.year),
        datasets: [{
          label: 'Number of Flights',
          data: sortedYearlyStats.map(stat => stat.count),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }]
      };
      
      // Destroy previous chart if it exists
      if (this.yearlyChartInstance) {
        this.yearlyChartInstance.destroy();
      }
      
      this.yearlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    },
    updateMonthlyChart() {
      // Make sure Chart.js is loaded
      if (typeof Chart === 'undefined' || !this.selectedYear) {
        setTimeout(() => this.updateMonthlyChart(), 500);
        return;
      }
      
      const ctx = document.getElementById('flightsPerMonthChart');
      
      // Find the data for the selected year
      const yearData = this.yearlyStats.find(stat => stat.year === this.selectedYear);
      const monthlyData = yearData ? yearData.byMonth : Array(12).fill(0);
      
      const data = {
        labels: this.monthNames,
        datasets: [{
          label: `Flights in ${this.selectedYear}`,
          data: monthlyData,
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
          borderColor: 'rgb(255, 159, 64)',
          borderWidth: 1
        }]
      };
      
      // Destroy previous chart if it exists
      if (this.monthlyChartInstance) {
        this.monthlyChartInstance.destroy();
      }
      
      this.monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  }
};