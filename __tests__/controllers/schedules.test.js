const DaysOfWeek = require('../../src/enums/WeekDay');
const scheduleController = require('../../src/controllers/schedules');
const Schedule = require('../../src/models/schedule');
const Doctor = require('../../src/models/doctor');
const responseHandlers = require('../../src/utils/responseHandlers');
const validations = require('../../src/utils/validations');
const {
	ValidationError,
	DatabaseError,
} = require('../../src/utils/customErrors');
const Role = require('../../src/enums/Role');

// Mock dependencies to isolate unit tests
jest.mock('../../src/utils/responseHandlers'); // Controls response handling
jest.mock('../../src/models/doctor'); // Avoids real database operations
jest.mock('../../src/models/schedule'); // Avoids real database operations
jest.mock('../../src/utils/validations'); // Simulates validation outcomes

/**
 * Test suite for Schedule controllers.
 * This suite tests functionalities like updating, deleting, and retrieving schedules.
 */
describe('Schedule controller', () => {
	let res, req, next, mockDoctorData;

	beforeEach(() => {
		req = { params: {}, body: {}, client: {} };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
		mockScheduleData = {
			doctorId: 2,
			scheduleDay: DaysOfWeek.MONDAY,
			startTime: '09:00:00',
			endTime: '17:00:00',
			scheduleId: 1,
		};
	});

	afterEach(() => {
		jest.clearAllMocks(); // Clears all mocks after each test
	});

	// Tests for retrieving a schedule by ID
	describe('Retrieve schedule by ID', () => {
		it('should return a schedule successfully', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue(mockScheduleData); // Mock successful schedule retrieval

			await scheduleController.getSchedule(req, res, next);

			// Ensures that Schedule.getById is called with the correct schedule ID
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			// Ensures a success response is sent with the retrieved schedule data
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Schedule retrieved successfully.',
				mockScheduleData
			);
		});

		it('should throw NotFoundError when schedule is not found', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue(null); // Mock that no schedule is found

			await scheduleController.getSchedule(req, res, next);

			// Ensures that Schedule.getById is called with the correct schedule ID
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			// Ensures an error response is sent indicating that the schedule does not exist
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				"Schedule doesn't exist."
			);
		});

		it('should throw ValidationError on invalid schedule ID', async () => {
			req.params.scheduleId = 'invalid';

			// Mock validation error for invalid schedule ID
			validations.validateScheduleId.mockImplementation(() => {
				throw new ValidationError('Invalid schedule ID.');
			});

			await scheduleController.getSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid schedule ID.'
			);
		});

		it('should handle database error during retrieval', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockRejectedValue(new Error('Database error')); // Mock database error

			await scheduleController.getSchedule(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for creating a new schedule
	describe('Create schedule', () => {
		it('should create a new schedule successfully', async () => {
			req.body = {
				doctorId: 2,
				scheduleDay: 'MONDAY',
				startTime: '09:00:00',
				endTime: '17:00:00',
			};
			req.client.role = 'PATIENT';

			validations.validateCreatingScheduleInput.mockImplementation(() => {}); // Mock validation success
			Doctor.getById.mockResolvedValue(mockScheduleData); // Mock doctor exists
			Schedule.prototype.insert.mockResolvedValue(mockScheduleData.scheduleId); // Mock successful insert
			Schedule.getById.mockResolvedValue(mockScheduleData); // Mock successful schedule retrieval

			await scheduleController.createSchedule(req, res, next);

			expect(validations.validateCreatingScheduleInput).toHaveBeenCalledWith(
				2,
				'MONDAY',
				'09:00:00',
				'17:00:00'
			);

			// Ensures the schedule creation input validation was called with the correct parameters
			expect(Doctor.getById).toHaveBeenCalledWith(2, 'PATIENT');
			// Ensures the Doctor.getById method was called to check if the doctor exists
			expect(Schedule.prototype.insert).toHaveBeenCalled();
			// Ensures the Schedule.getById method was called to retrieve the newly created schedule
			expect(Schedule.getById).toHaveBeenCalledWith(
				mockScheduleData.scheduleId
			);
			// Ensures a success response is sent with the newly created schedule details
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				201,
				'Schedule created successfully.',
				mockScheduleData
			);
		});

		it('should throw ValidationError for missing parameters', async () => {
			req.body = {};

			// Mock validation error for missing parameters
			validations.validateCreatingScheduleInput.mockImplementation(() => {
				throw new ValidationError(
					'All fields are required and must be in a valid format.'
				);
			});

			await scheduleController.createSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'All fields are required and must be in a valid format.'
			);
		});

		it('should throw ValidationError for invalid scheduleDay', async () => {
			req.body = { scheduleDay: 'invalid' };

			// Mock validation error for invalid scheduleDay
			validations.validateCreatingScheduleInput.mockImplementation(() => {
				throw new ValidationError(
					'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
				);
			});

			await scheduleController.createSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
			);
		});

		it('should throw ValidationError for invalid doctorId', async () => {
			req.body = { doctorId: 'invalid' };

			// Mock validation error for invalid doctorId
			validations.validateCreatingScheduleInput.mockImplementation(() => {
				throw new ValidationError('Invalid doctor ID.');
			});

			await scheduleController.createSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid doctor ID.'
			);
		});

		it('should handle database error during creation', async () => {
			req.params.scheduleId = 1;

			validations.validateCreatingScheduleInput.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockRejectedValue(new Error('Database error')); // Mock database error

			await scheduleController.createSchedule(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});
});
