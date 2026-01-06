# Projectify

> **Collaborative Project Management System with Microservices Architecture**
>
> _Made with ❤️ by Michael Mesanagrenos_
>
> _Developed for the Cloud Computing course (ΠΛΗ513) at the Technical University of Crete._

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)](https://www.docker.com/)
[![GCP](https://img.shields.io/badge/Google_Cloud-Deployed-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com/)

## 1. Project Description

**Projectify** is a collaborative task management application designed for teams. It allows users to create teams, assign tasks, track progress, and communicate via comments and real-time notifications. The architecture follows a microservices pattern, ensuring scalability and separation of concerns.

### Key Features

- **Microservices Architecture:** 4 distinct backend services (User, Team, Task, Notification).
- **Real-time Communication:** Built-in WebSockets (Socket.io) for instant notifications on task updates.
- **File Management:** Integration with **Google Cloud Storage (GCS)** for task attachments.
- **Kanban Workflow:** Manage tasks through TODO, IN_PROGRESS, and DONE stages.
- **Visual Analytics:** Interactive charts for tracking team velocity and task distribution.

---

## 2. Architecture & Security Implementation

The application is not just a set of containers; it is secured behind a robust **Nginx API Gateway**.

### Security Layers

Implemented a "Defense in Depth" strategy using Nginx as a reverse proxy. Key security features include:

1.  **SSL/TLS Encryption:**
    - Implemented via **Let's Encrypt (Certbot)** using the standalone challenge.
    - Forces HTTPS via **HSTS** (HTTP Strict Transport Security) to prevent protocol downgrade attacks.
2.  **Rate Limiting:**
    - Configured a `limit_req_zone` allowing **10 requests/second** per IP.
    - Protects the API services against DDoS and Brute-Force attacks.
3.  **Clickjacking Protection:**
    - `X-Frame-Options: DENY`: Prevents the site from being embedded in iframes.
4.  **Content Security Policy (CSP):**
    - A strict policy allows resources only from self, Google Fonts, and Google Cloud Storage (for images), preventing XSS attacks.
5.  **CORS & Sniffing:**
    - `X-Content-Type-Options: nosniff` prevents MIME type sniffing.

### Infrastructure Diagram

- **Frontend:** React (Vite)
- **Gateway:** Nginx (Port 443/80)
- **Backend:** Node.js Express Cluster
- **Data Persistence:** PostgreSQL (Users), MongoDB (Tasks/Teams), Redis (Pub/Sub).

---

## 3. Installation & Running (Local)

### Prerequisites

- Docker & Docker Compose
- Git

### Step 1: Start the Application

The entire stack (Frontend + 4 Services + Databases + Gateway) is containerized.

```bash
# Clone the repo
git clone [https://github.com/Brilliafy/Projectify.git](https://github.com/Brilliafy/Projectify.git)
cd Projectify

# Build and Run
docker compose down
docker compose up -d --build
```

### Step 2: Database Seeding (Admin Account)

The system requires an ADMIN account to activate other users. Run the following script to inject the admin user into the PostgreSQL container:

```js
// Save as seedAdmin.js and run: node seedAdmin.js
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  const client = new Client({
    host: "localhost",
    port: 5432,
    database: "userdb",
    user: "admin",
    password: "password123",
  });

  try {
    await client.connect();
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await client.query(
      `INSERT INTO "User" (email, password, "fullName", role, "isActive", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [
        "admin@projectify.com",
        hashedPassword,
        "System Administrator",
        "ADMIN",
        true,
      ]
    );

    console.log("Admin created: admin@projectify.com / admin123");
    await client.end();
  } catch (error) {
    console.error(error);
  }
}
createAdmin();
```

---

## 4. Google Cloud Platform (GCP) Migration

The application was migrated to a **Google Compute Engine (GCE)** instance. Below are the specific details of the deployment environment and configuration.

### Deployment Environment

- **OS:** Debian 12 (Bookworm)
- **Machine Type:** e2-medium (Cost-optimized for university project scope)
- **Networking:** Configured with **Standard Tier** networking to reduce ephemeral IP costs compared to Premium Tier.
- **IAM Strategy:** Replaced the default Compute Engine Service Account with a custom identity limited strictly to:
  - `Storage Object Admin` (For managing GCS attachments)
  - `Logging Agent`

### Automated Deployment Script

To streamline the deployment on the VM, I created `install.sh` which handles Docker installation, Firewall rules, and container startup.

```bash
#!/bin/bash
set -e

echo "--- Starting Projectify Deployment ---"

# 1. Install Docker Engine
if ! command -v docker &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    # ... (Standard Docker GPG and Repo setup) ...
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi

# 2. Configure Firewall (UFW)
# We explicitly open HTTP/HTTPS while keeping the rest locked down
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
echo "y" | sudo ufw enable

# 3. Launch Containers
sudo docker compose down
sudo docker compose up -d --build

echo "Deployment Complete. App is running on standard ports."
```

### Production Nginx Configuration

This configuration handles the SSL termination, WebSocket upgrades for Socket.io, and the security headers mentioned earlier.

```conf
# Rate Limiting Zone: 10 requests per second
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# HTTP -> HTTPS Redirect
server {
    listen 80;
    server_name projectify-dev.duckdns.org;
    return 301 https://$host$request_uri;
}

# Main HTTPS Server
server {
    listen 443 ssl;
    server_name projectify-dev.duckdns.org;

    # SSL Certs (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/projectify-dev.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/projectify-dev.duckdns.org/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CSP: Allow Google Fonts, GCS Images, and WebSockets
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' [https://fonts.googleapis.com](https://fonts.googleapis.com); font-src 'self' data: [https://fonts.gstatic.com](https://fonts.gstatic.com); img-src 'self' data: [https://storage.googleapis.com](https://storage.googleapis.com); connect-src 'self' wss://projectify-dev.duckdns.org [https://projectify-dev.duckdns.org](https://projectify-dev.duckdns.org) [https://storage.googleapis.com](https://storage.googleapis.com);" always;

    # Frontend Routing
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # API Routing with Rate Limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://nginx-gateway; # Internal routing
    }

    # WebSocket Support (Socket.io)
    location /socket.io/ {
        proxy_pass http://notification-service:3004/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}
```

---

## 5. User Manual & UI Guide

### Onboarding

1.  Navigate to `/login` and select **Register**.
2.  Fill in your details. _Note: Accounts are created in an INACTIVE state._
3.  An **Administrator** must log in to the Admin Panel and "Activate" the user.

### Roles & Permissions

- **Admin:** Can manage users (activate/delete), change roles, and view all system data.
- **Team Leader:** Can create Teams, add Members, create Tasks, and assign work.
- **Member:** Can view assigned tasks, update status (e.g., move to "Done"), and comment.

### Managing Work

1.  **Dashboard:** Provides a high-level view of your tasks and a graph of task status distribution.
2.  **Tasks Page:**
    - **Filter:** Use the sidebar to filter by Priority (High/Medium) or Context (Specific Team).
    - **Edit:** Click any task to open the modal. Here you can change the status, edit descriptions, or add rich-text comments.
    - **Attachments:** Drag and drop files to upload them to Google Cloud Storage directly from the task modal.

---

## 6. Database & Persistence

To ensure data integrity during updates, we use Docker Volumes for all databases.

- **PostgreSQL (User Service):** Stores user credentials and RBAC data.
- **MongoDB (Team/Task Services):** Stores unstructured data like team hierarchies and task metadata.
- **Redis (Notification Service):**
  - Configured with **AOF (Append Only File)** persistence.
  - Ensures that queued notifications are not lost if the container restarts.

---

## 7. API Reference

All endpoints are prefixed with `/api` and require a Bearer Token (JWT).

| Service  | Method | Endpoint                    | Description                      |
| :------- | :----- | :-------------------------- | :------------------------------- |
| **User** | POST   | `/users/login`              | Authenticate & Retrieve Token    |
| **User** | PATCH  | `/users/admin/:id/activate` | Activate a pending user          |
| **Team** | POST   | `/teams`                    | Create a new team                |
| **Task** | GET    | `/tasks`                    | Retrieve tasks with filters      |
| **Task** | POST   | `/tasks`                    | Create task with GCS attachments |

---

### License

This project is licensed under the **GNU AGPLv3 License**.
_Not recommended for commercial use without open-sourcing derived code._
