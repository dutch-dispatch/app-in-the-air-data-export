// User View Component
import API_CONFIG from '../assets/js/config.js';

export default {
  template: `
    <div>
      <h2>User Information</h2>
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
              <th>Email</th>
              <th>Full Name</th>
              <th>Country</th>
              <th>Currency</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.full_name }}</td>
              <td>{{ user.country }}</td>
              <td>{{ user.currency }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  data() {
    return {
      users: [],
      loading: true,
      apiBaseUrl: API_CONFIG.getBaseUrl()
    };
  },
  mounted() {
    this.fetchUsers();
  },
  methods: {
    fetchUsers() {
      this.loading = true;
      axios.get(`${this.apiBaseUrl}/user_info`)
        .then(response => {
          this.users = response.data;
          this.loading = false;
        })
        .catch(error => {
          console.error('Error fetching users:', error);
          this.loading = false;
        });
    }
  }
};