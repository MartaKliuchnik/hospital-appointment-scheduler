# Hospital Appointment Scheduler

## Table of Contents

1. [Description](#description)
2. [Technical requirements](#technical-requirements)
3. [Base URL](#base-url)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [API Documentation](#api-documentation)

   5.1 [User Management](#patient-management)
   
   - Client data model.
   - Endpoint **/api/v1/auth/register**
   - Endpoint **/api/v1/auth/login**

   5.2 [Doctor Management](#doctor-management)

   - Doctor data model.
   - Endpoint **/api/v1/doctors**

   5.3 [Schedule Management](#schedule-management)

   - Schedule data model.
   - Endpoint **/api/v1/schedules**

   5.4 [Authentication](#authentication)

   5.5 [Appointment Management](#appointment-management)

   - Appointment data model.
   - Endpoint **/api/v1/appointments/create**
   - Endpoint **/api/v1/appointments/client-appointments/:clientId**
   - Endpoint **/api/v1/client/appointments/client-appointment/:appointmentId**

6. [Install](#install)
7. [Running in Docker ContainerRun](#run)

## Description

The Node.js back-end serves as the backbone of the Hospital Appointment
Scheduler, facilitating both urgent consultations and routine check-ups. It
plays a crucial role in managing the scheduling process, including:

- **Authentication and Authorization**: To ensure secure access to the system,
  the server implements robust authentication and authorization mechanisms. This
  ensures that only authorized clients can access sensitive information and
  perform actions within the application.
- **Managing Data**: The server is responsible for storing and managing patient
  information, doctor schedules, and appointment details. It handles tasks such
  as creating new appointments, updating existing ones, and canceling
  appointments when necessary, as well as retrieving information about patients'
  appointment request and doctor schedules from the database.

## Technical requirements

Project is created with:

- Runtime environment: Node.js.
- Web application framework: Express.js.
- Database: MySQL.
- Containerization: Docker.

## Base URL

The base URL for accessing the Hospital Appointment Scheduler API is:

`http://localhost:8080/api/v1/`

All endpoints for the Hospital Appointment Scheduler API are accessed through
the base URL provided above.

**Example Usage** To make a request to the API, prepend the base URL to the
endpoint path. For instance, to access the register page:

`GET http://localhost:8080/api/v1/auth/register`

## Entity Relationship Diagram

![alt text](<Hospital Appointment Scheduler.drawio.png>)

## API Documentation

### User Management

#### 1. Client data model

Information about clients.

| Key  | Column Name      | Data Type     | Description                                   |
| :--- | :--------------- | :------------ | :-------------------------------------------- |
| PK   | clientId         | int           | Primary key for the Client record             |
|      | firstName        | varchar(50)   | First name of the client                      |
|      | lastName         | varchar(50)   | Last name of the client                       |
|      | phoneNumber      | varchar(15)   | Phone number of the client (must be unique)   |
|      | email            | varchar(255)  | Email address of the client (must be unique)  |
|      | password         | varchar(255)  | Password for the client's account             |
|      | registrationDate | datetime      | Date and time when the client registered      |

#### 2. Register a new user

Endpoint

- URL Path: **_/api/v1/auth/register_**
- Description: This endpoint registers a new user. It accepts user details in
  the request body and returns a response indicating the result of the
  registration process.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body must be in JSON format and include the following fields:

- firstName (string, required): The first name of the new user.
- lastName (string, required): The last name of the new user.
- phoneNumber: (string, required) - The user's phone number.
- email: (string, required) - The email address for the new user. Must be a
  valid email format.
- password: (string, required) - The password for the new user. Should meet
  security requirements such as minimum length, inclusion of special characters.

**Example Request**

Description: A 'POST' request to the client registration endpoint. It includes a
JSON payload in the request body with the user's first name, last name, phone
number, email, and password for registration.

```

curl -X POST http://localhost:8080/api/v1/auth/register \
-H "Content-Type: application/json" \
-d '{
  "firstName": "Alex",
  "lastName": "Doe",
  "phoneNumber": "1234567890",
  "email": "alex@example.com",
  "password": "hashed_password"
}'

```

**Responses**

Status code: **201 Created**

Description: The user has been successfully registered. The response includes a
success message and the clientId of the newly created client.

```
{
  "message": "User registered successfully",
  "clientId": 1
}
```

Status code: **409 Conflict**

Description: The provided email address is already registered with another user.

```
{
   "error": "Email or phone number already in use"
}
```

Status code: **400 Bad Request**

Description: The provided first name, last name, phone number, email address or
password is not in a valid format.

```
{
   "error": "Invalid input: all fields are required and must be in a valid format."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected condition that prevented it
from processing the request.

```
{
   error: 'Error registering user'
}
```

#### 3. Logs a user into the system

Endpoint

- URL Path: **_/api/v1/auth/login_**
- Description: This endpoint logs a user into the system by validating their
  email and password. Upon successful authentication, the client receives a JSON
  Web Token (JWT) which is used for subsequent authenticated requests.
- Authentication: No authentication required for this endpoint.

**Request Body**

The request body should be in JSON format and include the following fields:

- email: The user's email address;
- password: The user's password.

**Example Request**

Description: A 'POST' request to the login endpoint for user authentication. It
includes a JSON payload in the request body with the user's email and password.

```

curl -X POST http://localhost:8080/api/v1/auth/login \
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
    client:{
        "clientId": 1
        "firstName": "Alex",
        "lastName": "Fox",
        "phoneNumber": "1234567890",
        "email": "alex@example.com",
        "password": "some123password",
        "registrationDate": “2024-01-02 10:00:00”
    }
}
```

Status code: **400 Bad Request**

Description: The provided email address or password is not in a valid format.

```
{
   "error": "Email and password are required"
}
```

Status code: **401 Unauthorized**

Description: The login request failed due to incorrect email or password.

```
{
   "error": "User not found"
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected condition that prevented it
from processing the request.

```
{
   error: 'Error logging in user'
}
```

### Doctor Management

#### 1. Doctor data model

Information about doctors.

| Key  | Column Name      | Data Type     | Description                                                             |
| :--- | :--------------- | :------------ | :---------------------------------------------------------------------- |
| PK   | doctorId         | int           | Primary key for the Doctor record                                       |
|      | firstName        | varchar(50)   | First name of the doctor                                                |
|      | lastName         | varchar(50)   | Last name of the doctor                                                 |
|      | specialization   | enum          | Specialization field for the doctor, limited to specific medical fields |

Predefined list of medical specializations: 'CARDIOLOGY', 'NEUROLOGY', 'ONCOLOGY', 'PEDIATRICS', 'DERMATOLOGY'.

#### 2. Retrieves a list of all doctors and their schedules

Endpoint

- URL Path: **_/api/v1/doctors_**
- Description: This endpoint retrieves a list of all doctors along with their
  schedules. Client sends a GET request to the server to retrieve a list of
  doctors. Server processes the request by querying the database for all doctors
  and their schedules.
- Authentication: No authentication required for this endpoint.

**Example Request**

```

curl -X GET http://localhost:8080/api/v1/doctors \

```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of doctors and their
schedules.

```
{
  "doctors": [
    {
      "doctorId": 1,
      "firstName": "Jonh",
      "lastName": "Smith",
      "specialization": "CARDIOLOGY",
      "schedules": [
        { "scheduleDay": "TUESDAY",
          "startTime": "09:00 AM",
          "endTime": "05:00 PM" },
        { "scheduleDay": "FRIDAY",
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

### Schedule Management

#### 1. Schedule data model

Information about schedules.

| Key  | Column Name      | Data Type  | Description                                               |
| :--- | :--------------- | :--------- | :-------------------------------------------------------- |
| PK   | scheduleId       | int        | Primary key for the Schedule record                       |
| FK   | doctorId         | int        | Foreign key referencing the doctorId in the Doctor table  |
|      | scheduleDay      | enum       | Day of the week for the schedule                          |
|      | startTime        | time       | Start time of the doctor's availability                   |
|      | endTime          | time       | End time of the doctor's availability                     |

Predefined list of days of the week for the doctor's schedule: 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'.

#### 2. Retrieves a list of all schedules

Endpoint

- URL Path: **_/api/v1/schedules_**
- Description: This endpoint retrieves a list of all schedules available in the system. The client sends a GET request to the server to retrieve the list. The server processes the request by querying the database for all schedules.
- Authentication: No authentication required for this endpoint.

**Example Request**

```

curl -X GET http://localhost:8080/api/v1/schedules \

```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of schedules.

```
{
    "schedules": [
        {
            "scheduleId": 1,
            "doctorId": 101,
            "scheduleDay": "MONDAY",
            "startTime": "09:00:00",
            "endTime": "17:00:00"
        }
    ]
}
```

Status Code: **404 Not Found**

Description: The server cannot find any schedules in the database.

```
{
   "error": "No schedules found"
}
```

### Authentication

To access protected resources, such as appointment management processes, you
need to include a valid JWT token in your request headers. The header should
look like this:

```
{
   Authorization: Bearer <your-jwt-token>
}
```

**Example Request**

When making a GET request (or any other type of request) to
authentication-protected endpoints, you must include an Authorization header
with a bearer token. This token authenticates the user and grants access to the
requested resource. The Content-Type header should also be specified as
application/json for requests that include a body.

```

  GET /api/v1/appointments HTTP/1.1
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json

```

### Appointment Management

#### 1. Appointment data model

Information about appointments.

| Key  | Column Name        | Data Type  | Description                                                    |
| :--- | :----------------- | :--------- | :------------------------------------------------------------- |
| PK   | appointmentId      | int        | Primary key for the Appointment record                         |
| FK   | clientId           | int        | Foreign key referencing the clientId in the Appointment table  |
| FK   | doctorId           | int        | Foreign key referencing the doctorId in the Appointment table  |
|      | appointmentTime    | datetime   | Date and time of the appointment                               |
|      | appointmentStatus  | enum       | Status of the appointment                                      |

Predefined list of statuses for the appointment: 'SCHEDULED', 'COMPLETED', 'CANCELED'.

#### 2. Creates a new appointment for a client 

Endpoint

- URL Path: **_/api/v1/appointments/create_**
- Description: This endpoint allows clients to schedule a new appointment.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameters:

- clientId: The ID of the client scheduling the appointment.
- doctorId: The ID of the doctor with whom the appointment is scheduled.
- appointmentTime: The date and time of the appointment.

**Example Request**

Description: A 'POST' request to create a new appointment. It includes an
Authorization header with a bearer token for authentication and specifies the
content type as JSON. The request body contains the details of the appointment,
including the client's ID, the doctor's ID, and the appointment time.

```

curl -X POST http://localhost:8080/api/v1/appointments/create \
-H "Authorization: token" \
-H "Content-Type: application/json" \
-d '{ "clientId": number, "doctorId": number, "appointmentTime": string (format: "YYYY-MM-DD HH:MM:SS") }'

```

**Responses**

Status code: **201 Created**

Description: The appointment is successfully created.

```
{
  "message": "Appointment created successfully.",
  "appointment": {
        "appointmentId": number,
        "clientId": number,
        "doctorId": number,
        "appointmentTime": string (format: "YYYY-MM-DD HH:MM:SS"),
        "appointmentStatus": string
    }
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials, or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
  "error": "Authentication failed: Ensure that the correct authentication token is provided in the request header."
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required parameters.

```
{
  "error": "Invalid request: Missing required parameters. Please provide clientId, doctorId, and appointmentTime."
}
```

Status Code: **400 Bad Request**

Description: The request contains invalid data.

```
{
  "error": "Cannot schedule appointments in the past. Please choose a future date and time."
}
```

Status Code: **404 Not Found**

Description:  The server cannot find the specified client.

```
{
  "error": "Client not found."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified doctor.

```
{
  "error": "Doctor not found."
}
```

#### 3. Retrieves all appointments for a specific user

Endpoint

- URL Path: **_/api/v1/appointments/client-appointments/:clientId_**
- Description: This endpoint retrieves all appointments for a specific client.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameter:

- clientId: The ID of the client for whom appointments are to be retrieved.

**Example Request**

Description: A 'GET' request to retrieve all appointments for the client with
ID 1. It includes an Authorization header with a bearer token for
authentication.

```

curl -X GET http://localhost:8080/api/v1/appointments/client-appointments/:clientId \
-H "Authorization: token" \

```

**Responses**

Status code: **200 OK**

Description: The server successfully retrieved all appointments for the
specified client and provided the list with all client appointments in the response body.

```
{
  "clientId": number,
  "appointments": [
    { 
      "appointmentId": number,
      "doctorId": number,
      "appointmentTime": string (format: "YYYY-MM-DD HH:MM:SS"),
      "appointmentStatus": string
    }, 
    ...
  ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Therefore, the server refuses to respond to the request. Ensure that the correct authentication token is provided in the request header.

```
{
  "error": "Authentication failed: Token not provided."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified appointments for this client.

```
{
  "message": "No appointments found for this client."
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required client ID parameter.

```
{
  "error": "Invalid client ID."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{
  "error": "Failed to retrieve client appointments."
}
```

#### 4. Changes the specialization and/or date of an existing appointment

Endpoint

- URL Path: **_api/v1/client/:clientId/appointment/:appointmentId_**
- Description: This endpoint allows authenticated clients to change the
  specialization and/or date of an existing appointment.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameters:

- client_id: The ID of the client for whom the appointment belongs;
- appointmentId: The ID of the appointment to be updated;
- specialization: additional parameters to specify the changes to the
  appointment;
- appointmentTime: additional parameters to specify the changes to the
  appointment.

**Example Request**

Description: A 'PUT' request to update the appointment with ID 1 for the client
with ID 1. It includes the necessary authentication token and specifies the
updated details of the appointment, such as the new specialization ID and
appointment time.

```

curl -X PUT http://localhost:8080/api/v1/client/1/appointment/1 \
-H "Authorization: token" \
-H "Content-Type: application/json" \
-d '{ "specialization": "CARDIOLOGY", "appointmentTime": "2024-06-15 10:00:00" }'

```

**Responses**

Status code: **200 OK**

Description: The server successfully updated the appointment with the provided
changes.

```
{
  "message": "Appointment updated successfully",
  "clientId": 1,
  "appointmentId":1,
  "updatedFields": { "specialization": "NEUROLOGY", "appointmentTime": "2024-06-15 14:00:00" }
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

#### 5. Deletes an appointment

Endpoint

- URL Path: **_/api/v1/client/appointments/client-appointment/:appointmentId_**
- Description: This endpoint allows authenticated clients to delete a specific
  appointment associated with a client.
- Authentication: Authentication is required for this endpoint.

**Example Request**

Description: A 'DELETE' request to delete the appointment with ID 2 for the
client with ID 1. It includes authentication token in the request header for
authorization.

```

curl -X DELETE http://localhost:8080/api/v1/appointments/client-appointment/:appointmentId \
-H "Authorization: token" \

```

Status Code: **204 No Content**

Description: The server successfully deleted the appointment.

```
{
  "message": "Appointment deleted successfully."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Therefore, the server refuses to respond to the request. Ensure that the correct authentication token is provided in the request header.

```
{
  "error": "Authentication failed: Token not provided."
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required appointment ID parameter.

```
{
  "error": "Invalid appointment ID."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified appointment for this client.

```
{
  "error": "Appointment doesn't exist."
}
```

Status Code: **403 Forbidden**

Description: The request is understood by the server, but authorization is refused because the user lacks sufficient rights to access the resource.

```
{
  "error": "You do not have permission to delete this appointment."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{
  "error": "Failed to delete appointment."
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
