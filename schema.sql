CREATE TABLE IF NOT EXISTS user (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

;

null;

undefined;

CREATE TABLE IF NOT EXISTS doctor (
    doctorId INT AUTO_INCREMENT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    specialization ENUM('Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Radiology')
);

CREATE TABLE IF NOT EXISTS schedule (
    scheduleId INT AUTO_INCREMENT PRIMARY KEY,
    doctorId INT NOT NULL,
    day ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    startTime TIME NOT NULL,
    endTime TIME NOT NULL,
    FOREIGN KEY (doctorId) REFERENCES doctor (doctorId)
);

CREATE TABLE IF NOT EXISTS appointment (
    appointmentId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT,
    doctorId INT,
    appointmentTime DATETIME NOT NULL,
    status ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL,
    FOREIGN KEY (doctorId) REFERENCES doctor (doctorId),
    FOREIGN KEY (userId) REFERENCES user (userId)
);

