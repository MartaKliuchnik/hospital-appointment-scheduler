const Role = require('../../src/enums/Role');
const Status = require('../../src/enums/Status');
const Appointment = require('../../src/models/appointment');
const Schedule = require('../../src/models/schedule');
const {
	ValidationError,
	NotFoundError,
	DatabaseError,
} = require('../../src/utils/customErrors');
const { pool } = require('../../src/utils/database');
const { createTestAppointment } = require('../../src/utils/testHelpers');

// Mock the database module
jest.mock('../../src/utils/database', () => ({
	pool: {
		execute: jest.fn(),
		getConnection: jest.fn(),
	},
}));

// Mock the Schedule model's getAvailableTimeSlots method
jest.mock('../../src/models/schedule', () => ({
	getAvailableTimeSlots: jest.fn(),
}));

/**
 * Test suite for Appointment Model implementation.
 * Includes methods for inserting, retrieving, updating, deletion and constructing Appointment instances.
 */
describe('Appointment Model', () => {
	let mockAppointmentData, mockConnection;

	beforeEach(() => {
		mockAppointmentData = {
			clientId: 1,
			doctorId: 2,
			appointmentTime: '2024-08-17 10:00:00',
			appointmentStatus: Status.SCHEDULED,
			appointmentId: 1,
		};
		mockConnection = {
			execute: jest.fn(),
			beginTransaction: jest.fn(),
			commit: jest.fn(),
			rollback: jest.fn(),
			release: jest.fn(),
		};
		pool.getConnection.mockResolvedValue(mockConnection);
	});

	afterEach(() => {
		jest.clearAllMocks(); // Clears all mocks after each test
	});

	// Appointment constructor tests
	describe('Constructor', () => {
		it('should create a new Appointment instance with default values', () => {
			const appointment = createTestAppointment(mockAppointmentData);

			// Verify that the properties of the Appointment instance are correctly set
			expect(appointment).toBeInstanceOf(Appointment);
			expect(appointment.clientId).toBe(1);
			expect(appointment.doctorId).toBe(2);
			expect(appointment.appointmentTime).toBe('2024-08-17 10:00:00');
			expect(appointment.appointmentStatus).toBe(Status.SCHEDULED);
		});
	});

	// Tests for inserting a new appointment
	describe('Insert a new appointment', () => {
		it('should insert a new appointment and return the new appointment ID', async () => {
			const mockInsertId = 1;
			mockConnection.execute.mockResolvedValueOnce([[{ count: 0 }]]); // Mocking no conflicts with existing appointments
			Schedule.getAvailableTimeSlots.mockResolvedValueOnce([
				new Date('2024-08-17T10:00:00Z'),
			]); // Mocking an available time slot
			mockConnection.execute.mockResolvedValueOnce([
				{ insertId: mockInsertId },
			]); // Mocking the successful insertion and return of the new ID

			const appointment = createTestAppointment(mockAppointmentData);

			const result = await appointment.insertAppointment();

			// Assertions for a successful appointment insertion
			expect(result).toBe(mockInsertId);
			expect(mockConnection.execute).toHaveBeenCalledTimes(2);
			expect(mockConnection.commit).toHaveBeenCalled();
			expect(mockConnection.release).toHaveBeenCalled();
		});

		it('should throw ValidationError if the time slot is not available', async () => {
			mockConnection.execute.mockResolvedValueOnce([[{ count: 1 }]]); // Mocking a conflict indicating the time slot is unavailable

			const appointment = createTestAppointment(mockAppointmentData);

			// Assertions for handling a time slot unavailability error
			await expect(appointment.insertAppointment()).rejects.toThrow(
				new ValidationError('The selected appointment time is not available.')
			);
			// Ensure that the transaction was rolled back and connection was released
			expect(mockConnection.rollback).toHaveBeenCalled();
			expect(mockConnection.release).toHaveBeenCalled();
		});
	});

	// Tests for retrieving an appointment
	describe('Retrieve an appointment', () => {
		it('should return an appointment when found', async () => {
			pool.execute.mockResolvedValue([[mockAppointmentData]]);

			const result = await Appointment.getAppointmentById(1, Role.PATIENT);

			// Expect the result to match the mock appointment data
			expect(result).toEqual(mockAppointmentData);
		});

		it('should return null when appointment is not found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Appointment.getAppointmentById(999, Role.PATIENT);

			// Expect the result to be null when no appointment is found
			expect(result).toBeNull();
		});
	});

	// Tests for validation the appointment time
	describe('Validate the appointment time', () => {
		it('should return true for a future appointment time', () => {
			const futureTime = new Date();
			futureTime.setDate(futureTime.getDate() + 1);

			const result = Appointment.isValidAppointmentTime(
				futureTime.toISOString()
			);

			// Check that a future appointment time is considered valid
			expect(result).toBe(true);
		});

		it('should return false for a past appointment time', () => {
			const futureTime = new Date();
			futureTime.setDate(futureTime.getDate() - 1);

			const result = Appointment.isValidAppointmentTime(
				futureTime.toISOString()
			);

			// Check that a past appointment time is considered invalid
			expect(result).toBe(false);
		});
	});

	// Tests for formatting the appointment response
	describe('Format the appointment response', () => {
		it('should format the appointment time correctly', () => {
			const appointment = createTestAppointment({
				...mockAppointmentData,
				appointmentTime: new Date('2024-08-17T10:00:00.000Z'),
			});

			const formattedAppointment =
				Appointment.formatAppointmentResponse(appointment);

			// Expect the formatted appointment time to match the expected format
			expect(formattedAppointment.appointmentTime).toBe('2024-08-17 10:00:00');
		});
	});

	// Tests for retrieving appointments by client ID
	describe('Retrieve appointments for specified client', () => {
		it('should return all appointments for specified client for admin role', async () => {
			const mockListAppointments = [
				mockAppointmentData,
				{ ...mockAppointmentData, appointmentId: 2 },
			];
			pool.execute.mockResolvedValue(mockListAppointments); // Mocking the return of multiple appointments

			await Appointment.getAppointmentsByClientId(1, Role.ADMIN);

			const expectedQuery =
				'SELECT clientId, doctorId, appointmentTime, appointmentStatus, appointmentId, deletedAt FROM appointment WHERE clientId = ?  ORDER BY appointmentTime ASC';

			// Ensure that the correct query was executed with the expected client ID
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining(expectedQuery),
				[1]
			);
		});

		it('should return only non-deleted appointments for patient role', async () => {
			const mockAppointments = [mockAppointmentData];
			pool.execute.mockResolvedValue([mockAppointments]); // Mocking the return of non-deleted appointments

			await Appointment.getAppointmentsByClientId(1, Role.PATIENT);

			// Ensure that the query includes a condition to exclude deleted appointments
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining('deletedAt IS NULL'),
				[1]
			);
		});
	});

	// Tests for soft deletion an appointment
	describe('Soft deletes', () => {
		it('should soft delete an appointment', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]); // Mocking a successful soft delete operation

			await Appointment.softDeleteAppointment(1, mockConnection);

			// Assert that the execute method was called with the expected query
			expect(mockConnection.execute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE appointment SET deletedAt = NOW()'),
				[1]
			);
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }]); // Mocking no affected rows (appointment not found)

			// Expect the operation to throw a NotFoundError if the appointment does not exist
			await expect(
				Appointment.softDeleteAppointment(999, mockConnection)
			).rejects.toThrow(new NotFoundError('Appointment not found.'));
		});
	});

	// Tests for updating the status of an appointment
	describe('Updates the status', () => {
		it('should update appointment status', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]); // Mocking a successful update operation

			await Appointment.updateAppointmentStatus(1, Status.CANCELED);

			// Assert that the execute method was called with the expected query and parameters
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE appointment SET appointmentStatus = ?'),
				[Status.CANCELED, 1]
			);
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 0 }]); // Mocking no affected rows (appointment not found)

			// Expect the operation to throw a NotFoundError if the appointment does not exist
			await expect(
				Appointment.updateAppointmentStatus(999, Status.COMPLETED)
			).rejects.toThrow(NotFoundError);
		});
	});

	// Tests for changing an appointment time
	describe('Change an appointment time', () => {
		const mockAppointmentId = 1;
		const newAppointmentTime = '2024-08-28 11:00:00';

		it('should change an appointment time', async () => {
			// Mock getting the current appointment by ID
			jest
				.spyOn(Appointment, 'getAppointmentById')
				.mockResolvedValueOnce(mockAppointmentData);
			// Mocking no conflicts with existing appointments
			jest
				.spyOn(Appointment, 'isTimeSlotAvailable')
				.mockResolvedValueOnce({ count: 0 });
			// Mocking an available time slot
			Schedule.getAvailableTimeSlots.mockResolvedValueOnce([
				new Date(newAppointmentTime),
			]);
			// Mock the update operation to confirm the appointment time was changed
			mockConnection.execute.mockResolvedValueOnce([{ changedRows: 1 }]);
			// Mock getting the updated appointment by ID
			jest.spyOn(Appointment, 'getAppointmentById').mockResolvedValueOnce({
				...mockAppointmentData,
				appointmentTime: newAppointmentTime,
			});

			const result = await Appointment.changeAppointmentById(
				newAppointmentTime,
				mockAppointmentId
			);

			// Assertions for a successful appointment change
			expect(result.appointmentTime).toBe(newAppointmentTime);
			expect(mockConnection.beginTransaction).toHaveBeenCalled();
			expect(mockConnection.commit).toHaveBeenCalled();
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			mockConnection.execute.mockResolvedValueOnce([[]]); // Mocking appointment does not exist

			// Expect the operation to throw a NotFoundError if the appointment does not exist
			await expect(
				Appointment.changeAppointmentById(newAppointmentTime, 999)
			).rejects.toThrow(new NotFoundError("Appointment doesn't exist."));
			expect(mockConnection.rollback).toHaveBeenCalled();
		});

		it('should throw ValidationError if the selected appointment time is not available', async () => {
			// Mock getting the current appointment by ID
			jest
				.spyOn(Appointment, 'getAppointmentById')
				.mockResolvedValueOnce(mockAppointmentData);
			// Mocking conflicts with existing appointments
			mockConnection.execute.mockResolvedValueOnce([[{ count: 1 }]]);

			// Expect the operation to throw a ValidationError if the selected appointment time is not available
			await expect(
				Appointment.changeAppointmentById(newAppointmentTime, mockAppointmentId)
			).rejects.toThrow(
				new ValidationError('The selected appointment time is not available.')
			);
			expect(mockConnection.rollback).toHaveBeenCalled();
		});

		it('should throw ValidationError if the selected appointment time is not available', async () => {
			// Mock getting the current appointment by ID
			jest
				.spyOn(Appointment, 'getAppointmentById')
				.mockResolvedValueOnce([mockAppointmentData]);
			// Mocking no conflicts with existing appointments
			jest
				.spyOn(Appointment, 'isTimeSlotAvailable')
				.mockResolvedValueOnce({ count: 0 });
			// Mocking an available time slot
			Schedule.getAvailableTimeSlots.mockResolvedValueOnce([new Date('')]);
			// Mock the update operation to confirm the appointment time was changed
			mockConnection.execute.mockResolvedValueOnce([{ changedRows: 0 }]);

			// Expect the operation to throw a ValidationError if no changes were made to the appointment
			await expect(
				Appointment.changeAppointmentById('', mockAppointmentId)
			).rejects.toThrow(
				new ValidationError('No changes were made to the appointment.')
			);
			expect(mockConnection.rollback).toHaveBeenCalled();
		});
	});

	// Tests for retrieving appointments for a specific doctor and date
	describe('Retrieve appointments for a specific doctor and date', () => {
		it('should return appointments for a doctor on a specific date', async () => {
			const mockDoctorId = 1;
			const mockDate = '2024-08-28 11:00:00';
			const mockListAppointments = [
				createTestAppointment(mockAppointmentData),
				createTestAppointment({ ...mockAppointmentData, appointmentId: 2 }),
			];
			pool.execute.mockResolvedValue([mockListAppointments]); // Mock the database query to return the mock appointments

			const results = await Appointment.getAppointmentsByDoctorAndDate(
				mockDoctorId,
				mockDate
			);

			const expectedQuery = `SELECT clientId, doctorId, appointmentTime, appointmentStatus, appointmentId, deletedAt FROM appointment`;

			// Verify that the correct appointment data is returned
			expect(results).toEqual(mockListAppointments);
			expect(results[0]).toBeInstanceOf(Appointment);

			// Verify that the query executed contains the expected SQL and parameters
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining(expectedQuery),
				[mockDoctorId, mockDate, Status.CANCELED]
			);
		});

		it('should throw a DatabaseError if the database query fails', async () => {
			const mockDoctorId = 1;
			const mockDate = '2024-08-28 11:00:00';

			pool.execute.mockRejectedValue(new Error('DatabaseError')); // Mock the database query to reject with an error

			// Expect the method to throw a DatabaseError
			await expect(
				Appointment.getAppointmentsByDoctorAndDate(mockDoctorId, mockDate)
			).rejects.toThrow(DatabaseError);
			await expect(
				Appointment.getAppointmentsByDoctorAndDate(mockDoctorId, mockDate)
			).rejects.toThrow('Failed to retrieve appointments.');
		});
	});

	// Tests for checking a time slot availability
	describe('Check if a time slot is available', () => {
		const mockDate = '2024-08-28 11:00:00';

		it('should return true if time slot is available', async () => {
			mockConnection.execute.mockResolvedValueOnce([[{ count: 0 }]]); // Mocking no conflicts with existing appointments
			// Mocking an available time slot
			Schedule.getAvailableTimeSlots.mockResolvedValueOnce([
				new Date(mockDate),
			]);

			const result = await Appointment.isTimeSlotAvailable(
				2,
				new Date(mockDate),
				mockConnection
			);

			// Assert that the time slot is available
			expect(result).toBe(true);
		});

		it('should return false if time slot is not available', async () => {
			mockConnection.execute.mockResolvedValueOnce([[{ count: 1 }]]); // Mocking conflicts with existing appointments

			const result = await Appointment.isTimeSlotAvailable(
				2,
				new Date(mockDate),
				mockConnection
			);

			// Assert that the time slot is not available
			expect(result).toBe(false);
		});
	});
});
