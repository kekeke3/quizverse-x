require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");
const { setupSocket } = require("./socket");

const PORT = process.env.PORT || 5000;

//connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Set up Socket.io
setupSocket(server);
