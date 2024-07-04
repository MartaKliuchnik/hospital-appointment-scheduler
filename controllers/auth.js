const path = require('path');
const rootDir = require('../utils/path');
const { hashPassword, comparePassword } = require('../utils/auth');

exports.getLogin = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'login-page.html'));
};

exports.postLogin = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({
			error: 'Incorrect email or password',
		});
	}

	try {
		const registeredUser = req.session.users?.find(
			(user) => user.email === email
		);

		if (!registeredUser) {
			return res.status(401).send({
				error: 'The users does not exist',
			});
		}

		const isPasswordMatched = await comparePassword(
			password,
			registeredUser.password
		);

		if (!isPasswordMatched) {
			return res.status(400).send({
				error: 'Incorrect email or password',
			});
		}

		res.status(200).send({
			userId: registeredUser.userId,
			username: registeredUser.username,
			email: registeredUser.email,
			password: registeredUser.password,
			createdAt: registeredUser.createdAt,
		});
	} catch {
		res.status(500).send({ error: 'Error logging in' });
	}
};

exports.getRegister = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'register-page.html'));
};

exports.postRegister = async (req, res) => {
	const { username, email, password } = req.body;

	if (!username || !email || !password) {
		res.status(400).send({
			error: 'Username, email, and password are required fields',
		});
	}

	try {
		const hashedPassword = await hashPassword(password);
		const registeredUser = {
			userId: Date.now(),
			username,
			email,
			password: hashedPassword,
			createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
		};

		if (!req.session?.users) {
			req.session.users = [registeredUser];
		} else {
			const isUserExist = req.session.users.find(
				(user) => user.email === email
			);
			if (isUserExist) {
				return res.status(409).send({
					error: 'Email already in use',
				});
			}
			req.session.users.push(registeredUser);
		}
		res.status(201).send({
			message: 'User registered successfully',
			userId: registeredUser.userId,
		});
	} catch {
		res.status(500).send({ error: 'Error registering user' });
	}
};
