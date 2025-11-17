console.log('Testing server startup...');

try {
  const express = require('express');
  const app = express();
  const port = 3001;

  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.error('Error:', error.message);
}