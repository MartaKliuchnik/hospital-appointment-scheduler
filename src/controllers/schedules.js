const Doctor = require('../models/doctor');
const Schedule = require('../models/schedule');
const { formatDoctorScheduleResponse } = require('../utils/formatResponse');

/**
 * Retrieve schedule by ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getSchedule = async (req, res) => {
	const scheduleId = parseInt(req.params.scheduleId);

	// Check if the scheduleId is provided and is a valid number
	if (isNaN(scheduleId)) {
		return res.status(400).json({ error: 'Invalid schedule ID.' });
	}

	try {
		const schedule = await Schedule.getById(scheduleId);

		// Check if the schedule exists
		if (!schedule) {
			return res.status(404).json({ error: "Schedule doesn't exist." });
		}

		res.status(200).json(schedule);
	} catch (error) {
		console.error('Error retrieving schedule:', error);
		res.status(500).json({ error: 'Failed to retrieve schedule.' });
	}
};

/**
 * Create a new schedule.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment creation process.
 */
exports.createSchedule = async (req, res) => {
	const { doctorId, scheduleDay, startTime, endTime } = req.body;
	// Check for missing parameters
	if (!doctorId || !scheduleDay || !startTime || !endTime) {
		return res.status(400).json({
			error:
				'Invalid request: Missing required parameters. Please provide doctorId, scheduleDay, startTime, and endTime.',
		});
	}

	const currentDoctorId = parseInt(doctorId);
	// Check if the doctorId is provided and is a valid number
	if (isNaN(currentDoctorId)) {
		return res.status(400).json({ error: 'Invalid doctor ID.' });
	}

	try {
		// Check if doctor exists
		const doctorExists = await Doctor.getById(currentDoctorId);
		if (!doctorExists) {
			return res.status(404).json({ error: 'Doctor not found.' });
		}

		const schedule = new Schedule(
			currentDoctorId,
			scheduleDay,
			startTime,
			endTime
		);

		const scheduleId = await schedule.insert();
		const scheduleDetails = await Schedule.getById(scheduleId);

		const response = {
			message: 'Schedule created successfully.',
			scheduleDetails,
		};

		res.status(201).json(response);
	} catch (error) {
		console.error('Error creating schedule:', error);
		res
			.status(500)
			.json({ error: 'An error occurred while creating the schedule.' });
	}
};

/**
 * Retrieve schedules for a specific doctor.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getDoctorSchedule = async (req, res) => {
	const doctorId = parseInt(req.params.doctorId);
	// Check if the doctorId is provided and is a valid number
	if (isNaN(doctorId)) {
		return res.status(400).json({ error: 'Invalid doctor ID.' });
	}

	try {
		const result = await Schedule.getByDoctorId(doctorId);

		// Check if the schedules exist for this doctor
		if (!result) {
			return res
				.status(404)
				.json({ error: 'No schedules found for this doctor.' });
		}

		const response = formatDoctorScheduleResponse(result);
		res.status(200).json(response);
	} catch (error) {
		console.error('Error Error retrieving schedules:', error);
		res.status(500).json({ error: 'Failed to retrieve doctor schedules.' });
	}
};
