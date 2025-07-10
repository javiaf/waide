const config = require('./config.json');
const express = require('express');
const Parser = require('rss-parser');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const platformClient = require('purecloud-platform-client-v2');

dotenv.config();

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 4000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const routingApiInstance = new platformClient.RoutingApi();
const groupsApiInstance = new platformClient.GroupsApi();

const client = platformClient.ApiClient.instance;

let queues = [];

let defaultGroup;

app.use(cors());
app.use(express.json());



// Load feeds list from JSON file
app.get('/api/feeds', (req, res) => {
  const feedsPath = path.join(process.cwd(), 'feeds.json');
  try {
    const data = fs.readFileSync(feedsPath, 'utf-8');
    const feeds = JSON.parse(data);
    res.json(feeds.feeds);
  } catch (error) {
    console.error('Failed to load feeds.json:', error);
    res.status(500).json({ error: 'Failed to load feeds list' });
  }
});

// HTTP Endpoint - fetch RSS via query
app.get('/api/rss', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).json({ error: 'Missing RSS URL' });
  }
  try {
    const feed = await parser.parseURL(feedUrl);
    res.json(feed.items);
  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
});


app.post('/api/extragroup', async (req, res) => {
  const category = req.body.category;
  const severity = req.body.severity;
  const queueId = req.body.queueId;
  if (!category) {
    return res.status(400).json({ error: 'Missing Category ' });
  }
  try {
   /* let groupId = config.extragroups[category];
    if(!groupId){
      return res.status(400).json({ error: 'Category does not exist in the config' });
    }*/
   // await getGroupUsers(groupId);
      let groupId = config.extragroups[category];
      if(groupId){
        await getGroupUserList(groupId);
      }
      

    await addQueueMembers(severity, queueId);
    res.json(members);
  } catch (error) {
    console.error('RSS fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch RSS feed' });
  }
});


async function addQueueMembers(severity,queueId){

  let severityPercent = config.severity[severity];
  let memberSize = Math.round(members.length * severityPercent);
  let body = members.slice(0,memberSize).map(item => ({ id: item.id }));
let opts = { 
  "_delete": false // Boolean | True to delete queue members
};
 await routingApiInstance.postRoutingQueueMembers(queueId, body, opts)
  .then(() => {
    console.log("postRoutingQueueMembers returned successfully.");
  })
  .catch((err) => {
    console.log("There was a failure calling postRoutingQueueMembers");
    console.error(err);
  });

}

async function getGroupUserList(groupId){
 members = []
 return await getGroupUsers(groupId,1,50);
}

async function getGroupUsers(groupId, pageNumber, pageSize){

let opts = { 
  "pageSize": pageSize, // Number | Page size
  "pageNumber": pageNumber, // Number | Page number
  "sortOrder": "ASC", // String | Ascending or descending sort order
};


  await groupsApiInstance.getGroupMembers(groupId,opts)
  .then((data) => {
    console.log(`getGroupMembers success! data: ${JSON.stringify(data, null, 2)}`);
    data.entities.forEach(member =>{
      members.push({
        id: member.id,
        name: member.name
      })
    });
    //console.log("Skills are: "+ JSON.stringify(skills))
    if(data.total> pageSize*pageNumber){
      getGroupUsers(groupId, pageNumber + 1, pageSize)
    }
  })
  .catch((err) => {
    console.log('There was a failure calling getGroupMembers');
    console.error(err);
  });

}

async function getRoutingQueues(){
  queues = []
  await getPageRoutingSkills(1,50);
}

async function getRoutingQueues(pageNumber,pageSize){
  let opts = { 
    'pageSize': pageSize, // Number | Page size
    'pageNumber': pageNumber // Number | Page number
  };
  await routingApiInstance.getRoutingQueues(opts)
  .then((data) => {
    console.log(`getRoutingQueues success! data: ${JSON.stringify(data, null, 2)}`);
    data.entities.forEach(queue =>{
      queues.push({
        id: queue.id,
        name: queue.name
      })
    });
    //console.log("Skills are: "+ JSON.stringify(skills))
    if(data.total> pageSize*pageNumber){
      getPageRoutingSkills(pageNumber + 1,pageSize)
    }
  })
  .catch((err) => {
    console.log('There was a failure calling getRoutingQueues');
    console.error(err);
  });

}


app.get('/api/queues', async (req, res) => {
  try {
    res.json(queues);
  } catch (error) {
    console.error('Queues fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Queues' });
  }
});

// Classify multiple news articles and parse response as JSON array
app.post('/api/classify', async (req, res) => {
  const { articles } = req.body;
  if (!Array.isArray(articles)) {
    return res.status(400).json({ error: 'Expected articles to be an array' });
  }

  const prompt = `Classify the following news articles. For each, return a JSON with:\n- topic (Finance, International Relationships, Disaster, Environment)\n- location (if mentioned)\n- importance (CRITICAL,HIGH, MEDIUM, LOW). The importance of the news is based on the need of acting based on it.\n\nArticles:\n` +
    articles.map((a, i) => `\n${i + 1}. Title: "${a.title}"\n   Content: "${a.content}"`).join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0].message.content;
  const blocks = raw
  .split(/\n(?=\d+\.\s*\{)/)
  .map(entry => entry.replace(/^\d+\.\s*/, '').trim())
  .filter(Boolean);
const parsed = blocks.map((jsonStr, index) => {

    const obj = JSON.parse(jsonStr);
    return {
      id: index + 1,
      topic: obj.topic,
      location: obj.location || '',
      importance: obj.importance
    };

}).filter(Boolean);


    res.json({ classification: parsed });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'Failed to classify articles' });
  }
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestItems = [];
const feedsPath = path.join(process.cwd(), 'feeds.json');
let FEED_URL = '';
try {
  const feedData = fs.readFileSync(feedsPath, 'utf-8');
  const parsedFeeds = JSON.parse(feedData);
  if (parsedFeeds && parsedFeeds.defaultFeed && parsedFeeds.defaultFeed.url) {
    FEED_URL = parsedFeeds.defaultFeed.url;
    console.log(`Default FEED_URL set to: ${FEED_URL}`);
  } else {
    console.warn('feeds.json missing defaultFeed entry or url');
  }
} catch (err) {
  console.error('Error reading default FEED_URL from feeds.json:', err);
  FEED_URL = 'https://example.com/rss';
}

const broadcast = (items) => {
  const data = JSON.stringify(items);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

const fetchAndBroadcastFeed = async () => {
  try {
    const feed = await parser.parseURL(FEED_URL);
    if (JSON.stringify(feed.items) !== JSON.stringify(latestItems)) {
      latestItems = feed.items;
      broadcast(feed.items);
    }
  } catch (err) {
    console.error('WebSocket feed fetch error:', err);
  }
};

setInterval(fetchAndBroadcastFeed, 5 * 60 * 1000); // Every 5 mins
fetchAndBroadcastFeed();


function init() {
  console.log("init")
  client.setEnvironment(platformClient.PureCloudRegionHosts[config.gc_region]); // Genesys Cloud region

  client.loginClientCredentialsGrant(config.clientId, config.clientSecret)
    .then(async () => {
      // Do authenticated things
      await getRoutingQueues();
      defaultGroup = config.extragroups["Default"] | "4d76d927-e48d-42aa-b205-10d2f320575f";
      await getGroupUserList(defaultGroup);
      console.log('retrived GC objects')
      let PORT = process.env.PORT || config.httpPort

      server.listen(PORT, () => {
        console.log(`Example app listening on port ${PORT}`)
      })
    })
    .catch((err) => {
      // Handle failure response
      console.log(err);
    });

}

init();