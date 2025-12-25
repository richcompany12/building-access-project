const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const buildingSchema = new mongoose.Schema({
  name: String,
  code: String
});

const Building = mongoose.model('Building', buildingSchema);

app.get('/api/buildings', async (req, res) => {
  try {
    const buildings = await Building.find();
    res.json(buildings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/buildings', async (req, res) => {
  const building = new Building({
    name: req.body.name,
    code: req.body.code
  });

  try {
    const newBuilding = await building.save();
    res.status(201).json(newBuilding);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));