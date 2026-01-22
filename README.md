# SyncBoard - Real-Time Collaborative Kanban Board

![Status](https://img.shields.io/badge/Status-Live-success) ![Stack](https://img.shields.io/badge/Tech-MERN_Stack-blue)

**SyncBoard** is a full-stack project management tool (Trello clone) that features **real-time synchronization**. When one user moves a task, it instantly updates on every other active user's screen without a page refresh.

🔗 **Live Demo:** [Insert Your Vercel Link Here]  
🔗 **Backend API:** [Insert Your Render Link Here]

## 🚀 Key Features (Why this project stands out)

* **⚡ Real-Time Collaboration:** Powered by **Socket.io**, changes are broadcasted instantly to all connected clients in the same room.
* **🖱️ Drag & Drop Interface:** Smooth, intuitive task management using `@hello-pangea/dnd`.
* **🔒 JWT Authentication:** Secure Signup/Login system with password hashing (Bcrypt) and session management.
* **📂 Complex State Management:** Handles optimistic UI updates for zero-latency interactions while syncing with MongoDB in the background.
* **🛡️ Multi-User Architecture:** Users have private boards protected by middleware authorization.

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React (Vite), Axios, React Beautiful DnD |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose Schema Design) |
| **Real-Time** | Socket.io (WebSockets) |
| **Auth** | JSON Web Tokens (JWT), Bcrypt.js |
| **Deployment** | Vercel (Client) + Render (Server) |

## 🏗️ Architecture

The application uses a decoupled **Client-Server** architecture:

1.  **Client:** React app sends REST API requests for Auth and Initial Data.
2.  **Server:** Express API processes requests and talks to MongoDB Atlas.
3.  **Socket:** A persistent WebSocket connection handles the "live" board updates.

## 📦 Installation & Setup

If you want to run this locally:

### 1. Clone the repository
```bash
git clone [https://github.com/YOUR_USERNAME/syncboard.git](https://github.com/YOUR_USERNAME/syncboard.git)
cd syncboard