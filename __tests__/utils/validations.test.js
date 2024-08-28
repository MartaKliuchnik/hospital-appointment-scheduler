const Appointment = require('../../src/models/appointment');
const Client = require('../../src/models/client');
const Doctor = require('../../src/models/doctor');
const {
	ValidationError,
	ConflictError,
	AuthenticationError,
	NotFoundError,
	AuthorizationError,
} = require('../../src/utils/customErrors');
const {
	validateRegistrationInput,
	validateLoginInput,
	validateAppointmentCreation,
	validateClientAppointmentAccess,
	validateAppointmentDeletion,
	validateAppointmentUpdate,
	validateDoctorId,
	validateScheduleId,
	validateClientId,
	validateCreatingScheduleInput,
	validateUpdatingScheduleInput,
	validateCreatingDoctorInput,
	validateClientDeletion,
	validateUpdatingDoctorInput,
} = require('../../src/utils/validations');

// Mock dependencies to isolate unit tests
jest.mock('../../src/models/client');
jest.mock('../../src/models/doctor');
jest.mock('../../src/models/appointment');
/**
 * Test suite for validation utilities.
 * This suite includes tests for validating inputs and data.
 */
describe('Validations', () => {
	const mockClient = {
		clientId: 1,
		firstName: 'Carlos',
		lastName: 'Gonzalez',
		phoneNumber: '+1(456)555-0123',
		email: 'gonzalez@example.com',
		password: 'Gonzalez123',
		role: 'PATIENT',
		registrationDate: '2024-07-31T11:32:38.000Z',
		deletedAt: null,
	};

	const mockDoctor = {
		doctorId: 1,
		firstName: 'John',
		lastName: 'Doe',
		specialization: 'CARDIOLOGY',
		isActive: 1,
	};

	const mockAppointment = {
		appointmentId: 3,
		clientId: 2,
		doctorId: 1,
		appointmentTime: '2024-08-17 10:00:00',
		appointmentStatus: 'SCHEDULED',
	};

	const mockSchedule = {
		doctorId: 2,
		scheduleDay: 'MONDAY',
		startTime: '09:00:00',
		endTime: '17:00:00',
		scheduleId: 1,
	};

	// Tests for validation registration input
	describe('Validation of registration input', () => {
		const validInput = {
			firstName: 'Carlos',
			lastName: 'Gonzalez',
			phoneNumber: '+1(456)555-0123',
			email: 'gonzalez@example.com',
			password: 'Gonzalez123',
		};

		// Clear any mocks after each test to avoid interference between tests.
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should throw ValidationError if any field is missing', async () => {
			const invalidInputs = [
				{ ...validInput, firstName: '' },
				{ ...validInput, lastName: '' },
				{ ...validInput, phoneNumber: '' },
				{ ...validInput, email: '' },
				{ ...validInput, password: '' },
			];

			for (const input of invalidInputs) {
				// Expect ValidationError to be thrown when any field is an empty string
				await expect(
					validateRegistrationInput(
						input.firstName,
						input.lastName,
						input.phoneNumber,
						input.email,
						input.password
					)
				).rejects.toThrow(ValidationError);
			}
		});

		it('should throw ValidationError if email is invalid', async () => {
			Client.validateEmail.mockReturnValue(false); // Mock email validation failure

			// Expect ValidationError with a specific message when the email is invalid
			await expect(
				validateRegistrationInput(
					validInput.firstName,
					validInput.lastName,
					validInput.phoneNumber,
					'invalid-email',
					validInput.password
				)
			).rejects.toThrow(new ValidationError('Invalid email address.'));
			// Ensure that validateEmail was called with the invalid email
			expect(Client.validateEmail).toHaveBeenCalledWith('invalid-email');
		});

		it('should throw ValidationError if phone number is invalid', async () => {
			Client.validateEmail.mockReturnValue(true); // Mock email validation success
			Client.validatePhone.mockReturnValue(false); // Mock phone number validation failure

			// Expect ValidationError with a specific message when the phone number is invalid
			await expect(
				validateRegistrationInput(
					validInput.firstName,
					validInput.lastName,
					'invalid-phone',
					validInput.email,
					validInput.password
				)
			).rejects.toThrow(new ValidationError('Invalid phone number.'));
			// Ensure that validatePhone was called with the invalid phone number
			expect(Client.validatePhone).toHaveBeenCalledWith('invalid-phone');
		});

		it('should throw ConflictError if email is already in use', async () => {
			Client.validateEmail.mockReturnValue(true); // Mock email validation success
			Client.validatePhone.mockReturnValue(true); // Mock phone number validation success
			Client.findByEmail.mockResolvedValue(true); // Mock email already in use

			// Expect ConflictError with a specific message when the email is already in use
			await expect(
				validateRegistrationInput(
					validInput.firstName,
					validInput.lastName,
					validInput.phoneNumber,
					validInput.email,
					validInput.password
				)
			).rejects.toThrow(new ConflictError('Email already in use.'));
			// Ensure that findByEmail was called with the email in use
			expect(Client.findByEmail).toHaveBeenCalledWith(validInput.email);
		});

		it('should throw ConflictError if phone number is already in use', async () => {
			Client.validateEmail.mockReturnValue(true); // Mock email validation success
			Client.validatePhone.mockReturnValue(true); // Mock phone number validation success
			Client.findByEmail.mockResolvedValue(null); // Mock email not in use
			Client.findByPhoneNumber.mockResolvedValue(true); // Mock phone number already in use

			// Expect ConflictError with a specific message when the phone number is already in use
			await expect(
				validateRegistrationInput(
					validInput.firstName,
					validInput.lastName,
					validInput.phoneNumber,
					validInput.email,
					validInput.password
				)
			).rejects.toThrow(new ConflictError('Phone number already in use.'));
			// Ensure that findByPhoneNumber was called with the phone number in use
			expect(Client.findByPhoneNumber).toHaveBeenCalledWith(
				validInput.phoneNumber
			);
		});
	});

	// Tests for validation login input
	describe('Validation of login input', () => {
		it('should throw ValidationError if email is missing', () => {
			// Test with empty string
			expect(() => validateLoginInput('', 'Gonzalez123')).toThrow(
				new ValidationError('Email and password are required.')
			);
			// Test with undefined value
			expect(() => validateLoginInput(undefined, 'Gonzalez123')).toThrow(
				new ValidationError('Email and password are required.')
			);
		});

		it('should throw ValidationError if password is missing', () => {
			// Test with empty string
			expect(() => validateLoginInput('gonzalez@example.com', '')).toThrow(
				new ValidationError('Email and password are required.')
			);

			// Test with undefined value
			expect(() =>
				validateLoginInput('gonzalez@example.com', undefined)
			).toThrow(new ValidationError('Email and password are required.'));
		});

		it('should not throw ValidationError if both email and password are provided', () => {
			// Test with valid inputs
			expect(() =>
				validateLoginInput('test@example.com', 'Gonzalez123')
			).not.toThrow();
		});
	});

	// Tests for appointment creation validation
	describe('Validation of appointment creation', () => {
		it('should throw AuthenticationError if clientId is missing', async () => {
			// Expect an AuthenticationError if clientId is not provided
			await expect(
				validateAppointmentCreation(null, 1, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);
		});

		it('should throw ValidationError if doctorId is missing', async () => {
			// Expect a ValidationError if doctorId is not provided
			await expect(
				validateAppointmentCreation(1, null, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(
				new ValidationError(
					'Invalid request: doctorId and appointmentTime are required parameters.'
				)
			);
		});

		it('should throw ValidationError if appointmentTime is missing', async () => {
			// Expect a ValidationError if appointmentTime is not provided
			await expect(
				validateAppointmentCreation(1, 1, '', 'PATIENT')
			).rejects.toThrow(
				new ValidationError(
					'Invalid request: doctorId and appointmentTime are required parameters.'
				)
			);
		});

		it('should throw NotFoundError if client does not exist', async () => {
			Client.findById.mockResolvedValue(null); // Mock client not found

			// Expect a NotFoundError if the client with the given clientId does not exist
			await expect(
				validateAppointmentCreation(1, 1, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(new NotFoundError('Client not found.'));
		});

		it('should throw NotFoundError if doctor does not exist', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found
			Doctor.getById.mockResolvedValue(null); // Mock doctor not found

			// Expect a NotFoundError if the client with the given clientId does not exist
			await expect(
				validateAppointmentCreation(1, 1, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(new NotFoundError('Doctor not found.'));
		});

		it('should throw ValidationError if appointment time is invalid', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found
			Doctor.getById.mockResolvedValue(mockDoctor); // Mock doctor found
			Appointment.isValidAppointmentTime.mockReturnValue(false); // Mock invalid appointment time

			// Expect a ValidationError if the appointment time is not valid
			await expect(
				validateAppointmentCreation(1, 1, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(
				new ValidationError(
					'Invalid appointment time. Please choose a future date and time.'
				)
			);
		});

		it('should not throw ValidationError with valid input', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found
			Doctor.getById.mockResolvedValue(mockDoctor); // Mock doctor found
			Appointment.isValidAppointmentTime.mockReturnValue(true); // Mock valid appointment time

			// Expect no error to be thrown with valid clientId, doctorId, appointmentTime, and clientRole
			await expect(
				validateAppointmentCreation(1, 1, '2024-08-17 10:00:00', 'PATIENT')
			).resolves.not.toThrow();
		});
	});

	// Tests for client appointment access validation
	describe('Validation of client appointment access', () => {
		it('should throw NotFoundError if client does not exist', async () => {
			Client.findById.mockResolvedValue(null); // Mock client not found

			// Expect a NotFoundError if the client with the given clientId does not exist
			await expect(
				validateClientAppointmentAccess(1, 1, 'PATIENT')
			).rejects.toThrow(new NotFoundError('Client not found.'));
		});

		it('should throw AuthorizationError if client does not match and role is not ADMIN', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found

			// Expect an AuthorizationError if the currentClient is different from clientId and role is not ADMIN
			await expect(
				validateClientAppointmentAccess(2, 1, 'PATIENT')
			).rejects.toThrow(
				new AuthorizationError(
					'You have permission to view only your own appointments.'
				)
			);
		});

		it('should not throw an error if role is ADMIN', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found

			// Expect no error if the role is ADMIN, regardless of clientId
			await expect(
				validateClientAppointmentAccess(2, 1, 'ADMIN')
			).resolves.not.toThrow();
		});

		it('should not throw ValidationError if clientId matches currentClient', async () => {
			Client.findById.mockResolvedValue(mockClient); // Mock client found

			// Expect no error if the clientId is the same as currentClient
			await expect(
				validateClientAppointmentAccess(1, 1, 'PATIENT')
			).resolves.not.toThrow();
		});
	});

	// Tests for appointment deletion validation
	describe('Validation of appointment deletion', () => {
		it('should throw AuthenticationError if clientId is missing', async () => {
			// Expect AuthenticationError if clientId is not provided
			await expect(
				validateAppointmentDeletion(3, null, 'PATIENT')
			).rejects.toThrow(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);
		});

		it('should throw ValidationError if appointmentId is not a valid number', async () => {
			// Expect a ValidationError if the appointmentId invalid
			await expect(
				validateAppointmentDeletion('invalid', 2, 'PATIENT')
			).rejects.toThrow(new ValidationError('Invalid appointment ID.'));
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			Appointment.getAppointmentById.mockResolvedValue(null); // Mock appointment not found

			// Expect NotFoundError if the appointment with the given appointmentId does not exist
			await expect(
				validateAppointmentDeletion(3, 2, 'PATIENT')
			).rejects.toThrow(new NotFoundError('Appointment not found.'));
		});

		it('should throw AuthorizationError if appointment does not belong to client and role is not ADMIN', async () => {
			Appointment.getAppointmentById.mockResolvedValue(mockAppointment); // Mock appointment found

			// Expect AuthorizationError if the appointment does not belong to the client and role is not ADMIN
			await expect(
				validateAppointmentDeletion(3, 11, 'PATIENT')
			).rejects.toThrow(
				new AuthorizationError(
					'You do not have permission to delete this appointment.'
				)
			);
		});
	});

	// Tests for appointment update validation
	describe('Validation of appointment update', () => {
		it('should throw AuthenticationError if clientId is missing', async () => {
			// Expect AuthenticationError if clientId is not provided
			await expect(
				validateAppointmentUpdate(3, null, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(
				new AuthenticationError('Authentication failed: Missing client ID.')
			);
		});

		it('should throw ValidationError if appointmentId is not a valid number', async () => {
			// Expect a ValidationError if the appointmentId invalid
			await expect(
				validateAppointmentUpdate(
					'invalid',
					2,
					'2024-08-17 10:00:00',
					'PATIENT'
				)
			).rejects.toThrow(new ValidationError('Invalid appointment ID.'));
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			Appointment.getAppointmentById.mockResolvedValue(null); // Mock appointment not found

			// Expect NotFoundError if the appointment with the given appointmentId does not exist
			await expect(
				validateAppointmentUpdate(3, 2, '2024-08-17 10:00:00', 'PATIENT')
			).rejects.toThrow(new NotFoundError("Appointment doesn't exist."));
		});

		it('should throw ValidationError if appointment time is invalid', async () => {
			Appointment.getAppointmentById.mockResolvedValue(mockAppointment); // Mock appointment found
			Appointment.isValidAppointmentTime.mockReturnValue(false); // Mock invalid appointment time

			// Expect ValidationError if the appointment time is invalid
			await expect(
				validateAppointmentUpdate(3, 2, 'invalid', 'PATIENT')
			).rejects.toThrow(
				new ValidationError(
					'Invalid appointment time. Please choose a future date and time.'
				)
			);
		});
	});

	// Tests for ID validation functions
	describe('Validation of IDs', () => {
		it('should throw ValidationError if doctorId is not a valid number', async () => {
			// Expect ValidationError if doctorId is invalid
			await expect(() => validateDoctorId('invalidDoctorId')).toThrow(
				new ValidationError('Invalid doctor ID.')
			);
		});

		it('should not throw an error for valid doctorId', () => {
			// Expect no error for valid doctorId
			expect(() => validateDoctorId(1)).not.toThrow();
		});

		it('should throw ValidationError if scheduleId is not a valid number', () => {
			// Expect ValidationError if scheduleId is invalid
			expect(() => validateScheduleId('invalidScheduleId')).toThrow(
				new ValidationError('Invalid schedule ID.')
			);
		});

		it('should not throw an error for valid scheduleId', () => {
			// Expect no error for valid scheduleId
			expect(() => validateScheduleId(1)).not.toThrow();
		});

		it('should throw ValidationError if clientId is missing or not a valid number', () => {
			// Expect ValidationError if clientId is invalid or missing
			expect(() => validateClientId('invalidClientId')).toThrow(
				new ValidationError('Invalid client ID.')
			);
			expect(() => validateClientId(undefined)).toThrow(
				new ValidationError('Invalid client ID.')
			);
		});

		it('should not throw an error for valid clientId', () => {
			// Expect no error for valid clientId
			expect(() => validateClientId(1)).not.toThrow();
		});
	});

	// Tests for schedule creation input
	describe('Validation of schedule creation input', () => {
		it('should throw ValidationError if any field is missing', () => {
			const invalidInputs = [
				{
					doctorId: mockSchedule.doctorId,
					scheduleDay: '',
					startTime: mockSchedule.startTime,
					endTime: mockSchedule.endTime,
				},
				{
					doctorId: mockSchedule.doctorId,
					scheduleDay: '',
					startTime: mockSchedule.startTime,
					endTime: mockSchedule.endTime,
				},
				{
					doctorId: mockSchedule.doctorId,
					scheduleDay: mockSchedule.scheduleDay,
					startTime: '',
					endTime: mockSchedule.endTime,
				},
				{
					doctorId: mockSchedule.doctorId,
					scheduleDay: mockSchedule.scheduleDay,
					startTime: mockSchedule.startTime,
					endTime: '',
				},
			];

			for (const input of invalidInputs) {
				expect(() =>
					validateCreatingScheduleInput(
						input.doctorId,
						input.scheduleDay,
						input.startTime,
						input.endTime
					)
				).toThrow(
					new ValidationError(
						'All fields are required and must be in a valid format.'
					)
				);
			}
		});

		it('should throw ValidationError if scheduleDay is invalid', () => {
			// Expect ValidationError for an invalid scheduleDay
			expect(() =>
				validateCreatingScheduleInput(
					mockSchedule.doctorId,
					'invalidScheduleDay',
					mockSchedule.startTime,
					mockSchedule.endTime
				)
			).toThrow(
				new ValidationError(
					'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
				)
			);
		});

		it('should throw ValidationError if doctorId is not a valid number', () => {
			// Expect ValidationError for invalid doctorId
			expect(() =>
				validateCreatingScheduleInput(
					'invalidDoctorId',
					mockSchedule.scheduleDay,
					mockSchedule.startTime,
					mockSchedule.endTime
				)
			).toThrow(new ValidationError('Invalid doctor ID.'));
		});

		it('should not throw an error for valid input', () => {
			// Expect no error for valid inputs
			expect(() =>
				validateCreatingScheduleInput(
					mockSchedule.doctorId,
					mockSchedule.scheduleDay,
					mockSchedule.startTime,
					mockSchedule.endTime
				)
			).not.toThrow();
		});
	});

	// Tests for validation of client deletion
	describe('Validation of client deletion', () => {
		it('should throw ValidationError if clientId is missing or invalid', async () => {
			// Expect ValidationError if clientId is invalid or missing
			await expect(validateClientDeletion('invalid')).rejects.toThrow(
				new ValidationError('Invalid client ID.')
			);
			await expect(validateClientDeletion(undefined)).rejects.toThrow(
				new ValidationError('Invalid client ID.')
			);
		});

		it('should throw ConflictError if the client has appointments', async () => {
			const clientId = 1;
			Appointment.getAppointmentsByClientId.mockResolvedValue({
				appointments: [
					{ appointmentIdId: 1, appointmentTime: '2024-08-17 10:00:00' },
				],
			});
			// Expect ConflictError if client has appointments
			await expect(validateClientDeletion(clientId)).rejects.toThrow(
				new ConflictError(
					'This client has appointment(s). Deletion is forbidden.'
				)
			);
		});
	});

	// Tests for validation of schedule update input
	describe('Validation of schedule update input', () => {
		it('should throw ValidationError if any field is missing', () => {
			const invalidInputs = [
				{
					scheduleDay: '',
					startTime: mockSchedule.startTime,
					endTime: mockSchedule.endTime,
				},
				{
					scheduleDay: mockSchedule.scheduleDay,
					startTime: '',
					endTime: '17:00',
				},
				{
					scheduleDay: mockSchedule.scheduleDay,
					startTime: mockSchedule.startTime,
					endTime: '',
				},
				{ scheduleDay: '', startTime: '', endTime: '' },
			];

			for (const input of invalidInputs) {
				// Expect ValidationError if field is missing
				expect(() => validateUpdatingScheduleInput(input)).toThrow(
					new ValidationError('All fields are required.')
				);
			}
		});
	});

	// Tests for validation creating doctor input
	describe('Validation of creating doctor input', () => {
		it('should throw ValidationError if specialization is invalid', () => {
			// Expect ValidationError if specialization is invalid
			expect(() =>
				validateCreatingDoctorInput('John', 'Doe', 'invalid')
			).toThrow(
				new ValidationError(
					'Invalid specialization. Please provide a valid specialization from the allowed list.'
				)
			);
		});
	});

	// Tests for validation updating doctor input
	describe('Validation of updating doctor input', () => {
		it('should throw ValidationError if any required field is missing', () => {
			const invalidInputs = [
				{
					firstName: '',
					lastName: mockDoctor.lastName,
					specialization: mockDoctor.specialization,
				},
				{
					firstName: mockDoctor.firstName,
					lastName: '',
					specialization: mockDoctor.specialization,
				},
				{
					firstName: mockDoctor.firstName,
					lastName: mockDoctor.lastName,
					specialization: '',
				},
				{ firstName: '', lastName: '', specialization: '' },
			];

			for (const input of invalidInputs) {
				// Expect ValidationError if field is missing
				expect(() => validateUpdatingDoctorInput(input)).toThrow(
					new ValidationError(
						'All fields are required and must be in a valid format.'
					)
				);
			}
		});

		it('should not throw an error for valid inputs', () => {
			const validInput = {
				firstName: mockDoctor.firstName,
				lastName: mockDoctor.lastName,
				specialization: mockDoctor.specialization,
			};

			// Expect no error for valid inputs
			expect(() => validateUpdatingDoctorInput(validInput)).not.toThrow();
		});
	});
});
