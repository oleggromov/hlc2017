module.exports = {
  users: 'INSERT INTO users (id, first_name, last_name, email, gender, birth_date) VALUES ($id, $first_name, $last_name, $email, $gender, $birth_date)',
  locations: 'INSERT INTO locations (id, place, country, city, distnace) VALUES ($id, $place, $country, $city, $distance)',
  visits: 'INSERT INTO visits (id, location, user, visited_at, mark) VALUES ($id, $location, $user, $visited_at, $mark)'
}