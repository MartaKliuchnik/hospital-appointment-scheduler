const Role = require('../enums/Role');
const Client = require('../models/client');

/**
 * Update the role of a specified user
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
exports.updateUserRole = async (req, res) => {
	const clientId = parseInt(req.params.clientId);
	const { newRole } = req.body;

	// Check if the clientId is provided and is a valid number
	if (isNaN(clientId)) {
		return res.status(400).json({ error: 'Invalid client ID.' });
	}

	// Check for missing parameters and valid role
	if (!newRole || !Object.values(Role).includes(newRole)) {
		return res.status(400).json({
			error: 'Invalid role provided.',
		});
	}

	try {
		// Check if client exists
		const client = await Client.findById(clientId);
		if (!client) {
			return res.status(404).json({ error: 'Client not found.' });
		}

		// Check if the new role is different from the current role
		if (client.role === newRole) {
			return res.status(400).json({ error: 'Client already has this role.' });
		}
		const isUpdatedRole = await client.updateUserRole(newRole);

		if (isUpdatedRole) {
			res
				.status(200)
				.json({ message: 'User role updated successfully.', newRole });
		} else {
			res.status(400).json({ error: 'User role update failed.' });
		}
	} catch (error) {
		console.error('Error updating role:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while updating the role.' });
	}
};
