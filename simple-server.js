import express from 'express';
const app = express();
const port = 3001;

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Simple server is working!' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({
    success: true,
    user: {
      id: 'test-user',
      email: req.body.email,
      name: 'Test User',
      role: 'admin'
    },
    token: 'test-token'
  });
});

app.get('/api/system-settings', (req, res) => {
  const { key } = req.query;
  if (key === 'role_permissions') {
    res.json({
      success: true,
      data: {
        value: {
          admin: [
            { resource: 'Complaints', view: true, create: true, edit: true, delete: true },
            { resource: 'Users', view: true, create: true, edit: true, delete: true },
            { resource: 'Reports', view: true, create: true, edit: true, delete: true },
            { resource: 'Settings', view: true, create: true, edit: true, delete: true },
            { resource: 'Analytics', view: true, create: true, edit: true, delete: true },
          ],
          manager: [
            { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
            { resource: 'Users', view: true, create: false, edit: false, delete: false },
            { resource: 'Reports', view: true, create: true, edit: true, delete: false },
            { resource: 'Settings', view: false, create: false, edit: false, delete: false },
            { resource: 'Analytics', view: true, create: false, edit: false, delete: false },
          ],
          staff: [
            { resource: 'Complaints', view: true, create: true, edit: true, delete: false },
            { resource: 'Users', view: false, create: false, edit: false, delete: false },
            { resource: 'Reports', view: true, create: false, edit: false, delete: false },
            { resource: 'Settings', view: false, create: false, edit: false, delete: false },
            { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
          ],
          customer: [
            { resource: 'Complaints', view: true, create: true, edit: false, delete: false },
            { resource: 'Users', view: false, create: false, edit: false, delete: false },
            { resource: 'Reports', view: false, create: false, edit: false, delete: false },
            { resource: 'Settings', view: false, create: false, edit: false, delete: false },
            { resource: 'Analytics', view: false, create: false, edit: false, delete: false },
          ],
        }
      }
    });
  } else {
    res.status(404).json({ error: 'Setting not found' });
  }
});

app.post('/api/system-settings', (req, res) => {
  console.log('System settings update received:', req.body);
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Simple test server running on port ${port}`);
});
