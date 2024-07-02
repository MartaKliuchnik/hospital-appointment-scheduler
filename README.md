# Hospital Appointment Scheduler

## Table of Contents

1. [Description](#description)
2. [Technical requirements](#technical-requirements)
3. [Base URL](#base-url)
4. [API Documentation](#api-documentation)

   4.1 [User Management](#user-management)

   - Endpoint /api/auth/register
   - Endpoint /api/auth/login

     4.2 [Doctor Management](#doctor-management)

   - Endpoint /api/doctors

     4.3 [Specialization Management](#specialization-management)

   - Endpoint /api/specializations

     4.4 [Appointment Management](#appointment-management)

   - Endpoint /api/appointments
   - Endpoint /api/:userId/appointments
   - Endpoint /api/:userId/appointments/:appointmentId

5. [Install](#install)
6. [Running in Docker ContainerRun](#run)

## Description

The Node.js back-end serves as the backbone of the Hospital Appointment
Scheduler, facilitating both urgent consultations and routine check-ups. It
plays a crucial role in managing the scheduling process, including:

- **Authentication and Authorization**: To ensure secure access to the system,
  the server implements robust authentication and authorization mechanisms. This
  ensures that only authorized users can access sensitive information and
  perform actions within the application.
- **Managing Data**: The server is responsible for storing and managing patient
  information, doctor schedules, and appointment details. It handles tasks such
  as creating new appointments, updating existing ones, and canceling
  appointments when necessary, as well as retrieving information about patients'
  appointment request and doctor schedules from the database.

## Technical requirements

Project is created with:

- Programming Language: Node.js.
- Web application framework: Express.js.
- Database: MySQL.
- Containerization: Docker.

## Base URL

The base URL for accessing the Hospital Appointment Scheduler API is:

`http://localhost:8080/api`

## API Documentation

### User Management

#### 1. Register a new user

Endpoint

- URL Path: **_/api/auth/register_**
- Description: This endpoint registers a new user. It accepts user details in
  the request body and returns a response indicating the result of the
  registration process.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body must be in JSON format and include the following fields:

- username: (string, required) - The username for the new user.
- email: (string, required) - The email address for the new user. Must be a
  valid email format.
- password: (string, required) - The password for the new user. Should meet
  security requirements such as minimum length, inclusion of special characters.

**Example Request**

Description: POST request to the user registration endpoint. It includes a JSON
payload in the request body with the user's desired username, email, and
password for registration.

```
curl -X POST http://localhost:8080/api/auth/register \
-H "Content-Type: application/json" \
-d '{
  "username": "username",
  "email": "email@example.com",
  "password": "password"
}'
```

**Responses**

Status code: **201 Created**

Description: The user has been successfully registered. The response includes a
success message and the userId of the newly created user.

```
{
  "message": "User registered successfully",
  "userId": 1
}
```

Status code: **409 Conflict**

Description: The provided email address is already registered with another user.

```
{
   "error": "Email already in use"
}
```

Status code: **400 Bad Request**

Description: The provided email address or password is not in a valid format.

```
{
   "error": "Invalid email or password"
}
```

#### 2. Logs a user into the system

Endpoint

- URL Path: **_/api/auth/login_**
- Description: This endpoint logs a user into the system by validating their
  email and password. Upon successful authentication, the user receives a JSON
  Web Token (JWT) which is used for subsequent authenticated requests.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body should be in JSON format and include the following fields:

- email: The user's email address;
- password: The user's password.

**Example Request**

Description: POST request to the login endpoint for user authentication. It
includes a JSON payload in the request body with the user's email and password.

```
curl -X POST http://localhost:8080/api/users/login \
-H "Content-Type: application/json" \
-d '{
  "email": "email@example.com",
  "password": "password"
}'
```

**Responses**

Status code: **200 OK**

Description: This status indicates that the login request was successful. The
server responds with a JSON object containing a JWT token and user information.

```
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    user:{
        "userId": 1
        "username": "username",
        "email": "email@example.com",
        "password": "password",
        "createdAt": “2024-01-02 10:00:00”
    }
}
```

Status code: **401 Unauthorized**

Description: The login request failed due to incorrect email or password.

```
{
   "error": "Incorrect email or password"
}
```

### Doctor Management

#### 1. Retrieves a list of all doctors and their schedules

Endpoint

- URL Path: **_/api/doctors_**
- Description: This endpoint retrieves a list of all doctors along with their
  schedules. Client sends a GET request to the server to retrieve a list of
  doctors. Server processes the request by querying the database for all doctors
  and their schedules.
- Authentication: No authentication required for this endpoint.

**Example Request**

```
curl -X GET http://localhost:8080/api/doctors \
```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of doctors and their
schedules.

```
{
  "doctors": [
    {
      "id": 1,
      "doctorname": "Dr. Tom",
      "specializationId": 1,
      "schedule": [
        { "day": "Friday",
          "startTime": "09:00 AM",
          "endTime": "05:00 PM" },
        { "day": "Tuesday",
          "startTime": "09:00 AM",
          "endTime": "12:00 PM" }
      ]
    }
  ]
}
```

Status Code: **404 Not Found**

Description: The server cannot find any doctors in the database.

```
{
   "error": "No doctors found"
}
```

### Specialization Management

#### 1. Retrieves a list of all specializations

Endpoint

- URL Path: **_/api/specializations_**
- Description: This endpoint retrieves a list of all specializations available
  in the system. Client sends a GET request to the server to retrieve a list of
  specializations. Server processes the request by querying the database for all
  specializations.
- Authentication: No authentication required for this endpoint.

**Example Request**

```
curl -X GET http://localhost:8080/api/specializations \
```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of specializations.

```
{
    "id": 1
    "name": “Cardiology”
}
```

Status Code: **404 Not Found**

Description: The server cannot find any specializations in the database.

```
{
   "error": "No specializations found"
}
```

### Appointment Management

#### 1. Creates a new appointment for a user with a doctor of the specified specialization

Endpoint

- URL Path: **_/api/appointments_**
- Description: This endpoint allows users to schedule appointments with doctors
  of a specified specialization.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameters:

- userId: The ID of the user scheduling the appointment.
- doctorId: The ID of the doctor with whom the appointment is scheduled.
- specializationId: The ID of the specialization to which the doctor belongs.
- appointmentTime: The date and time of the appointment.

**Example Request**

Description: POST request to create a new appointment. It includes an
Authorization header with a bearer token for authentication and specifies the
content type as JSON. The request body contains the details of the appointment,
including its ID, the user's ID, the doctor's ID, the specialization ID, and the
appointment time.

```
curl -X POST http://localhost:8080/api/appointments \
-H "Authorization: token" \
-H "Content-Type: application/json" \
-d '{
    "id": 1,
    "userId": 1,
    "doctorId": 1,
    "specializationId": 1,
    "appointmentTime": “2024-06-10 09:00:00”,
}'
```

**Responses**

Status code: **201 Created**

Description: The appointment is successfully created.

```
{
    "message": "Appointment created successfully",
    "userId": 1,
    "appointmentId": 1,
    "createdAt": “2024-06-01 10:00:00”
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
   "error": "Authentication failed: Ensure that the correct authentication token is provided in the request header."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specialization.

```
{
   "error": "Specialization not found"
}
```

#### 2. Retrieves all appointments for a specific user

Endpoint

- URL Path: **_/api/users/:userId/appointments_**
- Description: This endpoint retrieves all appointments for a specific user.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameter:

- userId: The ID of the user for whom appointments are to be retrieved.

**Example Request**

Description: GET request to retrieve all appointments for the user with ID 1. It
includes an Authorization header with a bearer token for authentication.

```
curl -X GET http://localhost:8080/api/users/1/appointments \
-H "Authorization: token" \
```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieved all appointments for the
specified user and provided the list of appointments in the response body.

```
{
    "userId": 1,
    "appointments": [
        { "appointmentId": 1,
        "doctorId": 1,
        "specializationId": 1,
        "appointmentTime": "2024-06-10 09:00:00" }
    ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
   "error": "Authentication failed: Ensure that the correct authentication token is provided in the request header."
}
```

#### 3. Changes the specialization and/or date of an existing appointment

Endpoint

- URL Path: **_api/:userId/appointments/:appointmentId_**
- Description: This endpoint allows authenticated users to change the
  specialization and/or date of an existing appointment.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameters:

- userId: The ID of the user for whom the appointment belongs;
- appointmentId: The ID of the appointment to be updated;
- specializationId: additional parameters to specify the changes to the
  appointment;
- appointmentTime: additional parameters to specify the changes to the
  appointment.

**Example Request**

Description: PUT request to update the appointment with ID 1 for the user with
ID 1. It includes the necessary authentication token and specifies the updated
details of the appointment, such as the new specialization ID and appointment
time.

```
curl -X PUT http://localhost:8080/api/users/1/appointments/1 \
-H "Authorization: token" \
-H "Content-Type: application/json" \
-d '{
    "specializationId": 2,
    "appointmentTime": "2024-06-15 10:00:00"
}'
```

**Responses**

Status code: **200 OK**

Description: The server successfully updated the appointment with the provided
changes.

```
{
    "message": "Appointment updated successfully",
    "userId": 1,
    "appointmentId": 1,
    "updatedFields": {
        "specializationId": 2,
        "appointmentTime": "2024-06-15 10:00:00"
    }
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified user or appointment.

```
{
   "error": "User or appointment not found"
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required parameters.

```
{
   "error": "Invalid request: Missing required parameters"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
   "error": "Authentication failed: Ensure that the correct authentication token is provided in the request header."
}
```

#### 4. Deletes an appointment

Endpoint

- URL Path: **_/api/:userId/appointments/:appointmentId_**
- Description: This endpoint allows authenticated users to delete a specific
  appointment associated with a user.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: DELETE request to delete the appointment with ID 2 for the user
with ID 1. It includes authentication token in the request header for
authorization.

```
curl -X DELETE http://localhost:8080/api/1/appointments/2 \
-H "Authorization: token" \
```

Status Code: **204 No Content**

Description: The server successfully deleted the appointment.

```
{
    "message": "Appointment deleted successfully"
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified user or appointment.

```
{
   "error": "User or appointment not found"
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
   "error": "Authentication failed: Ensure that the correct authentication token is provided in the request header."
}
```

## Install

1. Clone current repository into a your directory:

```
git clone https://github.com/MartaKliuchnik/hospital-appointment-scheduler.git
```

2. Switch to project folder:

```
cd hospital-appointment-scheduler
```

3. Install the dependencies:

```
npm install
```

## Running in Docker Container

To run the application in a Docker container, you should have Docker installed
on your system. Use the following commands:

1. Build and run the application:

```
docker compose up
```

2. Stop the application

```
docker compose down
```
