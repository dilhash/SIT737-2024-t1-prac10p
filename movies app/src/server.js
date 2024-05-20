const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const client = require('prom-client'); // Add this line

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default metrics collection
client.collectDefaultMetrics({ register });

// Create a histogram metric for HTTP request durations
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_microseconds',
  help: 'Duration of HTTP requests in microseconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000, 10000]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ route: req.path, code: res.statusCode, method: req.method });
  });
  next();
});

// Expose the metrics endpoint
app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Connect to MongoDB using MongoDB Atlas connection string
const mongoUri = `mongodb+srv://admin:Fgqt48qK515Di1HX@clustersit737.n3psu4f.mongodb.net/sample_mflix`;
console.log(`Attempting to connect to ${mongoUri}...`);

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

// Display success or failure messages
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.log("Failed to connect to MongoDB.");
});

db.once('open', () => {
  console.log("Successfully connected to MongoDB.");
});

// Movie Schema
const movieSchema = new mongoose.Schema({
  title: String,
  year: Number,
  runtime: Number,
  genres: [String],
  cast: [String],
});
const Movie = mongoose.model('Movie', movieSchema);

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Add Movie Page
app.get('/addmovie', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'addmovie.html'));
});

app.post('/addmovie', async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Movies Page
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Movie Page
app.get('/deletemovie', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deletemovie.html'));
});

app.post('/deletemovie', async (req, res) => {
  const { title } = req.body;
  try {
    await Movie.deleteOne({ title });
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Movie Page
app.get('/updatemovie', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'updatemovie.html'));
});

app.post('/updatemovie', async (req, res) => {
  const { title } = req.body;
  try {
    await Movie.findOneAndUpdate({ title }, req.body);
    res.redirect('/');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Find Movie Page
app.get('/findmovie', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'findmovie.html'));
});

app.post('/findmovie', async (req, res) => {
  const { title } = req.body;
  try {
    const movie = await Movie.findOne({ title });
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
