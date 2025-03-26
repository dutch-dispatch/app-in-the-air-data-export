// Trip View Component
import API_CONFIG from '../assets/js/config.js';

export default {
  template: `
    <div>
      <h2>Trip Information</h2>
      <div v-if="loading" class="loading">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-else class="table-container">
        <table class="table table-striped table-bordered">
          <thead class="table-dark">
            <tr>
              <th>ID</th>
              <th>Ownership</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Departure Time</th>
              <th>Arrival Time</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>User ID</th>
              <th>Flights</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="trip in trips" :key="trip.id">
              <td>{{ trip.id }}</td>
              <td>{{ trip.ownership }}</td>
              <td>{{ trip.origin }}</td>
              <td>{{ trip.destination }}</td>
              <td>{{ formatDate(trip.departure_time) }}</td>
              <td>{{ formatDate(trip.arrival_time) }}</td>
              <td>{{ formatDate(trip.created_at) }}</td>
              <td>{{ formatDate(trip.updated_at) }}</td>
              <td>{{ trip.user_id }}</td>
              <td>
                <button 
                  class="btn btn-sm btn-primary" 
                  @click="showFlightsForTrip(trip.id)"
                  data-bs-toggle="modal" 
                  data-bs-target="#flightsModal"
                >
                  Show Flights
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal for showing flights -->
      <div class="modal fade" id="flightsModal" tabindex="-1" aria-labelledby="flightsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="flightsModalLabel">Flights for Trip</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div v-if="loadingFlights" class="loading">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
              <div v-else-if="tripFlights.length === 0">
                No flights found for this trip.
              </div>
              <div v-else class="table-responsive">
                <table class="table table-striped table-bordered">
                  <thead class="table-dark">
                    <tr>
                      <th>ID</th>
                      <th>Airline</th>
                      <th>Flight #</th>
                      <th>Origin</th>
                      <th>Destination</th>
                      <th>Departure</th>
                      <th>Arrival</th>
                      <th>Seat</th>
                      <th>Booking Ref</th>
                      <th>Aircraft</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="flight in tripFlights" :key="flight.id">
                      <td>{{ flight.id }}</td>
                      <td>{{ flight.airline_code }}</td>
                      <td>{{ flight.flight_number }}</td>
                      <td>{{ flight.origin }}</td>
                      <td>{{ flight.destination }}</td>
                      <td>{{ formatDate(flight.departure_time) }}</td>
                      <td>{{ formatDate(flight.arrival_time) }}</td>
                      <td>{{ flight.seat || 'N/A' }}</td>
                      <td>{{ flight.booking_reference || 'N/A' }}</td>
                      <td>{{ flight.aircraft || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      trips: [],
      tripFlights: [],
      loading: true,
      loadingFlights: false,
      apiBaseUrl: API_CONFIG.getBaseUrl()
    };
  },
  mounted() {
    this.fetchTrips();
    // Load Bootstrap JS for modal functionality
    if (!document.getElementById('bootstrap-js')) {
      const script = document.createElement('script');
      script.id = 'bootstrap-js';
      script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js';
      document.head.appendChild(script);
    }
  },
  methods: {
    fetchTrips() {
      this.loading = true;
      axios.get(`${this.apiBaseUrl}/trips`)
        .then(response => {
          this.trips = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching trips:', error);
          this.loading = false;
        });
    },
    showFlightsForTrip(tripId) {
      this.loadingFlights = true;
      this.tripFlights = [];
      
      axios.get(`${this.apiBaseUrl}/trips/${tripId}/flights`)
        .then(response => {
          this.tripFlights = response.data;
          this.loadingFlights = false;
        })
        .catch(error => {
          console.error(`Error fetching flights for trip ${tripId}:`, error);
          this.loadingFlights = false;
        });
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleString();
      } catch (e) {
        return dateString;
      }
    }
  }
};