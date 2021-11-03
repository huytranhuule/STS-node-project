const User = require('../model/user.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const errorHandler = require('./error.js');

exports.login = async (req, res) => {
	const { username, password } = req.body
	const user = await User.findOne({ username }).lean()

	if (!user) {
		return res.json({ status: 'error', error: 'Invalid username/password' })
	}

	if (await bcrypt.compare(password, user.password)) {
		// the username, password combination is successful

		const token = jwt.sign(
			{
				id: user._id,
				username: user.username
			},
			JWT_SECRET
		)

        return res
            .cookie("token", token, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === "production",
            })
            .json({ status:'ok', message: "Logged in successfully 😊 👌" });
    }

	res.json({ status: 'error', error: 'Invalid username/password' })
};

exports.register = async (req, res) => {
	const { username, password: plainTextPassword } = req.body

	if (!username || typeof username !== 'string') {
		return res.json({ status: 'error', error: 'Invalid username' })
	}

	if (!plainTextPassword || typeof plainTextPassword !== 'string') {
		return res.json({ status: 'error', error: 'Invalid password' })
	}

	if (plainTextPassword.length < 5) {
		return res.json({
			status: 'error',
			error: 'Password too small. Should be atleast 6 characters'
		})
	}

	const password = await bcrypt.hash(plainTextPassword, 10)

	try {
		const response = await User.create({
			username,
			password
		})
		console.log('User created successfully: ', response)
	} catch (error) {
		if (error.code === 11000) {
			// duplicate key
			return res.json({ status: 'error', error: 'Username already in use' })
		}
		throw error

		//errorHandler.registerDuplicate(error, res);
	}
	res.json({ status: 'ok' })
}

exports.welcome = (req, res) => {
    res.send("Welcome!!!");
};

exports.logout = (req, res) => {
	return res
	  .clearCookie("token")
	  .status(200)
	  .json({ message: "Successfully logged out 😏 🍀" })
};