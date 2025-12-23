# 广西自动化学会会员管理系统 (Guangxi Association of Automation Member Management System)

A web-based member management system built with React, Vite, Tailwind CSS, and Supabase.

## Features

- **Authentication**: Member and Admin login/registration.
- **Member Dashboard**:
  - View Profile (Membership Level, Status, Payment).
  - Apply for Membership/Upgrade via form (simulated email submission).
- **Admin Dashboard**:
  - View all members.
  - Update member details (Role, Level).
  - Review Applications (Approve/Reject).
  - Export Member List to Excel.
  - Send Email Notifications (Simulated).

## Setup Instructions

### 1. Database Setup (Supabase)

This project uses Supabase as the backend. You need to set up the database schema.

1.  Log in to your Supabase project dashboard.
2.  Go to the **SQL Editor**.
3.  Open the `db_schema.sql` file provided in this project.
4.  Copy the content of `db_schema.sql` and paste it into the Supabase SQL Editor.
5.  Run the script to create tables and policies.

### 2. Environment Variables

Ensure the `.env` file is present in the root directory with your Supabase credentials.

### 3. Installation & Run

```bash
npm install
npm run dev
```

### 4. Creating an Admin

By default, new users are "members". To create an admin:
1.  Register a new user via the app.
2.  Go to Supabase Table Editor > `profiles`.
3.  Find your user and change `role` from `member` to `admin`.
4.  (Optional) You can also use the SQL Editor:
    ```sql
    update profiles set role = 'admin' where email = 'your_email@example.com';
    ```

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, Database)
- **Icons**: Lucide React
- **Utils**: XLSX (Excel Export)
