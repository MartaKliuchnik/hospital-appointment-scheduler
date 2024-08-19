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

	// Tests for retrieving a schedule for a specific doctor
	describe('Retrieve schedule for a specific doctor', () => {
		it('should return a schedule successfully', async () => {
			req.params.doctorId = 2;

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Schedule.getByDoctorId.mockResolvedValue(mockScheduleData); // Mock successful schedule retrieval

			await scheduleController.getDoctorSchedule(req, res, next);

			// Ensures that Schedule.getByDoctorId is called with the correct doctor ID
			expect(Schedule.getByDoctorId).toHaveBeenCalledWith(2);
		});

		it('should handle case when no schedules are found for the doctor', async () => {
			req.params.doctorId = 11;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getByDoctorId.mockResolvedValue(null); // Mock that no schedule is found

			await scheduleController.getDoctorSchedule(req, res, next);

			// Ensures that Schedule.getByDoctorId is called with the correct doctor ID
			expect(Schedule.getByDoctorId).toHaveBeenCalledWith(11);
			// Ensures an error response is sent indicating that no schedules were found for the doctor
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'No schedules found for this doctor.'
			);
		});

		it('should throw ValidationError on invalid doctor ID', async () => {
			req.params.doctorId = 'invalid';

			// Mock validation error for invalid doctor ID
			validations.validateDoctorId.mockImplementation(() => {
				throw new ValidationError('Invalid doctor ID.');
			});

			await scheduleController.getDoctorSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid doctor ID.'
			);
		});

		it('should handle database error during retrieval', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue({ scheduleId: 1 }); // Mock retrieving success

			Schedule.deleteById.mockRejectedValue(new Error('Database error')); // Mock a database error

			await scheduleController.deleteSchedule(req, res, next);

			// Ensure the schedule was checked for existence
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));

			validations.validateDoctorId.mockImplementation(() => {}); // Mock validation success
			Schedule.getByDoctorId.mockRejectedValue(new Error('Database error')); // Mock database error

			await scheduleController.getSchedule(req, res, next);

			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for deleting a schedule
	describe('Deletion a schedule', () => {
		it('should delete a schedule successfully', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue(mockScheduleData); // Mock successful schedule retrieval
			Schedule.deleteById.mockResolvedValue(); // Mock successful deletion

			await scheduleController.deleteSchedule(req, res, next);

			// Ensure the schedule was checked for existence and deleted
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			expect(Schedule.deleteById).toHaveBeenCalledWith(1);
			// Ensure a success response is sent
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Schedule deleted successfully.'
			);
		});

		it('should handle case when no schedules are found', async () => {
			req.params.scheduleId = 999;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue(null); // Mock that no schedule is found

			await scheduleController.deleteSchedule(req, res, next);

			// Ensures that Schedule.getById is called with the correct doctor ID
			expect(Schedule.getById).toHaveBeenCalledWith(999);
			// Ensures an error response is sent indicating that no schedules were found for the doctor
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Schedule not found.'
			);
		});

		it('should throw ValidationError on invalid schedule ID', async () => {
			req.params.scheduleId = 'invalid';

			// Mock validation error for invalid schedule ID
			validations.validateScheduleId.mockImplementation(() => {
				throw new ValidationError('Invalid schedule ID.');
			});

			await scheduleController.deleteSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid schedule ID.'
			);
		});

		it('should handle database error during deletion', async () => {
			req.params.scheduleId = 1;

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue({ scheduleId: 1 }); // Mock retrieving success

			Schedule.deleteById.mockRejectedValue(new Error('Database error')); // Mock a database error

			await scheduleController.deleteSchedule(req, res, next);

			// Ensure the schedule was checked for existence
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});

	// Tests for updating a schedule
	describe('Updation a schedule', () => {
		it('should update the schedule successfully', async () => {
			req.params.scheduleId = 1;
			req.body = {
				scheduleDay: 'TUESDAY',
				startTime: '10:00:00',
				endTime: '18:00:00',
			};
			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue({ scheduleId: 1 }); // Mock successful schedule retrieval
			Schedule.updateById.mockResolvedValue({
				scheduleId: 1,
				...req.body,
			});

			await scheduleController.updateSchedule(req, res, next);

			// Ensure the schedule was checked for existence and deleted
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			expect(Schedule.updateById).toHaveBeenCalledWith(1, req.body);
			// Ensure a success response is sent
			expect(responseHandlers.sendSuccessResponse).toHaveBeenCalledWith(
				res,
				200,
				'Schedule updated successfully.',
				{
					scheduleId: 1,
					...req.body,
				}
			);
		});

		it('should handle case when no schedules are found', async () => {
			req.params.scheduleId = 999;
			req.body = {
				scheduleDay: 'TUESDAY',
			};

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue(null); // Mock that no schedule is found

			await scheduleController.updateSchedule(req, res, next);

			// Ensure the schedule was checked for existence
			expect(Schedule.getById).toHaveBeenCalledWith(999);
			// Ensures an error response is sent indicating that no schedules
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				404,
				'Schedule not found.'
			);
		});

		it('should throw ValidationError on invalid scheduleDay', async () => {
			req.params.scheduleId = 1;
			req.body = {
				scheduleDay: 'INVALID_DAY',
			};

			// Mock validation error for invalid scheduleDay
			validations.validateScheduleId.mockImplementation(() => {
				throw new ValidationError(
					'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
				);
			});

			await scheduleController.updateSchedule(req, res, next);

			// Ensures that the ValidationError is thrown and passed to the next middleware
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list.'
			);
		});

		it('should throw NotFoundError when no changes applied to the schedule', async () => {
			req.params.scheduleId = 1;
			req.body = {};

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue({ scheduleId: 1 }); // Mock retrieving success

			await scheduleController.updateSchedule(req, res, next);

			// Expect a NotFoundError if no changes were applied to the schedule
			expect(responseHandlers.sendErrorResponse).toHaveBeenCalledWith(
				res,
				400,
				'No changes applied to the schedule.'
			);
		});

		it('should handle database error during update', async () => {
			req.params.scheduleId = 1;
			req.body = {
				scheduleDay: 'TUESDAY',
			};

			validations.validateScheduleId.mockImplementation(() => {}); // Mock validation success
			Schedule.getById.mockResolvedValue({ scheduleId: 1 }); // Mock retrieving success

			Schedule.updateById.mockRejectedValue(new Error('Database error')); // Mock a database error

			await scheduleController.updateSchedule(req, res, next);

			// Ensure the schedule was checked for existence
			expect(Schedule.getById).toHaveBeenCalledWith(1);
			// Ensures the next middleware is called with a database error for proper error handling
			expect(next).toHaveBeenCalledWith(expect.any(DatabaseError));
		});
	});
});
