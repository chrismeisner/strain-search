const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure required environment variables are set
if (!process.env.OPENAI_API_KEY || !process.env.AIRTABLE_API_KEY) {
  console.error("❌ Required API keys are missing. Please set them in your .env file.");
  process.exit(1); // Exit if the API keys are not found
}

// Load API configurations
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

console.log("🔑 Loaded API Key:", OPENAI_API_KEY ? "Present ✅" : "Not Found ❌");
console.log("🛠️ Using OpenAI Model:", OPENAI_MODEL);

// Middleware
app.use(express.static('public')); // Serve static files from 'public'
app.use(express.json()); // Parse incoming JSON requests

// Airtable logging function
async function logToAirtable(userInput, prompt, response) {
  console.log("📋 Attempting to log interaction to Airtable...");

  try {
	const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
	const data = {
	  records: [
		{
		  fields: {
			"User Input": userInput,
			"Prompt": prompt,
			"Response": response,
		  },
		},
	  ],
	};

	await axios.post(airtableUrl, data, {
	  headers: {
		Authorization: `Bearer ${AIRTABLE_API_KEY}`,
		'Content-Type': 'application/json',
	  },
	});

	console.log("✅ Successfully logged interaction to Airtable.");
  } catch (error) {
	console.error("❌ Error logging to Airtable:", error.message);
  }
}

// API endpoint to handle strain queries
app.post('/api/chat', async (req, res) => {
  const { userInput, prompt, previousMessages = [] } = req.body;

  // Validate input
  if (!prompt || !userInput) {
	console.error("❌ Prompt or User Input missing.");
	return res.status(400).json({ error: 'Prompt and User Input are required. 🚨' });
  }

  console.log("📨 Received request with user input:", userInput);
  console.log("📝 Prompt being sent:", prompt);

  try {
	console.log("🚀 Sending request to OpenAI API...");
	const response = await axios.post(
	  'https://api.openai.com/v1/chat/completions',
	  {
		model: OPENAI_MODEL,
		messages: [
		  {
			role: 'system',
			content: `You are a cannabis expert who provides reliable, accurate, and concise information about cannabis strains. Your responses should include detailed strain effects, category, genetics, terpenes, growing notes, and more.`,
		  },
		  ...previousMessages, // Include chat history if needed
		  { role: 'user', content: prompt },
		],
		temperature: 0.5, // Balanced randomness
		max_tokens: 500, // Allow detailed responses
		top_p: 1.0,
		frequency_penalty: 0.3, // Mild penalty to avoid repetition
		presence_penalty: 0.6, // Encourage diverse responses
	  },
	  {
		headers: {
		  'Content-Type': 'application/json',
		  Authorization: `Bearer ${OPENAI_API_KEY}`,
		},
	  }
	);

	const message = response.data.choices[0].message.content;
	console.log("✅ Response from OpenAI:", message);

	// Log the interaction to Airtable
	await logToAirtable(userInput, prompt, message);

	res.json({ response: message });
  } catch (error) {
	console.error("❌ Error with OpenAI API:", error.response?.data || error.message);

	const status = error.response?.status || 500;
	const errorMessage = error.response?.data?.error?.message || error.message;

	res.status(status).json({ error: `OpenAI API error: ${errorMessage}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Cannabis Strain Explorer running on port ${PORT}`);
});
