const express = require('express');
const chatRouter = express.Router();
const chatHandler = require('../handlers/chat');
const { authorization } = require('../middleware/auth');

chatRouter.get('/chat', authorization, chatHandler.getChatroom);

module.exports = chatRouter;