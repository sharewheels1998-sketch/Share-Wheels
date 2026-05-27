/**
 * Seeds default city suggestions for from/to dropdowns.
 * Usage: node scripts/seedLocations.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { connectMongo, disconnectMongo } = require("./mongoConnect");
const locationService = require("../src/services/locationService");

const DEFAULT_NAMES = [
  "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry",
  "Kakinada", "Anantapur", "Kadapa", "Eluru", "Ongole", "Chittoor", "Machilipatnam", "Adoni",
  "Tenali", "Proddatur", "Bhimavaram", "Tadepalligudem", "Narasaraopet", "Vizianagaram",
  "Srikakulam", "Amalapuram", "Gudivada", "Hindupur", "Dharmavaram", "Madanapalle", "Nandyal",
  "Puttur", "Palakollu", "Kavali", "Markapur", "Rayachoti", "Kadiri", "Chilakaluripet", "Repalle",
  "Bapatla", "Parvathipuram",
  "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar",
  "Nalgonda", "Adilabad", "Siddipet", "Suryapet", "Miryalaguda", "Jagtial", "Mancherial", "Kamareddy",
  "Kothagudem", "Bhongir", "Wanaparthy", "Vikarabad", "Nagarkurnool", "Gadwal", "Medak", "Sangareddy",
  "Zaheerabad", "Shamshabad", "Chevella", "Tandur", "Peddapalli", "Huzurabad", "Kodad",
  "Bangalore", "Chennai",
];

const run = async () => {
  await connectMongo();
  const result = await locationService.bulkUpsertLocations(DEFAULT_NAMES);
  console.log(result.body.message, "- count:", result.body.count);
  await disconnectMongo();
  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
