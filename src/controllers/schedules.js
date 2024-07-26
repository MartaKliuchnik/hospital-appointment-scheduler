const Doctor = require('../models/doctor');
const Schedule = require('../models/schedule');
const { formatDoctorScheduleResponse } = require('../utils/formatResponse');
const {
	ValidationError,
	NotFoundError,
	DatabaseError,
} = require('../utils/customErrors');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');
const {
	validateScheduleId,
	validateDoctorId,
	validateCreatingScheduleInput,
} = require('../utils/validations');

/**
 * Retrieve schedule by ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getSchedule = async (req, res, next) => {
	const scheduleId = parseInt(req.params.scheduleId);

	try {
		validateScheduleId(scheduleId);

		const schedule = await Schedule.getById(scheduleId);
		// Check if the schedule exists
		if (!schedule) {
			throw new NotFoundError("Schedule doesn't exist.");
		}

		sendSuccessResponse(res, 200, 'Schedule retrieved successfully.', schedule);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(
				new DatabaseError(
					'An error occurred while retrieving the schedule.',
					error
				)
			);
		}
	}
};

/**
 * Create a new schedule.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment creation process.
 */
exports.createSchedule = async (req, res, next) => {
	const { doctorId, scheduleDay, startTime, endTime } = req.body;

	try {
		validateCreatingScheduleInput(doctorId, scheduleDay, startTime, endTime);

		// Check if doctor exists
		const doctorExists = await Doctor.getById(parseInt(doctorId));
		if (!doctorExists) {
			throw new NotFoundError('Doctor not found.');
		}

		const schedule = new Schedule(
			parseInt(doctorId),
			scheduleDay.toUpperCase(),
			startTime,
			endTime
		);

		const scheduleId = await schedule.insert();
		const scheduleDetails = await Schedule.getById(scheduleId);

		sendSuccessResponse(
			res,
			201,
			'Schedule created successfully.',
			scheduleDetails
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(
				new DatabaseError(
					'An error occurred while creating the schedule.',
					error
				)
			);
		}
	}
};

/**
 * Retrieve schedules for a specific doctor.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getDoctorSchedule = async (req, res, next) => {
	const doctorId = parseInt(req.params.doctorId);

	try {
		validateDoctorId(doctorId);

		const result = await Schedule.getByDoctorId(doctorId);
		// Check if the schedules exist for this doctor
		if (!result) {
			throw new NotFoundError('No schedules found for this doctor.');
		}

		const response = formatDoctorScheduleResponse(result);
		sendSuccessResponse(
			res,
			200,
			'Doctor schedules retrieved successfully.',
			response
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(
				new DatabaseError(
					'An error occurred while retrieving the schedule.',
					error
				)
			);
		}
	}
};

/**
 * Delete a schedule for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment deletion process.
 */
exports.deleteSchedule = async (req, res, next) => {
	const scheduleId = parseInt(req.params.scheduleId);

	try {
		validateScheduleId(scheduleId);

		const schedule = await Schedule.getById(scheduleId);
		// Check if the schedule exists
		if (!schedule) {
			throw new NotFoundError('Schedule not found.');
		}

		await Schedule.deleteById(scheduleId);
		sendSuccessResponse(res, 200, 'Schedule deleted successfully.');
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(
				new DatabaseError(
					'An error occurred while deleting the schedule.',
					error
				)
			);
		}
	}
};

/**
 * Update a schedule for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the schedule updating process.
 */
exports.updateSchedule = async (req, res, next) => {
	const scheduleId = parseInt(req.params.scheduleId);

	try {
		validateScheduleId(scheduleId);

		const updateData = {
			scheduleDay: req.body.scheduleDay,
			startTime: req.body.startTime,
			endTime: req.body.endTime,
		};

		// Remove undefined fields
		Object.keys(updateData).forEach(
			(key) => updateData[key] === undefined && delete updateData[key]
		);
		if (Object.keys(updateData).length === 0) {
			throw new ValidationError('No changes applied to the schedule.');
		}

		const schedule = await Schedule.getById(scheduleId);
		// Check if the schedule exists
		if (!schedule) {
			return res.status(404).json({ error: 'Schedule not found' });
		}

		const updatedSchedule = await Schedule.updateById(scheduleId, updateData);

		sendSuccessResponse(
			res,
			200,
			'Schedule updated successfully.',
			updatedSchedule
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else if (error.code === 'ER_DATA_TOO_LONG' || error.errno === 1265) {
			sendErrorResponse(
				res,
				400,
				'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
			);
		} else {
			next(new DatabaseError('Failed to update schedule.', error));
		}
	}
};
