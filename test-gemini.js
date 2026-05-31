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
      console.log('Raw response body:', body);
      const parsed = JSON.parse(body);
      if (parsed.models) {
        const validModels = parsed.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
        console.log('Valid models for generateContent:');
        validModels.slice(0, 5).forEach(m => console.log(m.name));
      } else {
        console.log('Error payload:', parsed);
      }
    });
  });

  req.on('error', error => {
    console.error(error);
  });

  req.end();
}

findValidModel();
