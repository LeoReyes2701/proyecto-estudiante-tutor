const Tutoring = require('../models/tutorias');
const { readJSON, writeJSON } = require('../config/database');

function createTutoring(req, res) {
  const { title, description, startTime, endTime, weekday, capacity } = req.body;

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({ error: 'La hora de fin debe ser posterior a la de inicio' });
  }

  const newTutoring = new Tutoring({ title, description, startTime, endTime, weekday, capacity });
  const tutorings = readJSON('tutorings.json');
  tutorings.push(newTutoring);
  writeJSON('tutorings.json', tutorings);

  res.status(201).json(newTutoring);
}

function getTutorings(req, res) {
  const tutorings = readJSON('tutorings.json');
  res.json(tutorings);
}

module.exports = { createTutoring, getTutorings };
