const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Load API key and model from .env

const app = express();
const PORT = 3000;

// Load API key and model from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'; // Default to gpt-3.5-turbo

// Console log the loaded API key status and model name
console.log("🔑 Loaded API Key:", OPENAI_API_KEY ? "Present ✅" : "Not Found ❌");
console.log("🛠️ Using OpenAI Model:", OPENAI_MODEL);  // <-- Your log here

app.use(express.static('public')); // Serve static files from the public folder
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { prompt } = req.body;
  console.log("📨 Received POST request to /api/chat with prompt:", prompt);

  try {
	console.log("🚀 Sending request to OpenAI API...");
	const response = await axios.post(
	  'https://api.openai.com/v1/chat/completions',
	  {
		model: OPENAI_MODEL,  // Use the model from the environment variable
		messages: [{ role: 'user', content: prompt }],
	  },
	  {
		headers: {
		  'Content-Type': 'application/json',
		  'Authorization': `Bearer ${OPENAI_API_KEY}`,
		},
	  }
	);

	const message = response.data.choices[0].message.content;
	console.log("✅ Response from OpenAI:", message);

	res.json({ response: message });
  } catch (error) {
	console.error("❌ Error with OpenAI API:", error.response?.data || error.message);
	res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
