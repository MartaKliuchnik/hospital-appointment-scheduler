const Doctor = require('../models/doctor');

/**
 * Retrieve list of doctors from database.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.listDoctors = async (req, res) => {
	try {
		const doctors = await Doctor.getAll();

		// Check if the doctors exist in database
		if (!doctors || doctors.length === 0) {
			return res
				.status(404)
				.json({ message: 'No doctors found in the database.' });
		}

		res.status(200).json({ doctors });
	} catch (error) {
		console.error('Error retrieving doctors:', error);
		res.status(500).json({ error: 'Failed to retrieve list of doctors.' });
	}
};

/**
 * Retrieve doctor by ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getDoctor = async (req, res) => {
	const doctorId = parseInt(req.params.doctorId);

	// Check if the doctorId is provided and is a valid number
	if (isNaN(doctorId)) {
		return res.status(400).json({ error: 'Invalid doctor ID.' });
	}

	try {
		const doctor = await Doctor.getById(parseInt(doctorId));

		// Check if the doctor exists
		if (!doctor) {
			return res.status(404).json({ error: 'Doctor not found.' });
		}

		res.status(200).json(doctor);
	} catch (error) {
		console.error('Error retrieving doctor:', error);
		res.status(500).json({ error: 'Failed to retrieve doctor.' });
	}
};

/**
 * Delete a doctor for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the doctor deletion process.
 */
exports.deleteDoctor = async (req, res) => {
	const doctorId = parseInt(req.params.doctorId);

	// Check if the doctorId is provided and is a valid number
	if (isNaN(doctorId)) {
		return res.status(400).json({ error: 'Invalid doctor ID.' });
	}

	try {
		const doctor = await Doctor.getById(parseInt(doctorId));

		// Check if the doctor exists
		if (!doctor) {
			return res.status(404).json({ error: 'Doctor not found.' });
		}

		await Doctor.deleteById(doctorId);
		res.status(200).json({ message: 'Doctor deleted successfully.' });
	} catch (error) {
		console.error('Error deleting doctor:', error);

		if (
			error.message === 'This doctor has appointments. Deletion is forbidden.'
		) {
			return res.status(403).json({ error: error.message });
		}

		res.status(500).json({ error: 'Failed to delete doctor.' });
	}
};
