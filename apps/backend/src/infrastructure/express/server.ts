import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req,res) => {
  res.send('MyGES 2.0 API is running!');
});

app.listen(PORT, () => {
  console.log(`[Backend]: Server is running at http://localhost:${PORT}`);
});