const path = require('path');
const rootDir = require('../utils/path');
const { hashPassword, comparePassword } = require('../utils/auth');
const { createJWT } = require('../utils/jwt');

exports.getLogin = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'login-page.html'));
};

exports.postLogin = async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({
			error: 'Incorrect email or password',
		});
	}

	try {
		const registeredUser = req.session.client?.find(
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

		const header = {
			alg: 'HS256',
			typ: 'JWT',
		};

		const payload = {
			sub: registeredUser.client_id,
			first_name: registeredUser.first_name,
			last_name: registeredUser.last_name,
			iat: Math.floor(Date.now() / 1000),
		};

		const secret = process.env.JWT_SECRET;
		const token = createJWT(header, payload, secret);

		res.status(200).send({
			token: token,
			client: {
				client_id: registeredUser.client_id,
				first_name: registeredUser.first_name,
				last_name: registeredUser.last_name,
				phone_number: registeredUser.phone_number,
				email: registeredUser.email,
				password: registeredUser.password,
				registration_date: registeredUser.registration_date,
			},
		});
	} catch {
		res.status(500).send({ error: 'Error logging in' });
	}
};

exports.getRegister = (req, res) => {
	res.sendFile(path.join(rootDir, '../views', 'register-page.html'));
};

exports.postRegister = async (req, res) => {
	const { first_name, last_name, phone_number, email, password } = req.body;

	if (!first_name || !last_name || !phone_number || !email || !password) {
		res.status(400).send({
			error:
				'Invalid input: all fields are required and must be in a valid format.',
		});
	}

	try {
		const hashedPassword = await hashPassword(password);
		const registeredUser = {
			client_id: Date.now(),
			first_name,
			last_name,
			email,
			password: hashedPassword,
			registration_date: new Date()
				.toISOString()
				.slice(0, 19)
				.replace('T', ' '),
		};

		if (!req.session?.client) {
			req.session.client = [registeredUser];
		} else {
			const isUserExist = req.session.client.find(
				(user) => user.email === email
			);
			if (isUserExist) {
				return res.status(409).send({
					error: 'Email already in use',
				});
			}
			req.session.client.push(registeredUser);
		}

		res.status(201).send({
			message: 'User registered successfully',
			client_id: registeredUser.client_id,
		});
	} catch {
		res.status(500).send({ error: 'Error registering user' });
	}
};
