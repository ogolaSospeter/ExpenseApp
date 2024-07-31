# Expense Tracker Application

## Description

The Expense Tracker Application is a robust web application designed to help users manage their personal finances by tracking their income and expenses. Built with a Node.js and Express.js backend, and a frontend developed using HTML, CSS, and JavaScript, this application provides a seamless experience for users to monitor their spending habits and make informed financial decisions.

## Features

- **User Authentication**: Implemented secure user registration and login using sessions or cookies to manage user sessions.
- **Expense Management**: Users can add, edit, delete, and view their expenses.
- **Income Management**: Users can track their income sources and amounts.
- **Expense Categories**: Categorized expenses for better organization and analysis.
- **Data Visualization**: Integrated interactive charts and graphs to visualize income and expenses.
- **Responsive Design**: Ensured a mobile-friendly design for a smooth experience on any device.
- **Error Handling & Validation**: Comprehensive error handling and input validation to ensure data integrity and a smooth user experience.

## Deliverables

1. **Backend API**: 
   - User authentication endpoints (login, registration).
   - Endpoints for managing expenses (add, edit, delete, view).
   - Endpoints for managing income (add, edit, delete, view).

2. **Frontend Interface**:
   - User-friendly interface for managing expenses and income.
   - Dynamic dashboard displaying expenses and income data.
   - Visual representation of financial data through charts and graphs.

3. **Database Integration**:
   - Designed and implemented a MySQL database schema for storing user data, expenses, and income.
   - Established a connection between the backend and MySQL using the `mysql2` library.

4. **Security Measures**:
   - Implemented session management for secure user authentication.
   - Applied input validation and error handling to prevent security vulnerabilities.

5. **Deployment**:
   - Deployed the application on a cloud platform, making it accessible to users online.

## Getting Started

### Prerequisites

- Node.js and npm installed
- MySQL database setup

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ogolaSospeter/ExpenseApp
   ```
2. Install dependencies:
   ```bash
   cd expense-tracker-app
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add your MySQL database credentials and session secret.
4. Run the application:
   ```bash
   npm start
   ```

## Usage

1. Register a new user account.
2. Log in with your credentials.
3. Start adding, editing, and deleting your expenses and income.
4. View your financial data on the dashboard with interactive charts and graphs.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.

---
