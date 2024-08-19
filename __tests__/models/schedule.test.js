const DaysOfWeek = require('../../src/enums/WeekDay');
const Schedule = require('../../src/models/schedule');
const { createTestScheduler } = require('../../src/utils/testHelpers');
const { pool } = require('../../src/utils/database');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../../src/utils/customErrors');

// Mock the database module
jest.mock('../../src/utils/database', () => ({
	pool: {
		execute: jest.fn(),
	},
}));

/**
 * Test suite for Schedule Model implementation.
 * Includes methods for inserting, retrieving, updating, deletion and constructing Schedule instances.
 */
describe('Schedule Model', () => {
	let mockScheduleData;

	beforeEach(() => {
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

	// Schedule constructor tests
	describe('Constructor', () => {
		it('should create a new Schedule instance with default values', () => {
			const schedule = createTestScheduler(mockScheduleData);

			// Verify that the properties of the Schedule instance are correctly set
			expect(schedule).toBeInstanceOf(Schedule);
			expect(schedule.doctorId).toBe(2);
			expect(schedule.scheduleDay).toBe('MONDAY');
			expect(schedule.startTime).toBe('09:00:00');
			expect(schedule.endTime).toBe('17:00:00');
		});
	});

	// Tests for inserting a new schedule
	describe('Insert a new schedule', () => {
		it('should insert a new schedule and return the schedule ID', async () => {
			const mockInsertId = 1;

			// Mock the database call to return a mock insert ID
			pool.execute.mockResolvedValue([{ insertId: mockInsertId }]);

			const schedule = createTestScheduler(mockScheduleData);
			const result = await schedule.insert();

			const expectedQuery =
				'INSERT INTO schedule (doctorId, scheduleDay, startTime, endTime) VALUES (?, ?, ?, ?)';

			// Verify the result is the mock insert ID
			expect(result).toBe(mockInsertId);
			// Verify that the correct SQL query and parameters were used
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [
				2,
				'MONDAY',
				'09:00:00',
				'17:00:00',
			]);
		});

		it('should throw DatabaseError on create failure', async () => {
			// Mock the database call to simulate a failure
			pool.execute.mockRejectedValue(new Error('Database error'));

			const schedule = createTestScheduler(mockScheduleData);

			// Expect a DatabaseError to be thrown when the creation fails
			await expect(schedule.insert()).rejects.toThrow(
				new DatabaseError('Failed to create schedule.')
			);
		});
	});

	// Retrieve a schedule by ID tests
	describe('Retrieve a schedule', () => {
		it('should return a schedule successfully', async () => {
			const mockInsertId = 1;
			const mockSchedule = createTestScheduler(mockScheduleData);
			pool.execute.mockResolvedValue([[mockSchedule]]);

			const result = await Schedule.getById(mockInsertId);

			// Verify that the correct schedule data is returned as an instance of the Schedule class
			expect(result).toBeInstanceOf(Schedule);
			expect(result).toEqual(mockSchedule);

			const expectedQuery =
				'SELECT doctorId, scheduleDay, startTime, endTime, scheduleId FROM schedule WHERE scheduleId = ?';
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [1]);
		});

		it('should return null when schedule is not found', async () => {
			const mockInsertId = 999;
			pool.execute.mockResolvedValue([[]]);

			const result = await Schedule.getById(mockInsertId);

			// Verify that null is returned when the doctor is not found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on retrieve failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the retrieve fails
			await expect(Schedule.getById()).rejects.toThrow(
				new DatabaseError('Failed to retrieve schedule.')
			);
		});
	});

	// Tests for retrieving schedules by doctor ID
	describe('Retrieve a schedule by doctor ID', () => {
		it('should return schedules successfully', async () => {
			const mockDoctorId = 2;
			const mockListSchedules = [
				createTestScheduler(mockScheduleData),
				createTestScheduler({ ...mockScheduleData, scheduleId: 2 }),
			];

			// Mock the database call to return the mock schedules
			pool.execute.mockResolvedValue([mockListSchedules]);

			const results = await Schedule.getByDoctorId(mockDoctorId);

			// Verify that the returned data is an array of Schedule instances
			expect(results[0]).toBeInstanceOf(Schedule);
			expect(results[0].doctorId).toEqual(2);

			const expectedQuery =
				'SELECT doctorId, scheduleDay, startTime, endTime, scheduleId FROM schedule WHERE doctorId = ?';
			// Verify the correct SQL query was executed
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [2]);
		});

		it('should return null when no schedule is found', async () => {
			const mockRetrieveId = 999;

			// Mock the database call to return an empty array
			pool.execute.mockResolvedValue([[]]);

			const result = await Schedule.getByDoctorId(mockRetrieveId);

			// Verify that null is returned when no schedules are found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on retrieve failure', async () => {
			// Mock the database call to simulate a failure
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the retrieve fails
			await expect(Schedule.getByDoctorId()).rejects.toThrow(
				new DatabaseError('Failed to retrieve schedule.')
			);
		});
	});

	// Create a Schedule instance from a database result tests
	describe('Creating a Schedule instance (fromDatabaseResult)', () => {
		it('should create a Schedule instance from a database row', () => {
			const mockDatabaseRow = createTestScheduler(mockScheduleData);

			const schedule = Schedule.fromDatabaseResult(mockDatabaseRow);

			// Verify that the created instance is an instance of Schedule
			expect(schedule).toBeInstanceOf(Schedule);

			// Verify that the Schedule properties match the mock data
			expect(schedule.doctorId).toBe(mockDatabaseRow.doctorId);
			expect(schedule.scheduleDay).toBe(mockDatabaseRow.scheduleDay);
			expect(schedule.startTime).toBe(mockDatabaseRow.startTime);
			expect(schedule.endTime).toBe(mockDatabaseRow.endTime);
			expect(schedule.scheduleId).toBe(mockDatabaseRow.scheduleId);
		});
	});

	// Tests for deleting a specified schedule
	describe('Delete By ID', () => {
		it('should delete a schedule successfully', async () => {
			const mockDeleteId = 1;

			// Mock pool.execute to simulate a successful delete operation
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

			await Schedule.deleteById(mockDeleteId);

			const expectedQuery = 'DELETE FROM schedule WHERE scheduleId = ?';
			// Verify that pool.execute was called with the correct query and parameter
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [1]);
		});

		it('should throw NotFoundError when schedule is not found', async () => {
			// Mock pool.execute to simulate no rows were affected (schedule not found)
			pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

			// Test the case where the schedule does not exist
			await expect(Schedule.deleteById(1)).rejects.toThrow(
				new NotFoundError('Schedule not found.')
			);
		});

		it('should throw DatabaseError on delete failure', async () => {
			// Mock pool.execute to simulate a database error
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Test the case where a database error occurs during deletion
			await expect(Schedule.deleteById()).rejects.toThrow(
				new DatabaseError('Failed to delete schedule.')
			);
		});
	});

	// Tests for updating the schedule
	describe("Update schedule's information", () => {
		it("should update schedule's information successfully", async () => {
			const mockScheduleId = 1;
			const updates = {
				scheduleDay: 'TUESDAY',
				startTime: '10:00:00',
				endTime: '18:00:00',
			};
			const updatedSchedule = createTestScheduler({
				...mockScheduleData,
				...updates,
			});

			// Mock pool.execute to simulate a successful update operation
			pool.execute.mockResolvedValue([{ changedRows: 1 }]);
			// Mock getById to return the updated schedule
			jest.spyOn(Schedule, 'getById').mockResolvedValue(updatedSchedule);

			const result = await Schedule.updateById(mockScheduleId, updates);

			const expectedQuery =
				'UPDATE schedule SET scheduleDay = ?, startTime = ?, endTime = ? WHERE scheduleId = ?';
			// Verify that pool.execute was called with the correct query and parameters
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [
				'TUESDAY',
				'10:00:00',
				'18:00:00',
				mockScheduleId,
			]);

			// Verify that getById was called with the correct schedule ID
			expect(Schedule.getById).toHaveBeenCalledWith(mockScheduleId);
			// Verify that the result matches the updated schedule
			expect(result).toEqual(updatedSchedule);
		});

		it('should throw ValidationError when no valid fields to update', async () => {
			// Expect a ValidationError if no valid fields are provided for update
			await expect(Schedule.updateById(1, {})).rejects.toThrow(
				new ValidationError('No valid fields to update.')
			);
		});

		it('should throw NotFoundError when no changes applied to the schedule', async () => {
			// Mock pool.execute to simulate a scenario where no rows were updated
			pool.execute.mockResolvedValue([{ changedRows: 0 }]);

			// Expect a NotFoundError if no changes were applied to the schedule
			await expect(
				Schedule.updateById(1, { scheduleDay: 'MONDAY' })
			).rejects.toThrow(
				new NotFoundError('No changes applied to the schedule.')
			);
		});

		it('should throw DatabaseError on updateById failure', async () => {
			// Mock pool.execute to simulate a database failure
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError if the database operation fails during the update
			await expect(
				Schedule.updateById(1, { scheduleDay: 'TUESDAY' })
			).rejects.toThrow(new DatabaseError('Failed to update schedule.'));
		});
	});

	// Tests for retrieving available time slots for a specific doctor's schedule
	describe('Retrieve available time slots', () => {
		it('should return available time slots successfully', async () => {
			const mockDoctorId = 1;
			const mockDate = '2024-08-20';
			const mockSchedule = [
				{
					scheduleDay: 'TUESDAY',
					startTime: '09:00:00',
					endTime: '11:00:00',
				},
			];
			const mockAppointments = [
				{ appointmentTime: '2024-08-20T09:20:00Z' },
				{ appointmentTime: '2024-08-20T10:40:00Z' },
			];

			// Mock the getByDoctorId method to return the mock schedule
			jest.spyOn(Schedule, 'getByDoctorId').mockResolvedValue(mockSchedule);
			// Mock the getAppointmentsByDoctorAndDate function to return the mock appointments
			const getAppointmentsByDoctorAndDate = jest
				.fn()
				.mockResolvedValue(mockAppointments);

			const availableSlots = await Schedule.getAvailableTimeSlots(
				mockDoctorId,
				mockDate,
				getAppointmentsByDoctorAndDate
			);

			const expectedSlots = [
				new Date('2024-08-20T09:00:00Z'),
				new Date('2024-08-20T09:40:00Z'),
				new Date('2024-08-20T10:00:00Z'),
				new Date('2024-08-20T10:20:00Z'),
			];

			// Assert that getByDoctorId was called with the correct doctor ID
			expect(Schedule.getByDoctorId).toHaveBeenCalledWith(mockDoctorId);
			// Assert that getAppointmentsByDoctorAndDate was called with the correct arguments
			expect(getAppointmentsByDoctorAndDate).toHaveBeenCalledWith(
				mockDoctorId,
				mockDate
			);
			// Assert that the returned available slots match the expected slots
			expect(availableSlots).toEqual(expectedSlots);
		});

		it('should throw NotFoundError if no schedule is found for the doctor', async () => {
			const mockDoctorId = 1;
			const mockDate = '2024-08-20';

			// Mock getByDoctorId to return null (indicating no schedule found)
			jest.spyOn(Schedule, 'getByDoctorId').mockResolvedValue(null);

			// Assert that calling getAvailableTimeSlots throws a NotFoundError
			await expect(
				Schedule.getAvailableTimeSlots(mockDoctorId, mockDate, jest.fn())
			).rejects.toThrow(
				new NotFoundError('No schedule found for this doctor.')
			);
		});

		it('should throw NotFoundError if doctor is not available on the specified day', async () => {
			const mockDoctorId = 1;
			const mockDate = '2024-08-20';
			const mockSchedule = [createTestScheduler(mockScheduleData)];

			// Mock getByDoctorId to return the mock schedule
			jest.spyOn(Schedule, 'getByDoctorId').mockResolvedValue(mockSchedule);

			// Assert that calling getAvailableTimeSlots throws a NotFoundError
			await expect(
				Schedule.getAvailableTimeSlots(mockDoctorId, mockDate, jest.fn())
			).rejects.toThrow(
				new NotFoundError('Doctor is not available on this day.')
			);
		});
	});
});
