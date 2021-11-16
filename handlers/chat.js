
const Message = require('../model/message.js');

exports.getChatroom = async (req, res) => {
    const username = req.username;
    const chatroom = req.query.room;
    const messages = await Message.find({ chatroom: chatroom });
    res.render('pages/chatroom', { username, messages });
};
