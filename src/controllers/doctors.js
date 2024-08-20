const MedicalSpecializations = require('../enums/Specialization');
const Doctor = require('../models/doctor');
const {
	NotFoundError,
	DatabaseError,
	ValidationError,
} = require('../utils/customErrors');
const {
	sendSuccessResponse,
	sendErrorResponse,
} = require('../utils/responseHandlers');
const {
	validateDoctorId,
	validateCreatingDoctorInput,
	validateUpdatingDoctorInput,
} = require('../utils/validations');

/**
 * Retrieve list of doctors from database.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.listDoctors = async (req, res, next) => {
	const clientRole = req.client?.role ? req.client.role : 'ANONYMOUS';
	try {
		const doctors = await Doctor.getAll(clientRole);

		// Check if the doctors exist in database
		if (!doctors || doctors.length === 0) {
			throw new NotFoundError('No doctors found in the database.');
		}

		sendSuccessResponse(res, 200, 'Doctors retrieved successfully.', {
			doctors,
		});
	} catch (error) {
		if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve doctors.', error));
		}
	}
};

/**
 * Retrieve doctor by ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment retrieval process.
 */
exports.getDoctor = async (req, res, next) => {
	const doctorId = parseInt(req.params.doctorId);
	const clientRole = req.client?.role ? req.client.role : 'ANONYMOUS';

	try {
		validateDoctorId(doctorId);

		const doctor = await Doctor.getById(doctorId, clientRole);
		// Check if the doctor exists
		if (!doctor) {
			throw new NotFoundError('Doctor not found.');
		}

		sendSuccessResponse(res, 200, 'Doctor retrieved successfully.', doctor);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to retrieve doctor.', error));
		}
	}
};

/**
 * Create a new doctor.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the appointment creation process.
 */
exports.createDoctor = async (req, res, next) => {
	const { firstName, lastName, specialization } = req.body;

	try {
		validateCreatingDoctorInput(firstName, lastName, specialization);

		// Check if doctor already exists
		const existingDoctor = await Doctor.findByNameAndSpecialization(
			firstName,
			lastName,
			specialization
		);
		if (existingDoctor) {
			return sendErrorResponse(
				res,
				409,
				'A doctor with the same name and specialization already exists.'
			);
		}

		const doctor = new Doctor(firstName, lastName, specialization);
		const doctorId = await doctor.insert();

		const doctorDetails = await Doctor.getById(doctorId, req.client.role);

		sendSuccessResponse(
			res,
			201,
			'Doctor created successfully.',
			doctorDetails
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else {
			next(new DatabaseError('Failed to create doctor.', error));
		}
	}
};

/**
 * Delete a doctor for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the doctor deletion process.
 */
exports.deleteDoctor = async (req, res, next) => {
	const doctorId = parseInt(req.params.doctorId);

	try {
		validateDoctorId(doctorId);

		const doctor = await Doctor.getById(doctorId, req.client.role);
		// Check if the doctor exists
		if (!doctor) {
			throw new NotFoundError('Doctor not found.');
		}

		// Additional validation for updating
		const hasAppointments = await Doctor.hasAppointments(doctorId);
		if (hasAppointments) {
			throw new ValidationError(
				'This doctor has appointment(s). Deletion is forbidden.'
			);
		}

		await Doctor.deleteById(doctorId);
		sendSuccessResponse(res, 200, 'Doctor deleted successfully.');
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to delete doctor.', error));
		}
	}
};

/**
 * Update a doctor's information for a specific ID.
 * @param {object} req - The request object.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 * @throws {Error} - If there is an error during the doctor updating process.
 */
exports.updateDoctor = async (req, res, next) => {
	const doctorId = parseInt(req.params.doctorId);

	try {
		validateDoctorId(doctorId);

		const updateData = {
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			specialization: req.body.specialization,
		};
		validateUpdatingDoctorInput(updateData);

		// Check if doctor already exists
		const existingDoctor = await Doctor.findByNameAndSpecialization(
			updateData.firstName,
			updateData.lastName,
			updateData.specialization
		);
		if (existingDoctor) {
			return sendErrorResponse(
				res,
				409,
				'A doctor with the same name and specialization already exists.'
			);
		}

		const doctor = await Doctor.getById(doctorId, req.client.role);
		// Check if the doctor exists
		if (!doctor) {
			throw new NotFoundError('Doctor not found.');
		}

		// Additional validation for updating
		const hasAppointments = await Doctor.hasAppointments(doctorId);
		if (hasAppointments) {
			throw new ValidationError(
				'This doctor has appointment(s). Update is forbidden.'
			);
		}

		if (
			!Object.keys(MedicalSpecializations).includes(
				req.body.specialization?.toUpperCase()
			)
		) {
			throw new ValidationError(
				'Invalid specialization. Please provide a valid specialization from the allowed list.'
			);
		}

		// Remove undefined fields
		Object.keys(updateData).forEach(
			(key) => updateData[key] === undefined && delete updateData[key]
		);

		if (Object.keys(updateData).length === 0) {
			throw new ValidationError('No valid update data provided.');
		}

		const updatedDoctor = await Doctor.updateById(doctorId, updateData);
		sendSuccessResponse(
			res,
			200,
			'Doctor updated successfully.',
			updatedDoctor
		);
	} catch (error) {
		if (error instanceof ValidationError) {
			sendErrorResponse(res, 400, error.message);
		} else if (error instanceof NotFoundError) {
			sendErrorResponse(res, 404, error.message);
		} else {
			next(new DatabaseError('Failed to update doctor.', error));
		}
	}
};
