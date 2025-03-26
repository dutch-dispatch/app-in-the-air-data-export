CREATE TABLE user_info (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        country TEXT,
        currency TEXT
      );
CREATE TABLE device_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_name TEXT,
        app_name TEXT,
        os TEXT,
        version TEXT,
        country TEXT,
        first_seen DATETIME,
        last_seen DATETIME,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_info(id)
      );
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ownership TEXT,
        departure_time DATETIME,
        arrival_time DATETIME,
        origin TEXT,
        destination TEXT,
        created_at DATETIME,
        updated_at DATETIME,
        user_id TEXT,
        FOREIGN KEY (user_id) REFERENCES user_info(id)
      );
CREATE TABLE airports (
      id TEXT PRIMARY KEY,
      name TEXT,
      latitude_deg REAL,
      longitude_deg REAL,
      continent TEXT,
      country TEXT,
      iata_code TEXT UNIQUE
    );
CREATE TABLE airplanes (
      iata_code TEXT PRIMARY KEY,
      manufacturer TEXT,
      model TEXT,
      wake_category TEXT
    );
CREATE TABLE IF NOT EXISTS "flights" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                seat TEXT,
                booking_reference TEXT,
                source TEXT,
                airline_code TEXT,
                flight_number TEXT,
                aircraft TEXT,
                origin TEXT,
                destination TEXT,
                departure_time DATETIME,
                arrival_time DATETIME,
                local_departure_time DATETIME,
                local_arrival_time DATETIME,
                created_at DATETIME,
                trip_id INTEGER,
                FOREIGN KEY (trip_id) REFERENCES trips(id),
                FOREIGN KEY (origin) REFERENCES airports(iata_code),
                FOREIGN KEY (destination) REFERENCES airports(iata_code)
            );