const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/files/download/file-1774335119848-596346133.docx',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  res.on('data', (chunk) => {
    console.log(`DATA RECEIVED: ${chunk.length} bytes`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
