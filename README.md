# Hospital Appointment Scheduler

## Table of Contents

1. [Description](#description)
2. [Technical requirements](#technical-requirements)
3. [Base URL](#base-url)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [API Documentation](#api-documentation)

   5.1 [User Management](#user-management)

   - Client data model.
   - Endpoint **/api/v1/auth/register**
   - Endpoint **/api/v1/auth/login**
   - Endpoint **/api/v1/clients/:clientId**
   - Endpoint **/api/v1/clients/email/:email**
   - Endpoint **/api/v1/clients/phone/:phoneNumber**

   5.2 [Doctor Management](#doctor-management)

   - Doctor data model.
   - Endpoint **/api/v1/doctors**
   - Endpoint **/api/v1/doctors/:doctorId**

   5.3 [Authentication](#authentication)

   5.4 [Change Client Role](#change-client-role)

   - Endpoint **/api/v1/clients/:clientId/role**

   5.5 [Appointment Management](#appointment-management)

   - Appointment data model.
   - Endpoint **/api/v1/appointments**
   - Endpoint **/api/v1/appointments/clients/:clientId**
   - Endpoint **/api/v1/appointments/:appointmentId**

   5.6 [Schedule Management](#schedule-management)

   - Schedule data model.
   - Endpoint **/api/v1/schedules/:scheduleId**
   - Endpoint **/api/v1/schedules/doctor-schedule**
   - Endpoint **/api/v1/schedules/doctor-schedule/:doctorId**

6. [Install](#install)
7. [Run the application](#run-the-application)

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

![alt text](HospitalAppointmentScheduler.drawio.png)

## API Documentation

### User Management

#### 1. Client data model

Information about clients.

| Key | Column Name      | Data Type    | Description                                    |
| :-- | :--------------- | :----------- | :--------------------------------------------- |
| PK  | clientId         | int          | Primary key for the Client record              |
|     | firstName        | varchar(50)  | First name of the client                       |
|     | lastName         | varchar(50)  | Last name of the client                        |
|     | phoneNumber      | varchar(15)  | Phone number of the client (must be unique)    |
|     | email            | varchar(255) | Email address of the client (must be unique)   |
|     | password         | varchar(255) | Password for the client's account              |
|     | registrationDate | datetime     | Date and time when the client registered       |
|     | role             | enum         | Role of the client.                            |
|     | deleteAt         | datetime     | Date and time when the client was soft deleted |

Predefined list of client roles:

- ANONYMOS: An unauthorized client, usually with limited access.
- ADMIN: A client with administrative privileges, able to manage other clients
  and system settings.
- PATIENT: A client who uses the services provided by the healthcare system.

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
- phoneNumber: (string, required) - The user's phone number. The phone number should adhere to one of the following formats: plain phone number with 10 digits(1234567890); international number with a leading + (+1234567890); international with country code, parentheses for area code, and hyphens (+1(123)456-7890); area code in parentheses followed by digits and hyphen ((123)456-7890).
- email: (string, required) - The email address for the new user. Must be a valid email format.
- password: (string, required) - The password for the new user. Should meet security requirements such as minimum length, inclusion of special characters.

**Example Request**

Description: A `POST` request to the client registration endpoint. It includes a JSON payload in the request body with the user's first name, last name, phone number, email, and password for registration.

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

**Example Responses**

Status code: **201 Created**

Description: The user has been successfully registered. The response includes a
success message and the data with the clientId of the newly created client.

```
{
    "message": "User registered successfully.",
    "data": {
        "clientId": 2
    }
}
```

Status code: **400 Bad Request**

Description: The request was invalid because one or more of the provided fields
(first name, last name, phone number, email address, or password) did not meet
the required format or were missing.

```
{
    "message": "All fields are required and must be in a valid format."
}
```

Description: The email address provided in the request does not meet the
required format or is otherwise invalid.

```
{
    "message": "Invalid email address."
}
```

Description: The phone number provided in the request does not meet the required format or is otherwise invalid.

```
{
    "message": "Invalid phone number."
}
```

Status code: **409 Conflict**

Description: This response indicates that the request could not be processed
because the email or phone number is already in use.

```
{
    "message": "Email already in use."
}
```
```
{
    "message": "Phone number already in use."
}
```

Status code: **500 Internal Server Error**

Description: This response indicates an unexpected error occurred during the
registration process.

```
{
    "message": "An unexpected error occurred during registration."
}
```
```
{
    "message": "Failed to register client."
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

Description: A `POST` request to the login endpoint for user authentication. It
includes a JSON payload in the request body with the user's email and password.

```

curl -X POST http://localhost:8080/api/v1/auth/login \
-H "Content-Type: application/json" \
-d '{
  "email": "email@example.com",
  "password": "password"
}'

```

**Example Responses**

Status code: **200 OK**

Description: This status indicates that the login request was successful. The
server responds with a JSON object containing a JWT token and user information.

```
{
    "message": "User logged successfully.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
      "client" : {
          "clientId": 1
          "firstName": "Alex",
          "lastName": "Fox",
          "phoneNumber": "1234567890",
          "email": "alex@example.com",
          "role": "PATIENT"
      }
    }
}
```

Status code: **400 Bad Request**

Description: The provided email address or password is missing.

```
{
    "message": "Email and password are required."
}
```

Status code: **401 Unauthorized**

Description: The login request failed due to incorrect email.

```
{
    "message": "User does not exist."
}
```

Description: The login request failed due to incorrect password.

```
{
    "message": "Incorrect email or password."
}
```

Status code: **500 Internal Server Error**

Description: An error occurred while creating the authentication token. This
issue prevents the client from receiving a valid token, which is necessary for
authentication.

```
{
    "message": "Error creating authentication token."
}
```

Description: The server encountered an unexpected condition that prevented it
from processing the request.

```
{
    "message": "An unexpected error occurred during login."
}
```

#### 4. Retrieves a list of all clients

Endpoint

- URL Path: **_/api/v1/clients_**
- Description: This endpoint retrieves a list of all clients along with their personal information. An admin sends a GET request to the server to retrieve this list. The server processes the request by querying the database for all clients and their personal information.
- Authentication and Authorization: This endpoint requires admin-level authentication. Only users with admin privileges are allowed to view all clients in the database.

**Example Request**

Description: A `GET` request to retrieve a list of all clients. 

```

curl -X GET http://localhost:8080/api/v1/clients \

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of clients.

```
{
    "message": "Clients retrieved successfully.",
    "data": [
        {
            "clientId": 1,
            "firstName": "Emily",
            "lastName": "Smith",
            "email": "emily.smith@example.com",
            "password": "Smith123",
            "phoneNumber": "+1(123)456-7890",
            "registrationDate": "2024-07-30T21:33:41.000Z",
            "role": "ADMIN",
            "deletedAt": null
        },
        ...
    ]
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **404 Not Found**

Description: The server cannot find any clients in the database.

```
{
    "message": "No clients found in the database."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected condition that prevented it
from processing the request.

```
{
    "message": "Failed to retrieve clients."
}
```

#### 5. Delete a specific client

Endpoint

- URL Path: **_/api/v1/clients/:clientId_**
- Description: This endpoint allows an admin to delete a specific client from the database based on the provided client ID. The admin sends a DELETE request with the client ID as a path parameter. By default, this performs a soft delete. For a hard delete, a query parameter can be added. The server processes this request to remove or mark the client record as deleted.
- Authentication and Authorization:  This endpoint requires admin-level authentication. Only users with admin privileges can perform this operation.

**Request Parameter**

The request must include the following path parameter:

- clientId: The unique identifier of the client to be deleted.

Optional query parameter:

- hardDelete: If set to 'true', performs a hard delete instead of a soft delete.

**Example Request**

Description: A `DELETE` request to soft delete a specific client identified by clientId. This request must include an authorization token for an admin user.

```

curl -X DELETE http://localhost:8080/api/v1/clientId/123 \
-H "Authorization: Bearer <your-jwt-token>" \

```

Description: A `DELETE` request to hard delete a specific client identified by clientId.

```

curl -X DELETE http://localhost:8080/api/v1/clientId/123?hardDelete=true \
-H "Authorization: Bearer <your-jwt-token>" \

```

**Example Responses**

Status Code: **200 OK**

Description:  The client was successfully deleted (soft or hard).

```
{ 
    "message": "Client soft deleted successfully." 
}
```
```
{ 
    "message": "Client hard deleted successfully." 
}
```

Status Code: **400 Bad Request**

Description: The provided client ID is invalid or missing.

```
{ 
    "message": "Client ID is required."
}
```
```
{ 
    "message": "Invalid client ID."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **404 Not Found**

Description: No client with the specified ID exists in the database.

```
{ 
    "message": "Client not found." 
}
```

Status code: **409 Conflict**

Description:  The request could not be processed because the client has existing appointments, which prevents deletion.

```
{
    "message": "This client has appointment(s). Deletion is forbidden."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{ 
    "message": "Failed to delete client." 
}
```

#### 6. Retrieve a specific client by ID

Endpoint

- URL Path: **_/api/v1/clients/:clientId_**
- Description: This endpoint retrieves information about a specific client based
  on their ID. The admin-client sends a GET request to the server with the client's ID
  as a path parameter. The server processes the request by querying the database
  for the client with the specified ID.
- Authentication and Authorization:  This endpoint requires admin-level authentication. Only users with admin privileges can perform this operation.

**Request Parameter**

The request should include the following path parameter:

- clientId: The unique identifier of the client to retrieve.

**Example Request**

Description: A `GET` request to retrieve a specific client associated with a clientId

```

curl -X GET http://localhost:8080/api/v1/clients/123

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the client's information.

```
{
    "message": "Client retrieved successfully.",
    "data": {
        "firstName": "Carlos",
        "lastName": "Gonzalez",
        "phoneNumber": "+1(456)555-0123",
        "email": "gonzalez@example.com",
        "password": "$2b$10$Gj4xELvuBVqHkGIakaBAP.VLG4zSezU4u5",
        "role": "PATIENT",
        "clientId": 123,
        "deletedAt": null
    }
}
```

Status code: **400 Bad Request**

Description: The valid client ID must be provided to proceed.

```
{
    "message": "Invalid client ID."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status code: **404 Not Found**

Description: No client with the specified ID exists in the database.

```
{
    "message": "Client not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{
    "message": "Failed to retrieve client."
}
```

#### 7. Retrieve a specific client by phone number

Endpoint

- URL Path: **_/api/v1/clients/phone/:phoneNumber_**
- Description: This endpoint retrieves information about a specific client based on their phone number. The admin-client sends a GET request to the server with the client's phone number as a path parameter. The server processes the request by querying the database for the client with the specified phone number.
- Authentication and Authorization:  This endpoint requires admin-level authentication. Only users with admin privileges can perform this operation.

**Request Parameter**

The request should include the following path parameter:

- phoneNumber: The phone number (a unique value) of the client to retrieve.

**Example Request**

Description: A `GET` request to retrieve a specific client associated with a phoneNumber

```

curl -X GET http://localhost:8080/api/v1/clients/phone/+1(456)555-0123

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the client's information.

```
{
    "message": "Client retrieved successfully.",
    "data": {
        "firstName": "Carlos",
        "lastName": "Gonzalez",
        "phoneNumber": "+1(456)555-0123",
        "email": "gonzalez@example.com",
        "password": "$2b$10$Gj4xELvuBVqHkGIakaBAP.VLG4zSezU4u5",
        "role": "PATIENT",
        "clientId": 123,
        "deletedAt": null
    }
}
```

Status code: **400 Bad Request**

Description: The provided phone number is missing or invalid.

```
{
    "message": "Phone number is required."
}
```
```
{
    "message": "Invalid phone number."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status code: **404 Not Found**

Description: No client with the specified phone number exists in the database.

```
{
    "message": "Client not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{
    "message": "Failed to retrieve client."
}
```

#### 8. Retrieve a specific client by email

Endpoint

- URL Path: **_/api/v1/clients/email/:email_**
- Description: This endpoint retrieves information about a specific client based on their email address. The admin-client sends a GET request to the server with the client's email as a path parameter. The server processes the request by querying the database for the client with the specified email address.
- Authentication and Authorization:  This endpoint requires admin-level authentication. Only users with admin privileges can perform this operation.

**Request Parameter**

The request should include the following path parameter:

- email: The email address (a unique value) of the client to retrieve.

**Example Request**

Description: A `GET` request to retrieve a specific client associated with an email address

```

curl -X GET http://localhost:8080/api/v1/clients/email/gonzalez@example.com

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the client's information.

```
{
    "message": "Client retrieved successfully.",
    "data": {
        "firstName": "Carlos",
        "lastName": "Gonzalez",
        "phoneNumber": "+1(456)555-0123",
        "email": "gonzalez@example.com",
        "password": "$2b$10$Gj4xELvuBVqHkGIakaBAP.VLG4zSezU4u5",
        "role": "PATIENT",
        "clientId": 123,
        "deletedAt": null
    }
}
```

Status code: **400 Bad Request**

Description: The provided email address is missing or invalid.

```
{
    "message": "Email address is required."
}
```
```
{
    "message": "Invalid email address."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status code: **404 Not Found**

Description: No client with the specified email address exists in the database.

```
{
    "message": "Client not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{
    "message": "Failed to retrieve client."
}
```

### Doctor Management

#### 1. Doctor data model

Information about doctors.

| Key | Column Name    | Data Type   | Description                                                             |
| :-- | :------------- | :---------- | :---------------------------------------------------------------------- |
| PK  | doctorId       | int         | Primary key for the Doctor record                                       |
|     | firstName      | varchar(50) | First name of the doctor                                                |
|     | lastName       | varchar(50) | Last name of the doctor                                                 |
|     | specialization | enum        | Specialization field for the doctor, limited to specific medical fields |
|     | isActive       | boolean     | Active status of the doctor                                             |

Predefined list of medical specializations: 'CARDIOLOGY', 'NEUROLOGY',
'ONCOLOGY', 'PEDIATRICS', 'DERMATOLOGY'.

#### 2. Retrieves a list of all doctors

Endpoint

- URL Path: **_/api/v1/doctors_**
- Description: This endpoint retrieves a list of all doctors along with their
  schedules. Client sends a GET request to the server to retrieve a list of
  doctors. Server processes the request by querying the database for all doctors
  and their personal information.
- Authentication: No authentication required for this endpoint.

**Example Request**

Description: This `GET` endpoint retrieves a list of doctors. The visibility of doctor data depends on the client's role: 
- **ADMIN role**: The response includes both active and inactive doctors, along with the 'isActive' property.
- **NON-ADMIN role**: The response includes only active doctors, and the 'isActive' property is excluded.

```

curl -X GET http://localhost:8080/api/v1/doctors \

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the list of doctors.

```
{
    "message": "Doctors retrieved successfully.",
    "data": {
        "doctors": [
          {
            "doctorId": 123,
            "firstName": "Jane",
            "lastName": "Doe",
            "specialization": "NEUROLOGY",
            "isActive": 1, // Excluded for non-admin roles
          },
          ...
        ]
    }
}
```

Status Code: **404 Not Found**

Description: The server cannot find any doctors in the database.

```
{
    "message": "No doctors found in the database."
}
```

Status code: **500 Internal Server Error**

Description: The server encountered an unexpected condition that prevented it
from processing the request.

```
{
    "message": "Failed to retrieve doctors."
}
```

#### 3. Retrieve a specific doctor by ID

Endpoint

- URL Path: /api/v1/doctors/:doctorId
- Description: This endpoint retrieves information about a specific doctor based
  on their ID. The client sends a GET request to the server with the doctor's ID
  as a path parameter. The server processes the request by querying the database
  for the doctor with the specified ID.
- Authentication: No authentication required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- doctorId: The unique identifier of the doctor to retrieve.

**Example Request**

Description: A `GET` request to retrieve a specific doctor associated with a
doctorId. This endpoint retrieves a list of all doctors. The visibility of the doctors' data depends on the role of the client making the request: if the client has an ADMIN role, they can see all doctors, both active and inactive; if the client has a PATIENT role (non-admin role), they can only see active doctors.

```

curl -X GET http://localhost:8080/api/v1/doctors/123

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieves the doctor's information.

```
{
    "message": "Doctor retrieved successfully.",
    "data": [
        {
            "doctorId": 1,
            "firstName": "John",
            "lastName": "Doe",
            "specialization": "CARDIOLOGY",
            "isActive": 1, // Excluded for non-admin roles
        }
    ]
}
```

Status code: **400 Bad Request**

Description: The provided doctor ID is invalid (not a number).

```
{
    "message": "Invalid doctor ID."
}
```

Status code: **404 Not Found**

Description: No doctor with the specified ID exists in the database.

```
{
    "message": "Doctor not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to retrieve doctor."
}
```

#### 4. Create a new doctor

Endpoint

- URL Path: **_/api/v1/schedules/doctors_**
- Description: This endpoint allows an admin to create a new doctor record in the system.
- Authentication and Authorization: This endpoint requires admin-level authentication. Only users with admin privileges are allowed to create a new doctor.

**Request Body**

The request body should contain the following parameters:

- firstName: The first name of the doctor.
- lastName: The last name of the doctor.
- specialization: The specialization of the doctor, which must be one of the predefined values from the allowed list of enum values.

**Example Request**

Description: This is a `POST` request used to create a new doctor record. The request must include an Authorization header with a valid bearer token for authentication and specify the Content-Type as application/json. The request body should contain the details of the doctor, including the firstName, lastName, and specialization.

```

curl -X POST http://localhost:8080/api/v1/schedules/doctors \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "firstName": "Mike", "lastName": "Jonson", "specialization": "CARDIOLOGY" }'

```

**Example Responses**

Status code: **201 Created**

Description: The doctor was successfully created.

```
{
    "message": "Doctor created successfully.",
    "data": [
        {
            "doctorId": 8,
            "firstName": "Mike",
            "lastName": "Jonson",
            "specialization": "CARDIOLOGY",
            "isActive": 1,
        }
    ]
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required parameters.

```
{
    "message": "All fields are required and must be in a valid format."
}
```

Description: The provided specialization is invalid as it is not part of the allowed enum list.

```
{
    "message": "Invalid specialization. Please provide a valid specialization from the allowed list.
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided token is invalid. Ensure that the correct authentication token is provided.

```
{
    "message": "Authentication failed: Missing client ID."
}
```
```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have the required admin privileges to perform this operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status code: **409 Conflict**

Description: This response indicates that a doctor with the same name and specialization is already in the system, preventing the creation of a duplicate entry.

```
{
    "message": "A doctor with the same name and specialization already exists."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the request.

```
{ 
    "message": "Failed to create doctor." 
}
```

#### 5. Delete a specific doctor

Endpoint

- URL Path: **_/api/v1/doctors/:doctorId_**
- Description: This endpoint soft deletes a specific doctor based on their ID. The client sends a DELETE request to the server with the doctor's ID as a path parameter. Instead of removing the doctor from the database, the server processes the request by marking the doctor as inactive (isActive = false), effectively performing a soft delete. This request must include an authorization token for an admin user.
- Authentication and Authorization: This endpoint requires admin-level
  authentication. Only users with admin privileges are allowed to delete doctor
  records.

**Request Parameter**

The request should include the following path parameter:

- doctorId: The unique identifier of the doctor to delete.

**Example Request**

Description: A `DELETE` request to soft delete a specific doctor associated with a doctorId. This request must include an authorization token for an admin user.

```

curl -X DELETE http://localhost:8080/api/v1/doctors/123 \
-H "Authorization: Bearer <your-jwt-token>" \

```

**Example Responses**

Status Code: **200 OK**

Description: The server successfully deletes the doctor.

```
{
    "message": "Doctor deleted successfully."
}
```

Status Code: **400 Bad Request**

Description: The doctor ID is missing from the request. The provided doctor ID is invalid (not a number).

```
{
    "message": "Doctor ID is required."
}
```
```
{
    "message": "Invalid doctor ID."
}
```

Status Code: **401 Unauthorized**

Description: This status code is used when a user must authenticate themselves
to access the requested resource. It indicates that authentication is required.

```
{ 
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The request to delete the doctor record cannot be processed because
the doctor currently has appointments scheduled. To ensure data integrity and
avoid disrupting ongoing or future appointments, deletion of records associated
with existing appointments is prohibited.

```
{
    "message": "This doctor has appointment(s). Deletion is forbidden."
}
```

Description: Only authorized users with the required admin privileges are
permitted to delete doctor records.

```
{
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **404 Not Found**

Description: No doctor with the specified ID exists in the database.

```
{
    "message": "Doctor not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to delete doctor."
}
```

#### 6. Update a doctor's information

Endpoint

- URL Path: **_/api/v1/doctors/:doctorId_**
- Description: This endpoint updates a specific doctor's information based on
  their ID. The client sends a PUT request to the server with the doctor's ID as
  a path parameter and the updated information in the request body. The server
  processes the request by updating the specified doctor's details in the
  database.
- Authentication and Authorization: This endpoint requires admin-level
  authentication. Only users with admin privileges are allowed to update doctor
  records.

**Request Parameter**

The request should include the following path parameter:

- doctorId: The unique identifier of the doctor to update. 

**Example Request**

Description: A `PUT` request to update a specific doctor's information
associated with a doctorId. This request must include an authorization token for
an admin user.

```

curl -X PUT http://localhost:8080/api/v1/doctors/123 \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "firstName": "John", "lastName": "Doe", "specialization": "CARDIOLOGY" }'

```

**Example Responses**

Status Code: **200 OK**

Description: The server successfully updates the doctor's information.

```
[
    "message": "Doctor updated successfully.",
    "data": [
        {
            "doctorId": 123,
            "firstName": "John",
            "lastName": "Doe",
            "specialization": "CARDIOLOGY",
        }
    ]
]
```

Status Code: **400 Bad Request**

Description: The provided doctor ID is missing or invalid (not a number).

```
{
    "message": "Doctor ID is required."
}
```
```
{
    "message": "Invalid doctor ID."
}
```

Description: No valid update data is provided.

```
{
    "message": "No valid update data provided."
}
```

Description: The provided specialization value is not valid. The specialization
must be one of the predefined values from the allowed list. Please ensure that
the specialization matches one of the valid options.

```
{
    "message": "Invalid specialization. Please provide a valid specialization from the allowed list."
}
```

Status Code: **401 Unauthorized**

Description: This status code is used when a user must authenticate themselves
to access the requested resource. It indicates that authentication is required.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: Only authorized users with the required admin privileges are
permitted to delete doctor records.

```
{
    "message": "Access denied. Admin privileges required."
}
```

Description: The request to update the doctor record cannot be processed because
the doctor currently has appointments scheduled. To ensure data integrity and
avoid disrupting ongoing or future appointments, updates to records associated
with existing appointments are prohibited.

```
{
    "message": "This doctor has appointment(s). Update is forbidden."
}
```

Status Code: **404 Not Found**

Description: No doctor with the specified ID exists in the database.

```
{
    "message": "Doctor not found."
}
```

Status code: **409 Conflict**

Description: This response indicates that a doctor with the same name and specialization is already in the system, preventing the creation of a duplicate entry.

```
{
    "message": "A doctor with the same name and specialization already exists."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to update doctor."
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

### Change Client Role

The process of changing a client's role is restricted to admin clients only.

Endpoint

- URL Path: **_/api/v1/clients/:clientId/role_**
- Description: This endpoint allows an admin to update the role of a specified
  client.
- Authentication: Required (Admin only)
- Authorization: Requires UPDATE_USER_ROLE permission

**Request Parameter**

The request should include the following path parameter:

- clientId: The ID of the client whose role is to be updated.

**Example Request**

Description: A `PUT` request to update the role of a client. It includes an
Authorization header with a bearer token for authentication and specifies the
content type as JSON. The request targets a specific client using their ID in
the URL path. The request body contains the new role to be assigned to the
client.

```

curl -X PUT http://localhost:8080/api/v1/clients/123/role \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "newRole": "ADMIN" }'
```

**Example Responses**

Status code: **200 OK**

Description: The client's role was successfully updated.

```
{
    "message": "User role updated successfully.",
    "data": {
        "newRole": "ADMIN"
    }
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required client ID parameter.

```
{
    "message": "Invalid client ID."
}
```

Description: The request is invalid or missing required parameters. The role
must be one of the predefined values from the allowed list. Please ensure that
the role matches one of the valid options.

```
{
    "message": "Invalid role. Please provide a valid role from the allowed list."
}
```

Description: The client already has the specified role.

```
{
    "message": "Client already has this role."
}
```

Description: The attempt to update the user's role in the database failed.

```
{
    "message": "User role update failed."
}
```

Status Code: **401 Unauthorized**

Description: This status code is used when a user must authenticate themselves
to access the requested resource. It indicates that authentication is required.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: Only authorized users with the required admin privileges are
permitted to update client role.

```
{
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified client.

```
{
    "message": "Client not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to update user role."
}
```

### Appointment Management

#### 1. Appointment data model

Information about appointments.

| Key | Column Name       | Data Type | Description                                                                     |
| :-- | :---------------- | :-------- | :------------------------------------------------------------------------------ |
| PK  | appointmentId     | int       | Primary key for the Appointment record                                          |
| FK  | clientId          | int       | Foreign key referencing the clientId in the Appointment table                   |
| FK  | doctorId          | int       | Foreign key referencing the doctorId in the Appointment table                   |
|     | appointmentTime   | datetime  | Date and time of the appointment                                                |
|     | appointmentStatus | enum      | Status of the appointment (e.g., 'SCHEDULED', 'CANCELED')                       |
|     | deleteAt          | datetime  | Date and time when the appointment was soft deleted by an admin (if applicable) |

Predefined list of statuses for the appointment: 'SCHEDULED', 'CANCELED'.

#### 2. Creates a new appointment for a client

Endpoint

- URL Path: **_/api/v1/appointments_**
- Description: This endpoint allows clients to schedule a new appointment.
- Authentication: Authentication is required for this endpoint.

**Request Body**

The request body should contain the following parameters:

- doctorId: The ID of the doctor with whom the appointment is scheduled.
- appointmentTime: The date and time of the appointment.

**Example Request**

Description: A `POST` request to create a new appointment. It includes an
Authorization header with a bearer token for authentication and specifies the
content type as JSON. The request body contains the details of the appointment,
including the client's ID, the doctor's ID, and the appointment time. The visibility of appointment data depends on the client's role:

ADMIN role: The 'deletedAt' property.
NON-ADMIN role: The 'deletedAt' property is excluded.

```

curl -X POST http://localhost:8080/api/v1/appointments \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "doctorId": 1, "appointmentTime": "2024-07-29 10:00:00" }'

```

**Example Responses**

Status code: **201 Created**

Description: The appointment is successfully created.

```
{
    "message": "Appointment created successfully.",
    "data": {
        "clientId": 1,
        "doctorId": 1,
        "appointmentTime": "2024-07-29 10:00:00",
        "appointmentStatus": "SCHEDULED",
        "appointmentId": 4,
        "deletedAt": null, // Excluded for non-admin roles
    }
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required parameters.

```
{
    "message": "Invalid request: doctorId and appointmentTime are required parameters."
}
```

Description: The request contains invalid data.

```
{
    "message": "Invalid appointment time. Please choose a future date and time."
}
```

Description: The client is attempting to schedule an appointment at a time that
is not available.

```
{
    "message": "The selected appointment time is not available."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials, or the
provided token is invalid. Therefore, the server refuses to respond to the
request. Ensure that the correct authentication token, and client ID are
provided.

```
{
    "message": "Authentication failed: Missing client ID."
}
```
```
{
    "message": "Authentication required."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified client.

```
{
    "message": "Client not found."
}
```

Description: The server cannot find the specified doctor.

```
{
    "message": "Doctor not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to insert appointment."
}
```

#### 3. Retrieves all appointments for a specific user

Endpoint

- URL Path: **_/api/v1/appointments/clients/:clientId_**
- Description: This endpoint retrieves all appointments for a specific client. If the client role is 'PATIENT', it will only retrieve appointments that have not been marked as deleted (i.e., where deletedAt is NULL). For other roles, it retrieves all appointments. The appointments are sorted by appointmentTime in ascending order.
- Authentication: Authentication is required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- clientId: The ID of the client for whom appointments are to be retrieved.

**Example Request**

Description: A `GET` request to retrieve all appointments for the client with
ID 1. It includes an Authorization header with a bearer token for
authentication. The visibility of appointment data depends on the client's role:

ADMIN role: The 'deletedAt' property.
NON-ADMIN role: The 'deletedAt' property is excluded.

```

curl -X GET http://localhost:8080/api/v1/appointments/clients/2 \
-H "Authorization: Bearer <your-jwt-token>" \

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully retrieved all appointments for the specified client. For clients with the role 'PATIENT', only appointments that have not been marked as deleted are included. For other roles, all appointments are included. The appointments are sorted by appointmentTime in ascending order.

```
{
    "message": "Appointments retrieved successfully.",
    "data": {
      "clientId": 2,
      "appointments": [
        {
          "appointmentId": 4,
          "doctorId": 3,
          "appointmentTime": "2024-08-15 14:30:00",
          "appointmentStatus": "SCHEDULED",
          "deletedAt": null, // Excluded for non-admin roles
        },
        ...
      ]
    }
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required client ID parameter.

```
{ 
    "message": "Client ID is required."
}
```
```
{
    "message": "Invalid client ID."
}
```

Description: The server cannot find the specified client.

```
{
    "message": "Client not found."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials or the provided
token is invalid. Therefore, the server refuses to respond to the request.
Ensure that the correct authentication token is provided in the request header.

```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: Description: Only users with admin privileges are allowed to view
or manage appointments that belong to other clients. Regular users are
restricted to viewing and managing only their own appointments.

```
{
    "message": "You have permission to view only your own appointments."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified appointments for this client.

```
{
    "message": "No appointments found for this client."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to retrieve client appointments."
}
```

#### 4. Changes the date of an existing appointment

Endpoint

- URL Path: **_api/v1/client/appointments/:appointmentId_**
- Description: This endpoint allows authenticated clients to change the date of
  an existing appointment.
- Authentication: Authentication is required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- appointmentTime: parameters to specify the changes to the appointment.

**Example Request**

Description: A `PUT` request to update the appointment for the specified client.
It includes the necessary authentication token and specifies the updated detail
of the appointment, such as the new appointment time. The visibility of appointment data depends on the client's role:

ADMIN role: The 'deletedAt' property.
NON-ADMIN role: The 'deletedAt' property is excluded.

```

curl -X PUT http://localhost:8080/api/v1/appointments/456 \
-H "Authorization: Bearer <your-jwt-token>" \
-d '{ "appointmentTime": "2024-08-15 14:30:00" }'

```

**Example Responses**

Status code: **200 OK**

Description: The server successfully updated the appointment with the provided
changes.

```
{
    "message": "Appointment updated successfully.",
    "data": {
          "appointmentId": 456,
          "clientId": 1,
          "doctorId": 2,
          "appointmentTime": "2024-08-15 14:30:00",
          "appointmentStatus": "SCHEDULED",
          "deletedAt": null, // Excluded for non-admin roles
    }
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required appointment ID
parameter.

```
{ 
    "message": "Appointment ID is required."
}
```
```
{
    "message": "Invalid appointment ID."
}
```

Description: The request is invalid because it contains incorrect information.
Ensure the date is correctly formatted.

```
{
    "message": "Invalid appointment time. Please choose a future date and time."
}
```

Description: The client is attempting to schedule an appointment at a time that
is not available.

```
{
    "message": "The selected appointment time is not available."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials, or the
provided token is invalid. Ensure that the correct authentication token, and
client ID are provided.

```
{
    "message": "Authentication failed: Missing client ID."
}
```
```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The request is understood by the server, but authorization is
refused because the user lacks sufficient rights to access the resource.

```
{
    "message": "You do not have permission to update this appointment."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified appointment with this ID.

```
{
    "message": "Appointment doesn't exist."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to update appointment."
}
```

#### 5. Deletes an appointment

Endpoint

- URL Path: **_/api/v1/client/appointments/client-appointment/:appointmentId_**
- Description: This endpoint allows authenticated clients to delete or cancel a specific appointment associated with a client, depending on their role (admin or patient).
- Authentication: Authentication is required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- appointmentId: The unique identifier of the appointment.

**Example Request**

Description: A DELETE request to delete or cancel (depending on the client's role) a specific appointment associated with a client. It includes an authentication token in the request header for authorization.

```

curl -X DELETE http://localhost:8080/api/v1/appointments/client-appointment/12 \
-H "Authorization: Bearer <your-jwt-token>" \

```

**Example Responses**

Status Code: **200 OK**

Description: The server successfully deleted or canceled the appointment.

For ADMIN: 
This process includes setting the deletedAt timestamp for the appointment. After this step, the patient will not be able to see this appointment.
```
{
    "message": "Appointment deleted successfully."
}
```

For PATIENT:
This process includes changing the appointment status to CANCELED, freeing up the time slot for other appointments.
```
{
    "message": "Appointment canceled successfully."
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required appointment ID
parameter.

```
{ 
    "message": "Appointment ID is required."
}
```
```
{
    "message": "Invalid appointment ID."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials, or the
provided token is invalid. Ensure that the correct authentication token, and
client ID are provided.

```
{
    "message": "Authentication failed: Missing client ID."
}
```
```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The request is understood by the server, but authorization is
refused because the user lacks sufficient rights to access the resource.

```
{
    "message": "You do not have permission to delete this appointment."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified appointment with this ID.

```
{
    "message": "Appointment not found."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to delete appointment."
}
```

### Schedule Management

#### 1. Schedule data model

Information about schedules.

| Key | Column Name | Data Type | Description                                              |
| :-- | :---------- | :-------- | :------------------------------------------------------- |
| PK  | scheduleId  | int       | Primary key for the Schedule record                      |
| FK  | doctorId    | int       | Foreign key referencing the doctorId in the Doctor table |
|     | scheduleDay | enum      | Day of the week for the schedule                         |
|     | startTime   | time      | Start time of the doctor's availability                  |
|     | endTime     | time      | End time of the doctor's availability                    |

Predefined list of days of the week for the doctor's schedule: 'MONDAY',
'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'.

#### 2. Retrieve schedules for a specific doctor

Endpoint

- URL Path: **_/api/v1/schedules/doctor-schedule/:doctorId_**
- Description: This endpoint retrieves all schedules for a specific doctor.
- Authentication: No authentication required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- doctorId: The unique identifier of the doctor.

**Example Request**

Description: A `GET` request to retrieve all schedules for a specific doctor. No
authentication is required for this endpoint. The doctor's ID is included in the
URL path.

```

curl -X GET http://localhost:8080/api/v1/schedules/doctor-schedule/123 \

```

**Example Responses**

Status code: **200 OK**

Description: The schedules are successfully retrieved.

```
{
    "message": "Doctor schedules retrieved successfully.",
    "data": {
        "doctorId": 123,
        "schedules": [
            {
                "scheduleDay": "MONDAY",
                "startTime": "14:00:00",
                "endTime": "17:00:00",
                "scheduleId": 3
            },
            ...
        ]
    }
}
```

Status Code: **400 Bad Request**

Description: The doctor ID provided is invalid or missing.

```
{ 
    "message": "Doctor ID is required."
}
```
```
{
    "message": "Invalid doctor ID."
}
```

Status Code: **404 Not Found**

Description: No schedules found for the specified doctor.

```
{
    "message": "No schedules found for this doctor."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to retrieve schedule."
}
```

#### 3. Retrieve a schedule by ID

Endpoint

- URL Path: **_/api/v1/schedules/:scheduleId_**
- Description: This endpoint retrieves a specific schedule by its ID.
- Authentication: No authentication required for this endpoint.

**Request Parameter**

The request should include the following path parameter:

- scheduleId: The unique identifier of the schedule.

**Example Request**

Description: A `GET` request to retrieve a specific schedule by its ID. No
authentication is required for this endpoint. The schedule's ID is included in
the URL path.

```

curl -X POST http://localhost:8080/api/v1/schedules/123 \

```

**Example Responses**

Status code: **200 OK**

Description: The schedule is successfully retrieved.

```
{
    "message": "Schedule retrieved successfully.",
    "data": {
        "doctorId": 1,
        "scheduleDay": "MONDAY",
        "startTime": "09:00:00",
        "endTime": "13:00:00",
        "scheduleId": 123
    }
}
```

Status Code: **400 Bad Request**

Description: The schedule ID provided is invalid or missing.

```
{ 
    "message": "Schedule ID is required."
}
```
```
{
    "message": "Invalid schedule ID."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified schedule.

```
{
    "message": "Schedule doesn't exist."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{
    "message": "Failed to retrieve schedule."
}
```

#### 4. Create a new schedule for a doctor

Endpoint

- URL Path: **_/api/v1/schedules/doctor-schedule_**
- Description: This endpoint allows the creation of a new schedule for a doctor.
- Authentication and Authorization: This endpoint requires admin-level
  authentication. Only users with admin privileges are allowed to create
  schedule records.

**Request Body**

The request body should contain the following parameters:

- doctorId: The ID of the doctor for whom the schedule is being created.
- scheduleDay: The day of the week for the schedule.
- startTime: The start time of the schedule.
- endTime: The end time of the schedule.

**Example Request**

Description: A `POST` request to create a new schedule for a doctor. It includes
an Authorization header with a bearer token for authentication and specifies the
content type as JSON. The request body contains the details of the schedule,
including the doctor's ID, schedule day, start time, and end time.

```

curl -X POST http://localhost:8080/api/v1/schedules/doctor-schedule \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "doctorId": 123, "scheduleDay": "MONDAY", "startTime": "09:00:00", "endTime": "17:00:00" }'

```

**Example Responses**

Status code: **201 Created**

Description: The schedule is successfully created.

```
{
    "message": "Schedule created successfully.",
    "data": {
        "doctorId": 123,
        "scheduleDay": "MONDAY",
        "startTime": "09:00:00",
        "endTime": "17:00:00"
        "scheduleId": 3
    }
}
```

Status Code: **400 Bad Request**

Description: The request is invalid or missing required parameters.

```
{
    "message": "All fields are required and must be in a valid format."
}
```

Description: The provided doctor ID is invalid (not a number).

```
{
    "message": "Invalid doctor ID."
}
```

Description: The provided schedule day is invalid as it is not part of the
allowed enum list.

```
{
    "message": "Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list."
}
```

Status Code: **401 Unauthorized**

Description: The request lacks proper authentication credentials, or the
provided token is invalid. Ensure that the correct authentication token, and
client ID are provided.

```
{
    "message": "Authentication failed: Missing client ID."
}
```
```
{
    "message": "Authentication required."
}
```

Status Code: **403 Forbidden**

Description: The user does not have admin privileges required to perform this
operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **404 Not Found**

Description: The server cannot find the specified doctor.

```
{ 
    "message": "Doctor not found." 
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{ 
    "message": "Failed to create schedule." 
}
```

#### 5. Delete a specific schedule

Endpoint

- URL Path: **_/api/v1/schedules/:scheduleId_**
- Description: This endpoint deletes a specific schedule based on its ID. The
  client sends a DELETE request to the server with the schedule's ID as a path
  parameter. The server processes the request by removing the specified schedule
  from the database.
- Authentication and Authorization: This endpoint requires admin-level
  authentication. Only users with admin privileges are allowed to delete
  schedule records.

**Request Parameter**

The request should include the following path parameter:

- sceduleId: The unique identifier of the schedule.

**Example Request**

Description: A `DELETE` request to remove a specific schedule associated with a
scheduleId. This request must include an authorization token for an admin user.

```

curl -X DELETE http://localhost:8080/api/v1/schedules/123 \
-H "Authorization: Bearer <your-jwt-token>" \

```

**Example Responses**

Status Code: **200 OK**

Description: The server successfully deletes the schedule.

```
{ 
    "message": "Schedule deleted successfully." 
}
```

Status Code: **400 Bad Request**

Description: The provided schedule ID is invalid or missing.

```
{ 
    "message": "Schedule ID is required."
}
```
```
{ 
    "message": "Invalid schedule ID."
}
```

Status Code: **404 Not Found**

Description: No schedule with the specified ID exists in the database.

```
{ 
    "message": "Schedule not found." 
}
```

Status Code: **403 Forbidden**

Description: The user does not have admin privileges required to perform this
operation.

```
{ 
    "message": "Access denied. Admin privileges required."
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{ 
    "message": "Failed to delete schedule." 
}
```

#### 6. Update a specific schedule

Endpoint

- URL Path: **_/api/v1/schedules/:scheduleId_**
- Description: This endpoint updates a specific schedule based on its ID. The
  client sends a PUT request to the server with the schedule's ID as a path
  parameter and the updated schedule information in the request body. The server
  processes the request by updating the specified schedule in the database.
- Authentication and Authorization: This endpoint requires admin-level
  authentication. Only users with admin privileges are allowed to update
  schedule records.

**Request Parameter**

The request should include the following path parameter:

- scheduleId: The unique identifier of the schedule.

**Example Request**

Description: A `PUT` request to update a specific schedule associated with a
scheduleId. This request must include an authorization token for an admin user
and the updated schedule information in the request body.

```

curl -X PUT http://localhost:8080/api/v1/schedules/123 \
-H "Authorization: Bearer <your-jwt-token>" \
-H "Content-Type: application/json" \
-d '{ "scheduleDay": "FRIDAY", "startTime": "13:00:00", "endTime": "17:00:00" }'

```

**Example Responses**

Status Code: **200 OK**

Description: The server successfully updates the schedule.

```
{
    "message": "Schedule updated successfully.",
    "data": {
        "doctorId": 1,
        "scheduleDay": "FRIDAY",
        "startTime": "13:00:00",
        "endTime": "17:00:00",
        "scheduleId": 123
    }
}
```

Status Code: **400 Bad Request**

Description: The provided schedule ID is invalid or missing.

```
{ 
    "message": "Schedule ID is required."
}
```
```
{ 
    "message": "Invalid schedule ID." 
}
```

Description: The request did not include any valid data for updating the schedule. Ensure that at least one field (scheduleDay, startTime, or endTime) is provided and contains a valid value.

```
{ 
    "message": "No changes applied to the schedule." 
}
```

Description: The request did not include any valid fields for updating the schedule. All fields provided in the request were either undefined or missing.

```
{ 
    "message": "All fields are required."
}
```

Description: The provided schedule day is invalid as it is not part of the
allowed enum list.

```
{ 
    "message": "Invalid scheduleDay. Please provide a valid scheduleDay from the allowed list."
}
```

Status Code: **404 Not Found**

Description: No schedule with the specified ID exists in the database.

```
{ 
    "message": "Schedule not found."
}
```

Status Code: **403 Forbidden**

Description: The user does not have admin privileges required to perform this
operation.

```
{ 
    "message": "Access denied. Admin privileges required." 
}
```

Status Code: **500 Internal Server Error**

Description: An unexpected error occurred on the server while processing the
request.

```
{ 
    "message": "Failed to update schedule." 
}
```

## Install

#### 1. Clone current repository into a your directory:

```

git clone https://github.com/MartaKliuchnik/hospital-appointment-scheduler.git

```

#### 2. Switch to project folder:

```

cd hospital-appointment-scheduler

```

#### 3. Install the dependencies:

```

npm install

```

## Run the application 

To run the Hospital Appointment Scheduler application in a Docker container, ensure that Docker and Docker Compose are installed on your system.

### 1. Using Docker Compose

#### Step 1: Build and run the application
With the repository cloned and your terminal in the project directory, start the application by running:

```
docker compose up
```
This command will build and start all the services defined in the docker-compose.yml file.

#### Step 2: Access the application
Once the containers are running, you can access the API at:

`http://localhost:8080/api/v1/`

Note: Ensure that your MySQL database is correctly set up and accessible according to the configuration in your docker-compose.yml.

#### Step 3: Stop the application
When you’re finished, stop the application and clean up the resources by running:

```
docker compose down
```
This command will stop and remove the containers, networks, and volumes that were created by the docker-compose.yml file.

### 2. Using docker pull and docker run

#### Step 1: Pull the docker image
Download the Docker image from Docker Hub:

```
docker pull martakey/hospital-appointment-scheduler:latest
```

#### Step 2: Run the container
Start the application by running the container with the following command:

```
docker run -p 8080:8080 \
  -e DB_HOST=your_mysql_host \
  -e DB_USER=your_db_user \
  -e DB_PASSWORD=your_db_password \
  -e DB_NAME=your_db_name \
  martakey/hospital-appointment-scheduler:latest
```
Replace your_mysql_host, your_db_user, your_db_password, and your_db_name with your MySQL database credentials.

#### Step 3: Access the application
Once the containers are running, you can access the API at:

`http://localhost:8080/api/v1/`

#### Step 4: Stop the container
To stop the container, find the container ID by running:

```
docker ps
```

Then stop it with:

```
docker stop container_id
```
Replace container_id with the actual ID of your running container.

