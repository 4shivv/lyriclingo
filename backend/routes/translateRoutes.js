const express = require("express");
const router = express.Router();

// Placeholder translation route
router.get("/", (req, res) => {
  res.json({ message: "Translation API is working!" });
});

module.exports = router;
