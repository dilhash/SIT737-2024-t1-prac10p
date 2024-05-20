const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: String,
  year: Number,
  runtime: Number,
  genres: [String],
  cast: [String],
});

module.exports = mongoose.model('Movie', movieSchema);
