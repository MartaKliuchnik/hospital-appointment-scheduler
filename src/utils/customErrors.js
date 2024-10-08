class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ValidationError';
		this.statusCode = 400;
	}
}

class AuthenticationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthenticationError';
		this.statusCode = 401;
	}
}

class AuthorizationError extends Error {
	constructor(message) {
		super(message);
		this.name = 'AuthorizationError';
		this.statusCode = 403;
	}
}

class NotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = 'NotFoundError';
		this.statusCode = 404;
	}
}

class DatabaseError extends Error {
	constructor(message, originalError = null) {
		super(message);
		this.name = 'DatabaseError';
		this.statusCode = 500;
		this.originalError = originalError;
	}
}

class ConflictError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ConflictError';
		this.statusCode = 409;
	}
}

module.exports = {
	AuthenticationError,
	AuthorizationError,
	ValidationError,
	NotFoundError,
	DatabaseError,
	ConflictError,
};


