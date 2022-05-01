const VoiceResponse = require('twilio').twiml.VoiceResponse;
const axios = require('axios');

// // THIS IS ONLY NEEDED IF YOU WANT TO SEND TEXT (SMS) MESSAGES THROUGH TWILIO
// const client = require('twilio')('XXX', 'XXX');
// const sendText = (from, to, text) => {
//   console.log("sending text", { from, to, text });
//   client.messages.create({body: text, from, to }).then(message => console.log('text successfully sent', message.sid));
// }

const API_KEY = "VF.DM.XXXXXXX......"; // it should look like this: VF.DM.XXXXXXX.XXXXXX... keep this a secret!

// send an interaction to the Voiceflow API, and log the response, returns true if there is a next step
async function interact(called, caller, action) {
  const twiml = new VoiceResponse();
  // call the Voiceflow API with the user's name & request, get back a response

  console.log("REQUEST ACTION", action)
  const request = {
    method: "POST",
    url: `https://general-runtime.voiceflow.com/state/user/${encodeURI(caller)}/interact`,
    headers: { Authorization: API_KEY },
    data: { action, config: { stopTypes: ['call'] } },
  }
  const response = await axios(request);

  // janky first pass
  const endTurn = response.data.some((trace) => ['call', 'end'].includes(trace.type));

  const agent = endTurn ? twiml : twiml.gather({
    input: 'speech',
    speechTimeout: 'auto',
    action: '/ivr/interaction',
    profanityFilter: false,
    actionOnEmptyResult: true
  });

  // loop through the response
  for (const trace of response.data) {
    switch (trace.type) {
      // case "sms": {
      //   try { 
      //     sendText(called, caller, trace.payload)
      //   } catch (error) { 
      //     console.log(error) 
      //   }
      //   break;
      // }
      case "text":
      case "speak": {
        agent.say(trace.payload.message);
        break;
      }
      case "call":
        const { number } = JSON.parse(trace.payload);
        twiml.dial(number);
        break;
      case "end": {
        twiml.hangup();
        break;
      }
      default: {}
    }
  }

  console.log(twiml.toString())
  return twiml.toString();
}

exports.launch = async (called, caller) => {
  return interact(called, caller, { type: "launch" });
};

exports.interaction = async (called, caller, query = '') => {
  // twilio always ends everythings with a period
  query = query.slice(0, -1);
  query = query.replace('one', '1');
  const action = query.trim() ? { type: "text", payload: query } : null;
  return interact(called, caller, action);
};