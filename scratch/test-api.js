const http = require('http');

const postData = (path, data, token) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'POST',
      headers: headers
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: body });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const getData = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data: body });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

async function main() {
  try {
    console.log("Registering test user...");
    const reg = await postData('/api/auth/register', {
      name: "Test User",
      email: "testuser" + Date.now() + "@gmail.com",
      password: "password",
      role: "organizer"
    });
    console.log("Register Response:", reg.statusCode, reg.data);

    // Let's log in
    const email = JSON.parse(reg.data).message ? JSON.parse(reg.data).message.includes("success") ? "testuser@gmail.com" : null : null;
    
    // Actually, we can just use the registered user's credentials to log in!
    const parsedReg = JSON.parse(reg.data);
    const userEmail = reg.statusCode === 200 ? JSON.parse(reg.data).email || reg.data : null; 
    
    // Let's try to login with the user we just registered
    const signupData = {
      name: "Test User",
      email: "testuser_unique@gmail.com",
      password: "password",
      role: "organizer"
    };
    
    await postData('/api/auth/register', signupData).catch(() => {});
    
    const loginRes = await postData('/api/auth/login', {
      email: "testuser_unique@gmail.com",
      password: "password"
    });
    
    console.log("Login Response:", loginRes.statusCode, loginRes.data);
    const token = JSON.parse(loginRes.data).token;
    console.log("Token:", token);

    console.log("Fetching all events...");
    const eventsRes = await getData('/api/events', token);
    console.log("Events Response:", eventsRes.statusCode, eventsRes.data);

    console.log("Testing Event Creation with local ISO string (no seconds)...");
    const createRes = await postData('/api/events', {
      title: "Test Local Event No Seconds",
      description: "This is a local test event without seconds.",
      category: "Technology",
      venue: "CS Dept",
      date: "2026-05-28T10:00",
      registrationDeadline: "2026-05-28T09:00",
      maxParticipants: 50,
      tags: "test,tech",
      clubId: null
    }, token);
    console.log("Create Response:", createRes.statusCode, createRes.data);

    console.log("Fetching upcoming events...");
    const upcomingRes = await getData('/api/events/upcoming', token);
    console.log("Upcoming Events Response:", upcomingRes.statusCode, upcomingRes.data);
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
