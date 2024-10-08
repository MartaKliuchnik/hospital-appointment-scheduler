const doctorController = require('../../src/controllers/doctors');
const Doctor = require('../../src/models/doctor');
const Role = require('../../src/enums/Role');
const responseHandlers = require('../../src/utils/responseHandlers');
const {
	DatabaseError,
	ValidationError,
} = require('../../src/utils/customErrors');
const { createTestDoctor } = require('../../src/utils/testHelpers');
const validations = require('../../src/utils/validations');
const MedicalSpecializations = require('../../src/enums/Specialization');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/models/doctor'); // Avoids real database operations
jest.mock('../../src/models/appointment'); // Mocks the Appointment model to prevent database interaction
jest.mock('../../src/utils/database'); // Mocks the database module
jest.mock('../../src/utils/validations'); // Simulates validation outcomes

/**
 * Test suite for Doctor controllers.
 * This suite tests functionalities like updating, deleting, and retrieving doctors.
 */
describe('Doctor controller', () => {
	let res, req, next, mockDoctorData;

	beforeEach(() => {
		req = { params: {}, body: {}, client: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
		mockDoctorData = {
			doctorId: 1,
			firstName: 'John',
			lastName: 'Doe',
			specialization: 'CARDIOLOGY',
			isActive: 1,
		};
	});

	afterEach(() => {
		jest.clearAllMocks(); // Clears all mocks after each test
	});

	// Tests for retrieving a list of doctors
	describe('Retrieve doctors', () => {
		it('should retrieve doctors successfully', async () => {
			const mockListDoctors = [
				mockDoctorData,
				{ doctorId: 2, firstName: 'Jane' },
			];

			Doctor.getAll.mockResolvedValue(mockListDoctors); // Mock successful doctor retrieval

			await doctorController.listDoctors(req, res, next);

			// Ensures the getAll method is called and a success response is sent with the list of doctors
			expect(Doctor.getAll).toHaveBeenCalledWith(Role.ANONYMOUS);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Doctors retrieved successfully.',
				{
					doctors: mockListDoctors,
				}
			);
		});

		it('should handle case when no doctors are found', async () => {
			Doctor.getAll.mockResolvedValue([]); // Mock empty array doctor retrieval

			await doctorController.listDoctors(req, res, next);

			// Ensures an error response is sent indicating that no doctors were found in the database
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'No doctors found in the database.'
			);
		});

		it('should handle database error', async () => {
			Doctor.getAll.mockRejectedValue(new Error('Database error'));

			await doctorController.listDoctors(req, res, next);

			// Ensures the next middleware is called with the database error to be handled appropriately
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for retrieving a doctor by their ID
	describe('Retrieve doctor by ID', () => {
		it('should retrieve a doctor by ID successfully', async () => {
			const mockDoctor = createTestDoctor(mockDoctorData);
			req.params.doctorId = 1;
			req.client.role = Role.PATIENT;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctor); // Mock successful doctor retrieval

			await doctorController.getDoctor(req, res, next);

			// Ensures the getById method is called with the correct doctor ID and a success response is sent with the doctor data
			expect(Doctor.getById).toHaveBeenCalledWith(1, Role.PATIENT);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Doctor retrieved successfully.',
				mockDoctor
			);
		});

		it('should handle invalid doctor ID', async () => {
			req.params.doctorId = 'invalid';

			// Mock validation success
			validations.validateDoctorId.mockImplementation(() => {
				throw new ValidationError('Invalid doctor ID.');
			});

			await doctorController.getDoctor(req, res, next);

			// Ensures an error response is sent indicating the doctor ID is invalid
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid doctor ID.'
			);
		});

		it('should handle non-existent doctor', async () => {
			// Scenario: A valid doctor ID is provided, but no doctor is found with that ID
			req.params.doctorId = 999;
			req.client.role = Role.PATIENT;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(null); // Mock scenario where no doctor is found

			await doctorController.getDoctor(req, res, next);

			// Ensures an error response is sent indicating the doctor was not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Doctor not found.'
			);
		});

		it('should handle database error', async () => {
			req.params.doctorId = '1';
			req.client.role = 'PATIENT';
			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockRejectedValue(new Error('Database error')); // Mock database error

			await doctorController.getDoctor(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for creating a new doctor
	describe('Creating a new doctor', () => {
		it('should create a new doctor successfully', async () => {
			const mockInputData = createTestDoctor(mockDoctorData);
			const mockDoctorId = 1;
			const mockDoctorDetails = { id: mockDoctorId, ...mockInputData };
			req.body = mockInputData;
			req.client.role = Role.ADMIN;

			validations.validateCreatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.prototype.insert.mockResolvedValue(mockDoctorId); // Mock successful doctor insertion
			Doctor.getById.mockResolvedValue(mockDoctorDetails); // Mock retrieval of the newly created doctor

			await doctorController.createDoctor(req, res, next);

			// Ensures the insert method is called to create the doctor
			expect(Doctor.prototype.insert).toHaveBeenCalled();
			// Ensures the getById method is called to retrieve the created doctor
			expect(Doctor.getById).toHaveBeenCalledWith(mockDoctorId, Role.ADMIN);
			// Ensures a success response is sent with the created doctor's details
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				201,
				'Doctor created successfully.',
				mockDoctorDetails
			);
		});

		it('should handle missing parameters', async () => {
			req.body = {
				firstName: '',
				lastName: '',
				specialization: '',
			};

			// Mock validation error for missing parameters
			validations.validateCreatingDoctorInput.mockImplementation(() => {
				throw new ValidationError(
					'All fields are required and must be in a valid format.'
				);
			});

			await doctorController.createDoctor(req, res, next);

			// Ensures that an error response is sent indicating missing or invalid parameters
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'All fields are required and must be in a valid format.'
			);
		});

		it('should handle invalid specialization', async () => {
			req.body = {
				firstName: 'Alex',
				specialization: 'invalid',
			};

			// Mock validation error for invalid specialization
			validations.validateCreatingDoctorInput.mockImplementation(() => {
				throw new ValidationError(
					'Invalid specialization. Please provide a valid specialization from the allowed list.'
				);
			});

			await doctorController.createDoctor(req, res, next);

			// Ensures that an error response is sent indicating the specialization is invalid
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid specialization. Please provide a valid specialization from the allowed list.'
			);
		});

		it('should handle database error during doctor creation', async () => {
			const mockDoctorInput = createTestDoctor(mockDoctorData);
			req.body = mockDoctorInput;

			validations.validateCreatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.prototype.insert.mockRejectedValue(new Error('Database error')); // Mock database error during insertion

			await doctorController.createDoctor(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for deleting a doctor
	describe('Deletion a doctor', () => {
		it('should delete a doctor successfully', async () => {
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue(null); // Mock no appointments
			Doctor.deleteById.mockResolvedValue({ affectedRows: 1 }); // Mock successful deletion

			await doctorController.deleteDoctor(req, res, next);

			// Verify that the doctor was deleted and a success response was sent
			expect(Doctor.getById).toHaveBeenCalledWith(1, Role.ADMIN);
			expect(Doctor.hasAppointments).toHaveBeenCalledWith(1);
			expect(Doctor.deleteById).toHaveBeenCalledWith(1);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Doctor deleted successfully.'
			);
		});

		it('should handle invalid doctor ID', async () => {
			req.params.doctorId = 'invalid';

			// Mock validation error for invalid ID
			validations.validateDoctorId.mockImplementation(() => {
				throw new ValidationError('Invalid doctor ID.');
			});

			await doctorController.deleteDoctor(req, res, next);

			// Verify that an error response is sent for the invalid doctor ID
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid doctor ID.'
			);
		});

		it('should handle non-existent doctor', async () => {
			req.params.doctorId = 999; // Sets a non-existent doctor ID
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(null); // Mock scenario where no doctor is found

			await doctorController.deleteDoctor(req, res, next);

			// Verify that an error response is sent when the doctor is not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Doctor not found.'
			);
		});

		it('should prevent deletion of doctor with appointments', async () => {
			// Scenario: Doctor with valid doctor ID, and associated appointments
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue({ count: 1 }); // Mock scenario where doctor has appointment

			await doctorController.deleteDoctor(req, res, next);

			// Verify that deletion is prevented if the doctor has existing appointments
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'This doctor has appointment(s). Deletion is forbidden.'
			);
		});

		it('should handle database error during deletion', async () => {
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue(null); // Mock no appointments
			Doctor.deleteById.mockRejectedValue(new Error('Database error')); // Mock deletion error

			await doctorController.deleteDoctor(req, res, next);

			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for updating a doctor's information
	describe("Updation a doctor's information", () => {
		const mockUpdateData = {
			firstName: 'Alex',
			lastName: 'Smith',
			specialization: MedicalSpecializations.DERMATOLOGY,
		};

		it('should update a doctor successfully', async () => {
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;
			req.body = mockUpdateData;
			const updatedDoctor = createTestDoctor({
				...mockDoctorData,
				...req.body,
			});

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue(null); // Mock no appointments
			Doctor.updateById.mockResolvedValue(updatedDoctor); // Mock successful doctor update

			await doctorController.updateDoctor(req, res, next);

			// Verify that the doctor was updated and a success response was sent
			expect(Doctor.getById).toHaveBeenCalledWith(1, Role.ADMIN);
			expect(Doctor.hasAppointments).toHaveBeenCalledWith(1);
			expect(Doctor.updateById).toHaveBeenCalledWith(1, req.body);
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Doctor updated successfully.',
				updatedDoctor
			);
		});

		it('should handle invalid doctor ID', async () => {
			req.params.doctorId = 'invalid'; // Mock validation error for invalid ID

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {
				throw new ValidationError('All fields are required.');
			});

			await doctorController.updateDoctor(req, res, next);

			// Verify that an error response is sent for the invalid doctor ID
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'All fields are required.'
			);
		});

		it('should handle if doctor already exists', async () => {
			req.params.doctorId = 1;

			validations.validateDoctorId.mockImplementation(() => {
				throw new ValidationError('Invalid doctor ID.');
			});

			await doctorController.updateDoctor(req, res, next);

			// Verify that an error response is sent for the invalid doctor ID
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid doctor ID.'
			);
		});

		it('should handle missing parameters', async () => {
			req.body = {
				firstName: '',
				lastName: '',
				specialization: '',
			};

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			// Mock validation error for missing parameters
			validations.validateUpdatingDoctorInput.mockImplementation(() => {
				throw new ValidationError(
					'All fields are required and must be in a valid format.'
				);
			});

			await doctorController.updateDoctor(req, res, next);

			// Ensures that an error response is sent indicating missing or invalid parameters
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'All fields are required and must be in a valid format.'
			);
		});

		it('should handle non-existent doctor', async () => {
			req.params.doctorId = 999; // Sets a non-existent doctor ID
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(null); // Mock scenario where no doctor is found

			await doctorController.updateDoctor(req, res, next);

			// Verify that an error response is sent when the doctor is not found
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Doctor not found.'
			);
		});

		it('should prevent updating a doctor with appointments', async () => {
			// Scenario: Doctor with valid doctor ID, and associated appointments
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue({ count: 1 }); // Mock doctor has appointment

			await doctorController.updateDoctor(req, res, next);

			// Verify that updation is prevented if the doctor has existing appointments
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'This doctor has appointment(s). Update is forbidden.'
			);
		});

		it('should handle invalid specialization', async () => {
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;
			req.body = { specialization: 'INVALID_SPECIALIZATION' };

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue(null); // Mock no appointments

			await doctorController.updateDoctor(req, res, next);

			// Verify that an error response is sent for an invalid specialization
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid specialization. Please provide a valid specialization from the allowed list.'
			);
		});

		it('should handle database error during update', async () => {
			req.params.doctorId = 1;
			req.client.role = Role.ADMIN;
			req.body = mockUpdateData;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			validations.validateUpdatingDoctorInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockDoctorData); // Mock successful doctor retrieval
			Doctor.hasAppointments.mockResolvedValue(null); // Mock no appointments
			Doctor.updateById.mockRejectedValue(new Error('Database error')); // Mock update error

			await doctorController.updateDoctor(req, res, next);

			// Ensures the next middleware is called with the database error
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});
});
