const express = require('express'); const router = express.Router();
router.post('/', async (req, res) => {
  const { message } = req.body;
  // Replace with actual AI chatbot integration
  const response = `Thank you for your message: "${message}". I'd recommend exploring Cape Coast for historical sites or the Volta Region for nature adventures. How can I help further?`;
  res.json({ success: true, data: { role: 'assistant', content: response } });
});
module.exports = router;
