const mongoose = require("mongoose");

// Connect to MongoDB (no extra options needed in Mongoose 7+)
mongoose.connect("mongodb://127.0.0.1:27017/testDB")
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch(err => console.error("MongoDB connection error:", err));

// Define a simple schema
const testSchema = new mongoose.Schema({
  name: String,
  age: Number
});

// Create a model
const Test = mongoose.model("Test", testSchema);

// Create and save a test document
const doc = new Test({ name: "Malaika", age: 22 });
doc.save()
  .then(() => console.log("Document saved successfully!"))
  .catch(err => console.error("Error saving document:", err))
  .finally(() => mongoose.connection.close());
