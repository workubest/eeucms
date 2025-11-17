console.log('Starting debug server...');

try {
  import('dotenv/config');
  console.log('dotenv imported successfully');
} catch (e) {
  console.log('dotenv import failed:', e.message);
}

try {
  import('express').then(express => {
    console.log('express imported successfully');
    const app = express.default();
    const port = 3001;

    app.get('/test', (req, res) => {
      res.json({ message: 'Debug server working!' });
    });

    app.listen(port, () => {
      console.log(`Debug server running on port ${port}`);
    });
  }).catch(e => {
    console.log('express import failed:', e.message);
  });
} catch (e) {
  console.log('Server setup failed:', e.message);
}