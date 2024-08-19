const Role = require('../../src/enums/Role');
const MedicalSpecializations = require('../../src/enums/Specialization');
const Doctor = require('../../src/models/doctor');
const {
	DatabaseError,
	NotFoundError,
	ValidationError,
} = require('../../src/utils/customErrors');
const { pool } = require('../../src/utils/database');
const { createTestDoctor } = require('../../src/utils/testHelpers');

// Mock the database module
jest.mock('../../src/utils/database', () => ({
	pool: {
		execute: jest.fn(),
	},
}));

/**
 * Test suite for Doctor Model implementation.
 * Includes methods for registering, updating, deletion and constructing Doctor instances.
 */
describe('Doctor Model', () => {
	let mockDoctorData;
	beforeEach(() => {
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

	// Doctor constructor tests
	describe('Constructor', () => {
		it('should create a new Doctor instance with default values', () => {
			const doctor = createTestDoctor(mockDoctorData);

			// Verify that the properties of the Doctor instance are correctly set
			expect(doctor).toBeInstanceOf(Doctor);
			expect(doctor.firstName).toBe('John');
			expect(doctor.lastName).toBe('Doe');
			expect(doctor.specialization).toBe(MedicalSpecializations.CARDIOLOGY);
			expect(doctor.isActive).toBe(1);
		});
	});

	// Doctor insertion tests
	describe('Insert', () => {
		it('should insert a new doctor and return the new doctor ID', async () => {
			const mockInsertId = 1;
			pool.execute.mockResolvedValue([{ insertId: mockInsertId }]);

			const doctor = createTestDoctor(mockDoctorData);
			const result = await doctor.insert();

			// Verify the correct doctor data was passed to the query and the result matches the mockInsertId
			expect(result).toBe(mockInsertId);
			expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [
				'John',
				'Doe',
				MedicalSpecializations.CARDIOLOGY,
				1,
			]);
		});

		it('should throw DatabaseError on insert failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			const doctor = createTestDoctor(mockDoctorData);

			// Expect a DatabaseError to be thrown when the registration fails
			await expect(doctor.insert()).rejects.toThrow(
				new DatabaseError('Failed to insert doctor.')
			);
		});
	});

	// Retrieve a list of all doctors tests
	describe('Retrieve all doctors', () => {
		it('should return a list of all active doctors for non-admin roles', async () => {
			const mockListDoctors = [mockDoctorData, { doctorId: 2 }];
			pool.execute.mockResolvedValue([mockListDoctors]); // Only active doctors

			const result = await Doctor.getAll(Role.PATIENT);

			// Verify that only doctors who are active are selected from the database
			const expectedQuery = `SELECT doctorId, firstName, lastName, specialization FROM doctor WHERE isActive = 1`;
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery);

			// Verify that the result only contains active doctors
			expect(result).toHaveLength(2);
			expect(result[0].doctorId).toBe(1);
			expect(result[1].doctorId).toBe(2);
		});

		it('should return a list of all doctors for admin roles', async () => {
			const mockListDoctors = [mockDoctorData, { doctorId: 2, isActive: 0 }];
			pool.execute.mockResolvedValue([mockListDoctors]);

			const result = await Doctor.getAll(Role.ADMIN);

			// Verify that the result contains all doctors regardless of their active status
			expect(result).toHaveLength(2);
			expect(result[0].doctorId).toBe(1);
			expect(result[1].doctorId).toBe(2);
			// Verify that all doctors are selected from the database
			const expectedQuery = `SELECT doctorId, firstName, lastName, specialization, isActive FROM doctor `;
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery);
		});

		it('should return empty array when no doctors are found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Doctor.getAll(Role.PATIENT);
			// Expect a null to be returned when no doctors are found
			expect(result).toEqual([]);
		});

		it('should throw DatabaseError on getAll failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown when the getAll fails
			await expect(Doctor.getAll()).rejects.toThrow(
				new DatabaseError('Failed to retrieve doctors.')
			);
		});
	});

	// Tests for retrieving a doctor by their ID
	describe('Find by ID', () => {
		it('should return an active Doctor instance when a doctor is found by ID for non-admin roles', async () => {
			const doctor = createTestDoctor(mockDoctorData);
			pool.execute.mockResolvedValue([[doctor]]);

			const result = await Doctor.getById(1, Role.PATIENT);

			// Verify that the correct doctor data is returned as an instance of the Doctor class
			expect(result).toEqual(mockDoctorData);
			expect(result).toBeInstanceOf(Doctor);
			expect(result.isActive).toBe(1);

			// Verify that the query selects only active doctors from the database
			const expectedQuery = `SELECT doctorId, firstName, lastName, specialization FROM doctor WHERE doctorId = ? AND isActive = 1`;
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [1]);
		});

		it('should return a Doctor instance when a doctor is found by ID for admin roles', async () => {
			const doctor = createTestDoctor(mockDoctorData);
			pool.execute.mockResolvedValue([[doctor]]);

			const result = await Doctor.getById(1, Role.ADMIN);

			// Verify that the correct doctor data is returned as an instance of the Doctor class
			expect(result).toEqual(mockDoctorData);
			expect(result).toBeInstanceOf(Doctor);

			// Verify that the query selects the specified doctor from the database, regardless of their active status
			const expectedQuery = `SELECT doctorId, firstName, lastName, specialization, isActive FROM doctor WHERE doctorId = ? `;
			expect(pool.execute).toHaveBeenCalledWith(expectedQuery, [1]);
		});

		it('should return null when doctor is not found', async () => {
			pool.execute.mockResolvedValue([[]]);

			const result = await Doctor.getById(1, Role.PATIENT);

			// Verify that null is returned when the doctor is not found
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on getById failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown if the query fails
			await expect(Doctor.getById(1, Role.PATIENT)).rejects.toThrow(
				new DatabaseError('Failed to retrieve doctor.')
			);
		});
	});

	// Tests for deleting the specified doctor
	describe('Delete By ID', () => {
		it('should soft delete a doctor successfully', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

			await Doctor.deleteById(1);

			// Verify that the correct SQL query was called to soft delete the doctor by setting isActive to 0
			expect(pool.execute).toHaveBeenCalledWith(
				'UPDATE doctor SET isActive = 0 WHERE doctorId = ?',
				[1]
			);
		});

		it('should throw NotFoundError when doctor is not found', async () => {
			pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

			// Expect a NotFoundError if the doctor with the specified ID does not exist
			await expect(Doctor.deleteById(1)).rejects.toThrow(
				new NotFoundError('Doctor not found.')
			);
		});

		it('should throw ValidationError when doctor has appointments', async () => {
			pool.execute.mockRejectedValue({ code: 'ER_ROW_IS_REFERENCED_2' });

			// Expect a ValidationError if the doctor has existing appointments, preventing deletion
			await expect(Doctor.deleteById(1)).rejects.toThrow(
				new ValidationError(
					'This doctor has appointments. Deletion is forbidden.'
				)
			);
		});

		it('should throw DatabaseError on deleteById failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError if there is a failure during the delete operation
			await expect(Doctor.deleteById(1)).rejects.toThrow(
				new DatabaseError('Failed to delete doctor.')
			);
		});
	});

	// Tests for updating the doctor's information
	describe("Update doctor's information", () => {
		it("should update doctor's information successfully", async () => {
			pool.execute.mockResolvedValue([{ changedRows: 1 }]);
			const updateData = {
				firstName: 'Alex',
				specialization: MedicalSpecializations.DERMATOLOGY,
			};

			await Doctor.updateById(1, updateData);

			// Ensure the doctor's information is updated in the database
			expect(pool.execute).toHaveBeenCalledWith(
				expect.stringContaining('UPDATE doctor SET'),
				['Alex', MedicalSpecializations.DERMATOLOGY, 1]
			);
		});

		it('should throw ValidationError when no valid fields to update', async () => {
			// Expect a ValidationError if the update data object contains no valid fields
			await expect(Doctor.updateById(1, {})).rejects.toThrow(
				new ValidationError('No valid fields to update.')
			);
		});

		it('should throw ValidationError when doctor is not found', async () => {
			pool.execute.mockResolvedValue([{ changedRows: 0 }]);

			// Expect a NotFoundError if the doctor with the specified ID does not exist
			await expect(
				Doctor.updateById(999, { firstName: 'Jane' })
			).rejects.toThrow(new ValidationError('Doctor not found.'));
		});

		it('should throw DatabaseError on updateById failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError if the database operation fails during the update
			await expect(Doctor.updateById(1, { firstName: 'Jane' })).rejects.toThrow(
				new DatabaseError('Failed to update doctor.')
			);
		});
	});

	// Tests for checking if a doctor has appointments
	describe('Has Appointments', () => {
		it('should return true if doctor has appointments', async () => {
			pool.execute.mockResolvedValue([[{ count: 1 }]]);

			const result = await Doctor.hasAppointments(1);

			// Verify that the method returns a truthy value when appointments exist for the specified doctor
			expect(result).toEqual({ count: 1 });
		});

		it('should return null if doctor has no appointments', async () => {
			pool.execute.mockResolvedValue([[{ count: 0 }]]);

			const result = await Doctor.hasAppointments(1);

			// Verify that the method returns null when no appointments are found for the specified doctor
			expect(result).toBeNull();
		});

		it('should throw DatabaseError on hasAppointments failure', async () => {
			pool.execute.mockRejectedValue(new Error('Database error'));

			// Expect a DatabaseError to be thrown if the query fails while checking for appointments
			await expect(Doctor.hasAppointments(1)).rejects.toThrow(
				new DatabaseError('Failed to check doctor appointments.')
			);
		});
	});
});
