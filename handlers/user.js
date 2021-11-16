
const User = require('../model/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = process.env;
const fs = require('fs');
const util = require('util');
const { uploadFile, getFileStream } = require('../helpers/s3/s3');

const uploadToS3 = async (file) => {
  const result = await uploadFile(file);
  const unlinkFile = util.promisify(fs.unlink);
  await unlinkFile(file.path);
  return result;
};

exports.getRegister = (req, res) => {
  res.render('pages/register');
};

exports.getLogin = (req, res) => {
  res.render('pages/login');
};

exports.getProfile = (req, res) => {
  res.render('pages/profile');
};

exports.getEdit = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).lean();

  res.render('pages/edit', { user });
};

exports.home = (req, res) => {
  res.render('pages/home');
};

exports.getImage = (req, res) => {
  const { key } = req.params;
  const readStream = getFileStream(key);

  readStream.pipe(res);
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).lean();

  if (!user) {
    req.flash('invalidUserErr', 'Invalid username/password');
    return res.redirect('/login');
  }

  if (await bcrypt.compare(password, user.password)) {
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
    );

    return res
      .cookie('token', token, {
        httpOnly: false,
      })
      .redirect(`/api/user/profile/${username}`);
  }

  req.flash('invalidUserErr', 'Invalid username/password');
  return res.redirect('/login');
};

exports.register = async (req, res) => {
  const {
    username, password: plainTextPassword, email, firstName, lastName, dateOfBirth,
  } = req.body;

  const password = await bcrypt.hash(plainTextPassword, 10);

  const isDuplicated = await User.findOne({ username });

  if (isDuplicated) {
    req.flash('userDupErr', 'Username has been created');
    const user = { username, email, firstName, lastName, dateOfBirth } || {};
    return res.render('pages/register', { user });
  }
  const timestamp = Date.now();

  let avatarUrl = '';
  try {
    if (req.file) {
      avatarUrl = (await uploadToS3(req.file)).Key;
    }

    await User.create({
      username,
      password,
      avatarUrl,
      email,
      firstName,
      lastName,
      dateOfBirth,
      timestamp,
    });
  } catch (error) {
    console.log(error);
  }
  req.flash('signupSucessMsg', 'Register successfully. Now please login');
  return res.redirect('/login');
};

exports.update = async (req, res) => {
  const {
    email, firstName, lastName, dateOfBirth,
  } = req.body;
  const { username } = req.params;
  const user = await User.findOne({ username }).lean();
  let { avatarUrl } = user;

  try {
    if (req.file) {
      avatarUrl = (await uploadToS3(req.file)).Key;
    }

    await User.updateOne(
      { username },
      {
        $set: {
          email,
          avatarUrl,
          firstName,
          lastName,
          dateOfBirth,
        },
      },
    );
  } catch (error) {
    console.log(error);
  }
  res.redirect(`/api/user/profile/${username}`);
};

exports.profile = async (req, res) => {
  const { username } = req.params;

  if (username !== req.username) return res.send(403);

  const user = await User.findOne({ username }).lean();

  return res.render('pages/profile', { user });
};

exports.logout = (req, res) => {
  req.flash('logoutMsg', 'Successfully Logged Out');
  return res
    .clearCookie('token')
    .status(200)
    .redirect('/');
};

exports.getUserList = async (req, res) => {
  const mySort = {};
  const searchValueStr = req.query.searchValue;
  const searchValue = new RegExp(searchValueStr, 'i');

  if (req.query.sort === 'username') { req.query.order === 'asc' ? mySort.username = 1 : mySort.username = -1; }
  else if (req.query.sort === 'firstName') { req.query.order === 'asc' ? mySort.firstName = 1 : mySort.firstName = -1; }
  else if (req.query.sort === 'lastName') { req.query.order === 'asc' ? mySort.lastName = 1 : mySort.lastName = -1; }
  else if (req.query.sort === 'timestamp') { req.query.order === 'asc' ? mySort.timestamp = 1 : mySort.timestamp = -1; }

  let users = await User.find({ $or: [ { username: searchValue }, { firstName: searchValue }, { lastName: searchValue } ], role: "User" }).sort(mySort);

  res.render('pages/users', { users, searchValueStr, mySort });
};

exports.deleteUser = async (req, res) => {
  const { username } = req.params;

  try {
    await User.deleteOne(
      { username },
    );
  } catch (error) {
    console.log(error);
  }
  req.flash('delUsrMsg', `Successfully delete user: ${username}`);
  res.redirect('back');
};
