// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';
 
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const axios = require('axios');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    return new Promise((resolve, reject) => {
      const queryText = request.body.queryResult.queryText;
      axios.post('https://sheetdb.io/api/v1/23b3197b2c9k7?sheet=failed', {
          "data": {
            "content": queryText
          }
      });

      agent.add(`I didn't understand`);
      agent.add(`I'm sorry, can you try again?`);
    });
  }
  
  function appointment(agent) {
    const doctor = agent.parameters.doctor.name;
    const date = agent.parameters.date;
    const name = agent.parameters.name;
    const phone = agent.parameters.phone;
    
    return new Promise((resolve, reject) => {
      axios.get(`https://sheetdb.io/api/v1/23b3197b2c9k7/search?name=*${doctor}*`).then(function(res) {
      	let doctor = res.data[0];
        
        if (doctor) {
          axios.post('https://sheetdb.io/api/v1/23b3197b2c9k7?sheet=appointments', {
            "data": {
              "doctor": doctor.name,
              "patient": name,
              "patient_phone": phone,
              "date": date,
              "created_at": new Date()
            }
          });
          
          agent.add("Ok your appointment is set up for you");
        } else {
          agent.add(`Unfortuneatly we did not find ${doctor} in our doctors`);
        }
        
        resolve();
      });
    });
  }

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('AppointmentIntent', appointment);

  agent.handleRequest(intentMap);
});
