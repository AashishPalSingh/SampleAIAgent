import OpenAI from "openai";
import readlineSync from "readline-sync";
import dotenv from "dotenv";
const OPENAI_API_KEY = dotenv.config().parsed.OPENAI_API_KEY;

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

//TOOLS
function getWeatherDetails(city = "") {
  return new Promise((resolve, reject) => {
    const delhiWeather = {
      city: "Delhi",
      temperature: "20°C",
      condition: "Sunny",
    };
    const mumbaiWeather = {
      city: "Mumbai",
      temperature: "30°C",
      condition: "Humid",
    };
    const bangaloreWeather = {
      city: "Bangalore",
      temperature: "25°C",
      condition: "Rainy",
    };
    let weather = {};
    switch (city) {
      case "delhi":
        weather = delhiWeather;
        break;
      case "mumbai":
        weather = mumbaiWeather;
        break;
      case "bangalore":
        weather = bangaloreWeather;
        break;
      default:
        weather = { error: "City not found" };
    }
    console.log(`Weather details for ${city}:`, weather);
    resolve(weather);
  });
}

const user = "Hey, what is the weather in Delhi?";
const SYSTEM_PROMPT = `
You are an AI assistant that provides weather information. You have START, PLAN, ACTION, Observation and Output State. Wait for the user prompt and first PLAN using available tools. After Planning, take the action with appropriate tools and wait for observation based on Action. Once you get the observation, return AI response JSON based on START prompt and observations.
    
Strictly follow the JSON format as uin example.

    Available tools:
    - function getWeatherDetails(city: string): { city: string, temperature: string, condition: string }
    getWeatherDetails is a function that takes a city name as input and returns the weather details of that city. The output is an object with the following properties:
    - city: string - The name of the city.
    - temperature: string - The temperature of the city.
    - condition: string - The weather condition of the city.

Example:
START
{ "type":"user","user":"what is the sum of weather of delhi and mumbai"}
{"type":"plan","plan":"I will use the getWeatherDetails tool to get the weather of delhi and mumbai"}
{"type":"action","action":"getWeatherDetails","city":"delhi"}
{"type":"observation","observation":{"city":"Delhi","temperature":"20°C","condition":"Sunny"}}
{"type":"action","action":"getWeatherDetails","city":"mumbai"}
{"type":"observation","observation":{"city":"Mumbai","temperature":"30°C","condition":"Humid"}}
{"type":"output","output":"sum of weather of Delhi and Mumbai is 50°C"}

`;

/*
client.chat.completions
  .create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "developer",
        content:
          '{"type":"plan","plan":"I will use the getWeatherDetails tool to get the weather of Delhi"}',
      },
      {
        role: "developer",
        content:
          '{"type":"action","action":"getWeatherDetails","city":"Delhi"}',
      },
      {
        role: "user",
        content: user,
      },
    ],
  })
  .then((response) => {
    const functionResponse = response.choices[0].message;
    
    console.log(functionResponse.content);
  });

  
const tools = [
  {
    name: "getWeatherDetails",
    description: "Get the weather details of a city",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name",
        },
      },
      required: ["city"],
    },
  },
];
*/

const tools = { getWeatherDetails: getWeatherDetails };
const messages = [{ role: "system", content: SYSTEM_PROMPT }];

while (true) {
  const query = readlineSync.question("Enter your query: ");
  const q = { type: "user", query: query };
  messages.push({ role: "user", content: JSON.stringify(q) });
  while (true) {
    const chat = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      response_format: { type: "json_object" },
    });
    console.log("-------START AI RESPONSE-------");
    const result = chat.choices[0].message.content;
    console.log(result);
    console.log("-------END AI RESPONSE-------");
    console.log("\n\n");
    messages.push({ role: "assistant", content: result });
    const call = JSON.parse(result);
    if (call.type === "output") {
      console.log(`BOT: ${call.output}`);
      break;
    } else if (call.type === "action") {
      const fn = tools[call.action];
      //console.log(`Calling function: ${call.action}`);
      //console.log(`Calling function: ${call.city}`);
      const observation = await fn(call.city);
      //console.log(`Observation: ${observation[0]}`);
      const obs = { type: "observation", observation: observation };

      messages.push({ role: "developer", content: JSON.stringify(obs) });
    }
  }
}
