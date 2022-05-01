const Router = require('express').Router;
const {launch, interaction, dial} = require('./handler');

const router = new Router();

// POST: /ivr/welcome
router.post('/interaction', async (req, res) => {
  const { Called, Caller, SpeechResult} = req.body;
  res.send(await interaction(Called, Caller, SpeechResult));
});

router.post('/launch', async (req, res) => {
  const { Called, Caller } = req.body;
  console.log(Called, Caller);
  res.send(await launch(Called, Caller));
});

module.exports = router;
