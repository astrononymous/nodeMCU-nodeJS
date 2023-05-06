require('dotenv').config();
const express = require('express');
const WebSocket = require('ws');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const wsPort = process.env.WS_PORT || 3001;
const path = require('path');

let db;

app.use(express.static(path.join(__dirname, 'public')));

function startWebSocketServer() {
  const wss = new WebSocket.Server({ port: wsPort });

  wss.on('connection', (ws) => {
    console.log('NodeMCU connected');
    const requestDataInterval = setInterval(() => requestData(ws), 60000); // Request data every 10 seconds

    ws.on('message', (message) => {
      const data = JSON.parse(message);
      console.log('Received data:', data);

      // Add a timestamp to the data object
      data.timestamp = new Date();

      // Save data to MongoDB
      db.collection('dht22').insertOne(data, (err, result) => {
        if (err) {
          console.error('Failed to save data to MongoDB', err);
          return;
        }
        console.log('Data saved to MongoDB:', result.ops[0]);
      });
    });

    ws.on('close', () => {
      console.log('NodeMCU disconnected');
      clearInterval(requestDataInterval);
    });
  });
}

function requestData(ws) {
  console.log("requesting data");
  ws.send('request_data');
}

(async () => {
  console.log("attempting to connect to mongodb");
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI, { useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    db = client.db('nodeMCU_server');
    startWebSocketServer();
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
})();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/data', async (req, res) => {
  try {
    const data = await db.collection('dht22').find().toArray();
    res.json(data);
  } catch (err) {
    console.error('Failed to fetch data from MongoDB', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
