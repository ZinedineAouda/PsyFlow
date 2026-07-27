const http = require('http');

const patients = [
  { full_name: "John Doe", rfid_uid: "11223344", age: 34, gender: "Male", diagnosis: "Anxiety Disorder", notes: "Patient experiences mild anxiety attacks.", first_consultation: { consultation_type: "Initial Evaluation", notes: "Discussed history." } },
  { full_name: "Jane Smith", rfid_uid: "55667788", age: 28, gender: "Female", diagnosis: "Depression", notes: "Requires follow-up for medication adjustments.", first_consultation: { consultation_type: "Therapy", notes: "First therapy session." } },
  { full_name: "Ali Baba", rfid_uid: "9900AABB", age: 45, gender: "Male", diagnosis: "PTSD", notes: "Trauma therapy ongoing." }
];

async function postData(path, dataObj) {
  const data = JSON.stringify(dataObj);
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
        } else {
            console.error(`Error ${res.statusCode}: ${body}`);
            resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function seed() {
  try {
    for (const p of patients) {
      const created = await postData('/api/patients/register', p);
      if (created && created.success) {
        console.log('Created patient:', created.patient.full_name);
      }
    }
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seed();
