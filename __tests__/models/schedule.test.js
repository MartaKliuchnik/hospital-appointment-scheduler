const DaysOfWeek = require('../../src/enums/WeekDay');
const Schedule = require('../../src/models/schedule');
const { createTestScheduler } = require('../../src/utils/testHelpers');
const { pool } = require('../../src/utils/database');
const {
	DatabaseError,
	NotFoundError,
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

	// Tests for inserting a new doctor's schedule
	describe('Insert a new schedule', () => {
		it('should insert a new schedule and return the schedule ID', async () => {
			const mockInsertId = 1;
			pool.execute.mockResolvedValue([{ insertId: mockInsertId }]);

			const schedule = createTestScheduler(mockScheduleData);
			const result = await schedule.insert();

			const expectedQuery =
				'INSERT INTO schedule (doctorId, scheduleDay, startTime, endTime) VALUES (?, ?, ?, ?)';

			// Verify the correct schedule data was passed to the query and the result matches the mockInsertId
			expect(result).toBe(mockInsertId);
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [
				2,
				'MONDAY',
				'09:00:00',
				'17:00:00',
			]);
		});

		it('should throw DatabaseError on create failure', async () => {
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

	// Retrieve a schedules by doctor ID tests
	describe('Retrieve a schedule by doctor ID', () => {
		it('should return schedules successfully', async () => {
			const mockDoctorId = 2;
			const mockListSchedules = [
				createTestScheduler(mockScheduleData),
				createTestScheduler({ ...mockScheduleData, scheduleId: 2 }),
			];
			pool.execute.mockResolvedValue([mockListSchedules]);

			const results = await Schedule.getByDoctorId(mockDoctorId);

			// Verify that the correct schedule data is returned as an instance of the Schedule class
			expect(results[0]).toBeInstanceOf(Schedule);
			expect(results[0].doctorId).toEqual(2);

			const expectedQuery =
				'SELECT doctorId, scheduleDay, startTime, endTime, scheduleId FROM schedule WHERE doctorId = ?';
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [2]);
		});

		it('should return null when schedule is not found', async () => {
			const mockRetrieveId = 999;
			pool.execute.mockResolvedValue([[]]);

			const result = await Schedule.getByDoctorId(mockRetrieveId);

			// Verify that null is returned when the doctor is not found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on retrieve failure', async () => {
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

	// Tests for deleting the specified schedule
	describe('Delete By ID', () => {
		it('should delete a schedule successfully', async () => {
			const mockDeleteId = 1;
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

			await Schedule.deleteById(mockDeleteId);

			// Verify that the correct SQL query was called to soft delete the doctor by setting isActive to 0
			const expectedQuery = 'DELETE FROM schedule WHERE scheduleId = ?';
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [1]);
		});

		it('should throw DatabaseError on retrieve failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the retrieve fails
			await expect(Schedule.deleteById()).rejects.toThrow(
				new DatabaseError('Failed to delete schedule.')
			);
		});
	});
});
