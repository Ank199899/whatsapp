import express from 'express';

const app = express();
const port = 3001;

app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Minimal server is working!' });
});

app.listen(port, () => {
  console.log(`Minimal server running on port ${port}`);
});
