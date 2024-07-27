/**
 * @enum {string}
 * @readonly
 * @description - Enum for appointments status.
 */
const Status = Object.freeze({
	/** Appointment has been scheduled and confirmed */
	SCHEDULED: 'SCHEDULED',
	/** Appointment has been canceled by the patient */
	CANCELED: 'CANCELED',
});

module.exports = Status;
