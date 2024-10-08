USE hospitalAppointmentScheduler;

INSERT INTO client (firstName, lastName, email, password, phoneNumber, role, deletedAt) VALUES ('Emily', 'Smith', 'emily.smith@example.com', 'Smith123', '+1(123)456-7890', 'ADMIN', null),  ('Mohamed', 'Ali', 'mohamed.ali@example.com', 'Ali123', '+1234567890', 'PATIENT', null);

INSERT INTO doctor (firstName, lastName, specialization, isActive) VALUES ('John', 'Doe', 'CARDIOLOGY', 1), ('Jane', 'Smith', 'NEUROLOGY', 1), ('Emily', 'Johnson', 'ONCOLOGY', 1), ('Michael', 'Brown', 'PEDIATRICS', 1), ('Sarah', 'Davis', 'DERMATOLOGY', 1);

INSERT INTO schedule (doctorId, scheduleDay, startTime, endTime) VALUES ("1", "MONDAY", "09:00:00", "12:00:00"), ("1", "WEDNESDAY", "13:00:00", "17:00:00"), ("1", "FRIDAY", "09:00:00", "12:00:00"), ("2", "TUESDAY", "10:00:00", "14:00:00"), ("2", "THURSDAY", "08:00:00", "12:00:00"), ("2", "FRIDAY", "14:00:00", "18:00:00"), ("3", "MONDAY", "08:00:00", "11:00:00"), ("3", "WEDNESDAY", "14:00:00", "18:00:00"), ("3", "FRIDAY", "09:00:00", "13:00:00"), ("4", "TUESDAY", "09:00:00", "13:00:00"), ("4", "THURSDAY", "12:00:00", "16:00:00"), ("4", "FRIDAY", "10:00:00", "14:00:00"), ("5", "MONDAY", "10:00:00", "13:00:00"), ("5", "WEDNESDAY", "09:00:00", "12:00:00"), ("5", "FRIDAY", "11:00:00", "15:00:00");


