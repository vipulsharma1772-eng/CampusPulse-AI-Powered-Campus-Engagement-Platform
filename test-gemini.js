const https = require('https');

function findValidModel() {
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models?key=AIzaSyC70N7P1OentBve0DmdXknvbWYAb3iceDk`,
    method: 'GET'
  };

  const req = https.request(options, res => {
    let body = '';
    res.on('data', d => { body += d; });
    res.on('end', () => {
      const parsed = JSON.parse(body);
      const validModels = parsed.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
      console.log('Valid models for generateContent:');
      validModels.slice(0, 5).forEach(m => console.log(m.name));
    });
  });

  req.on('error', error => {
    console.error(error);
  });

  req.end();
}

findValidModel();
