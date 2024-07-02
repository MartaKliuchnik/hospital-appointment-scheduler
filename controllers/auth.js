const path = require('path');
const rootDir = require('../utils/path');

exports.getLogin = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'login-page.html'));
};

exports.postLogin = (req, res) => {
	const { email, password } = req.body;
	if (email && password) {
		const registeredUser = req.session.users?.find(
			(user) => user.email === email
		);
		if (registeredUser) {
			res.status(200).send({
				userId: registeredUser.userId,
				username: registeredUser.username,
				email: registeredUser.email,
				password: registeredUser.password,
				createdAt: registeredUser.createdAt,
			});
		} else {
			res.status(401).send({
				message: 'The users does not exist',
			});
		}
	} else {
		res.status(400).send({
			error: 'Incorrect email or password',
		});
	}
};

exports.getRegister = (req, res) => {
	res.sendFile(path.join(rootDir, 'views', 'register-page.html'));
};

exports.postRegister = (req, res) => {
	const { username, email, password } = req.body;
	if (username && email && password) {
		const registeredUser = {
			...req.body,
			userId: Date.now(),
			createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
		};

		if (!req.session.users) {
			req.session.users = [registeredUser];
			res.status(201).send({
				message: 'User registered successfully',
				userId: registeredUser.userId,
			});
		} else {
			if (req.session.users.find((user) => user.email === email)) {
				res.status(409).send({
					error: 'Email already in use',
				});
			} else {
				req.session.users.push(registeredUser);
				res.status(201).send({
					message: 'User registered successfully',
					userId: registeredUser.userId,
				});
			}
		}
	} else {
		res.status(400).send({
			error: 'Invalid email or password',
		});
	}
};
