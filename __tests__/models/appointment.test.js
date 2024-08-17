const Role = require('../../src/enums/Role');
const Status = require('../../src/enums/Status');
const Appointment = require('../../src/models/appointment');
const Schedule = require('../../src/models/schedule');
const {
	ValidationError,
	NotFoundError,
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
			mockConnection.execute.mockResolvedValueOnce([[{ count: 0 }]]);
			Schedule.getAvailableTimeSlots.mockResolvedValueOnce([
				new Date('2024-08-17T10:00:00Z'),
			]);
			mockConnection.execute.mockResolvedValueOnce([
				{ insertId: mockInsertId },
			]);

			const appointment = createTestAppointment(mockAppointmentData);

			const result = await appointment.insertAppointment();

			// Assertions for a successful appointment insertion
			expect(result).toBe(mockInsertId);
			expect(mockConnection.execute).toHaveBeenCalledTimes(2);
			expect(mockConnection.commit).toHaveBeenCalled();
			expect(mockConnection.release).toHaveBeenCalled();
		});

		it('should throw ValidationError if the time slot is not available', async () => {
			mockConnection.execute.mockResolvedValueOnce([[{ count: 1 }]]);

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

			const result = await Appointment.getAppointmentById(1);

			expect(result).toEqual(mockAppointmentData);
		});

		it('should return null when appointment is not found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Appointment.getAppointmentById(999);

			// Assertions for retrieving an appointment that does not exist
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

	// Tests formatting the appointment response
	describe('Format the appointment response', () => {
		it('should format the appointment time correctly', () => {
			const appointment = createTestAppointment({
				...mockAppointmentData,
				appointmentTime: new Date('2024-08-17T10:00:00.000Z'),
			});

			const formattedAppointment =
				Appointment.formatAppointmentResponse(appointment);

			expect(formattedAppointment.appointmentTime).toBe('2024-08-17 10:00:00');
		});
	});

	describe('Retrieve appointments for specified client', () => {
		it('should return all appointments for specified client for admin role', async () => {
			const mockListAppointments = [
				mockAppointmentData,
				{ ...mockAppointmentData, appointmentId: 2 },
			];
			pool.execute.mockResolvedValue(mockListAppointments);

			await Appointment.getAppointmentsByClientId(1, Role.ADMIN);

			const expectedQuery =
				'SELECT clientId, doctorId, appointmentTime, appointmentStatus, deletedAt FROM appointment WHERE clientId = ?  ORDER BY appointmentTime ASC';
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining(expectedQuery),
				[1]
			);
		});

		it('should return only non-deleted appointments for patient role', async () => {
			const mockAppointments = [mockAppointmentData];
			pool.execute.mockResolvedValue([mockAppointments]);

			await Appointment.getAppointmentsByClientId(1, Role.PATIENT);

			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining('deletedAt IS NULL'),
				[1]
			);
		});
	});

	// Tests for soft deletion an appointment
	describe('Soft deletes', () => {
		it('should soft delete an appointment', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 1 }]);

			await Appointment.softDeleteAppointment(1, mockConnection);

			expect(mockConnection.execute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE appointment SET deletedAt = NOW()'),
				[1]
			);
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }]);

			await expect(
				Appointment.softDeleteAppointment(999, mockConnection)
			).rejects.toThrow(new NotFoundError('Appointment not found.'));
		});
	});

	// Tests for updating the status of an appointment
	describe('Updates the status', () => {
		it('should update appointment status', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

			await Appointment.updateAppointmentStatus(1, Status.CANCELED);

			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE appointment SET appointmentStatus = ?'),
				[Status.CANCELED, 1]
			);
		});

		it('should throw NotFoundError if appointment does not exist', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

			await expect(
				Appointment.updateAppointmentStatus(999, Status.COMPLETED)
			).rejects.toThrow(NotFoundError);
		});
	});
});
