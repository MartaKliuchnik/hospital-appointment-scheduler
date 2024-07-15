CREATE TABLE IF NOT EXISTS client (
    clientId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phoneNumber VARCHAR(15) NOT NULL UNIQUE,
    registrationDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (phoneNumber REGEXP '^[0-9+() -]*$')
);

CREATE TABLE IF NOT EXISTS doctor (
    doctorId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    specialization ENUM('CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'PEDIATRICS', 'DERMATOLOGY') NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule (
    scheduleId INT AUTO_INCREMENT PRIMARY KEY,
    doctorId INT NOT NULL,
    scheduleDay ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    FOREIGN KEY (doctorId) REFERENCES doctor(doctorId)
);

CREATE TABLE IF NOT EXISTS appointment (
    appointmentId INT AUTO_INCREMENT PRIMARY KEY,
    clientId INT NOT NULL,
    doctorId INT NOT NULL,
    appointmentTime DATETIME NOT NULL,
    appointmentStatus ENUM('SCHEDULED', 'COMPLETED', 'CANCELED') NOT NULL,
    FOREIGN KEY (doctorId) REFERENCES doctor(doctorId),
    FOREIGN KEY (clientId) REFERENCES client(clientId)
);

