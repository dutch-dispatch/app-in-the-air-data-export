// Flight View Component
import API_CONFIG from '../assets/js/config.js';

export default {
  template: `
    <div class="flight-view-container">
      <div class="flight-table-section">
        <h2>Flight Information</h2>
        <div v-if="loading" class="loading">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else class="table-container">
          <div class="mb-3">
            <input 
              type="text" 
              class="form-control" 
              v-model="searchQuery" 
              placeholder="Search by airline, flight number, origin, or destination..." 
              @input="filterFlights"
            >
          </div>
          <table class="table table-striped table-bordered">
            <thead class="table-dark">
              <tr>
                <th>Airline</th>
                <th>Flight #</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Departure</th>
                <th>Arrival</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="flight in filteredFlights" 
                  :key="flight.id" 
                  @click="selectFlight(flight)"
                  :class="{ 'selected-flight': selectedFlight && selectedFlight.id === flight.id }">
                <td>{{ flight.airline_code }}</td>
                <td>{{ flight.flight_number }}</td>
                <td>{{ flight.origin }}</td>
                <td>{{ flight.destination }}</td>
                <td>{{ formatDate(flight.departure_time) }}</td>
                <td>{{ formatDate(flight.arrival_time) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredFlights.length === 0 && !loading" class="alert alert-info">
            No flights match your search criteria.
          </div>
          <div class="pagination-info">
            Showing {{ filteredFlights.length }} of {{ allFlights.length }} flights
          </div>
        </div>
      </div>

      <div class="flight-details-section">
        <div v-if="selectedFlight" class="flight-details">
          <h3>Flight Details</h3>
          <div class="map-container" ref="mapContainer"></div>
          <div class="flight-info">
            <h4>{{ selectedFlight.airline_code }}{{ selectedFlight.flight_number }}</h4>
            <div class="flight-details-card">
              <p class="time-of-day">{{ getTimeOfDay(selectedFlight.departure_time) }} flight</p>
              <p class="date">📅 {{ formatDetailDate(selectedFlight.departure_time) }}</p>
              <p class="airport departure">🛫 {{ selectedFlight.origin_airport?.name || selectedFlight.origin }}</p>
              <p class="airport arrival">🛬 {{ selectedFlight.destination_airport?.name || selectedFlight.destination }}</p>
              <div class="flight-metadata">
                <p class="duration">⏱️ {{ calculateDuration(selectedFlight.departure_time, selectedFlight.arrival_time) }}</p>
                <p class="aircraft">✈️ {{ getAircraftName(selectedFlight.aircraft) || 'N/A' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-flight-selected">
          <p>Select a flight to view details</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      allFlights: [],
      filteredFlights: [],
      loading: true,
      searchQuery: '',
      apiBaseUrl: API_CONFIG.getBaseUrl(),
      selectedFlight: null,
      map: null,
      flightPath: null,
      markers: [],
      aircraftData: {} // New property to store aircraft information
    };
  },

  mounted() {
    this.fetchFlights();
  },

  methods: {
    fetchFlights() {
      this.loading = true;
      axios.get(`${this.apiBaseUrl}/flights`)
        .then(response => {
          this.allFlights = response.data.sort((a, b) => 
            new Date(b.departure_time) - new Date(a.departure_time)
          );
          this.filteredFlights = [...this.allFlights];
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching flights:', error);
          this.loading = false;
        });
    },
    filterFlights() {
      if (!this.searchQuery.trim()) {
        this.filteredFlights = [...this.allFlights];
        return;
      }
      
      const query = this.searchQuery.toLowerCase();
      this.filteredFlights = this.allFlights.filter(flight => 
        (flight.airline_code && flight.airline_code.toLowerCase().includes(query)) ||
        (flight.flight_number && flight.flight_number.toLowerCase().includes(query)) ||
        (flight.origin && flight.origin.toLowerCase().includes(query)) ||
        (flight.destination && flight.destination.toLowerCase().includes(query))
      );
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleString();
      } catch (e) {
        return dateString;
      }
    },

    getTimeOfDay(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      const hour = date.getHours();
      if (hour >= 5 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 21) return 'Evening';
      return 'Night';
    },

    formatDetailDate(dateString) {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return `${date.getDate()}${this.getOrdinalSuffix(date.getDate())} of ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`;
      } catch (e) {
        return dateString;
      }
    },

    getOrdinalSuffix(day) {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    },
    calculateDuration(departure, arrival) {
      if (!departure || !arrival) return 'N/A';
      const start = new Date(departure);
      const end = new Date(arrival);
      const diff = end - start;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    },
    initializeMap() {
      const container = this.$refs.mapContainer;
      if (!container) {
        console.error('Map container not found');
        return;
      }

      // Initialize Leaflet map
      try {
        this.map = L.map(container).setView([0, 0], 2);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Force a map refresh after a brief delay
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    },

    updateMapView() {
      if (!this.map) {
        console.error('Map not initialized');
        return;
      }

      // Clear existing markers and path
      if (this.markers.length) {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
      }
      if (this.flightPath) {
        this.flightPath.remove();
      }

      if (this.selectedFlight && this.selectedFlight.origin_airport && this.selectedFlight.destination_airport) {
        const { origin_airport, destination_airport } = this.selectedFlight;

        try {
          // Add markers for origin and destination
          const originMarker = L.marker([origin_airport.latitude, origin_airport.longitude])
            .bindPopup(origin_airport.name)
            .addTo(this.map);
          const destMarker = L.marker([destination_airport.latitude, destination_airport.longitude])
            .bindPopup(destination_airport.name)
            .addTo(this.map);
          
          this.markers.push(originMarker, destMarker);
          
          // Draw flight path
          this.flightPath = L.polyline([
            [origin_airport.latitude, origin_airport.longitude],
            [destination_airport.latitude, destination_airport.longitude]
          ], {
            color: 'blue',
            weight: 2,
            opacity: 0.6
          }).addTo(this.map);
          
          // Fit map bounds to show both markers
          const bounds = L.latLngBounds([
            [origin_airport.latitude, origin_airport.longitude],
            [destination_airport.latitude, destination_airport.longitude]
          ]);
          this.map.fitBounds(bounds, { padding: [50, 50] });

          // Force a map refresh
          this.map.invalidateSize();
        } catch (error) {
          console.error('Error updating map view:', error);
        }
      }
    },

    fetchAircraftData(iataCode) {
      if (!iataCode) return;
      
      axios.get(`${this.apiBaseUrl}/aircraft/${iataCode}`)
        .then(response => {
          this.$set(this.aircraftData, iataCode, `${response.data.manufacturer} ${response.data.model}`);
        })
        .catch(error => {
          if (error.response?.status !== 404) {
            console.error('Error fetching aircraft data:', error);
          }
        });
    },

    selectFlight(flight) {
      this.selectedFlight = flight;
      if (flight.aircraft) {
        this.fetchAircraftData(flight.aircraft);
      }
      
      // Initialize map if not already done
      if (!this.map && this.$refs.mapContainer) {
        this.initializeMap();
      }
      
      // Update map after a brief delay to ensure container is ready
      this.$nextTick(() => {
        if (this.map) {
          this.updateMapView();
        }
      });
    },

    getAircraftName(iataCode) {
      return this.aircraftData[iataCode] || iataCode;
    },
  }
};