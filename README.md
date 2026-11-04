# Locify

<div align="center">
  <img src="public/logo.png" alt="Locify Logo" width="200"/>
</div>

## About The Project

Locify is a modern, secure peer-to-peer file sharing application that enables direct file transfers between users without uploading to any server. Built with WebRTC technology, it provides fast, encrypted, and unlimited file sharing capabilities through your browser.

Unlike traditional file sharing services, Locify establishes direct connections between peers, ensuring your files never touch a server. This means faster transfers, complete privacy, and no file size restrictions.

### Key Features

- ** Unlimited File Size** - Transfer files of any size without restrictions
- ** End-to-End Encrypted** - Direct P2P connections ensure complete privacy
- ** Lightning Fast** - WebRTC technology for maximum transfer speeds
- ** Modern UI** - Beautiful, responsive interface with dark mode support
- ** Multi-User Support** - Share with up to 5 users simultaneously in public rooms
- ** Cross-Platform** - Works on desktop and mobile browsers
- ** Easy Sharing** - Simple room codes and QR codes for quick access
- ** Anonymous Avatars** - Fun, randomly generated animal avatars for each user
- ** Real-Time Progress** - Live transfer status and speed indicators
- ** No Installation** - Works directly in your browser

## Built With

### Frontend
- **[React 18](https://react.dev/)** - Modern UI library
- **[Vite](https://vitejs.dev/)** - Next-generation frontend tooling
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready animation library
- **[React Router v6](https://reactrouter.com/)** - Client-side routing
- **[Socket.IO Client](https://socket.io/)** - Real-time bidirectional communication
- **[simple-peer](https://github.com/feross/simple-peer)** - WebRTC wrapper for P2P connections
- **[react-dropzone](https://react-dropzone.js.org/)** - Drag-and-drop file uploads
- **[QRCode.react](https://www.npmjs.com/package/qrcode.react)** - QR code generation
- **[Lucide React](https://lucide.dev/)** - Beautiful icon library

### Backend
- **[Python Flask](https://flask.palletsprojects.com/)** - Lightweight web framework
- **[Flask-SocketIO](https://flask-socketio.readthedocs.io/)** - WebSocket support for Flask
- **[Flask-CORS](https://flask-cors.readthedocs.io/)** - Cross-origin resource sharing
- **[MongoDB](https://www.mongodb.com/)** (Optional) - Transfer logging and analytics

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **pip** - Python package manager (comes with Python)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/locify.git
cd locify
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Development
VITE_SOCKET_URL=http://localhost:8000
```

For production, use `.env.production`:

```env
# Production
VITE_SOCKET_URL=https://your-backend-url.com
```

Backend environment variables (optional):

```env
ADMIN_COOKIE_PASS=your-secret-key
MONGO_URL=your-mongodb-connection-string  # or 'test' to disable
BACKEND_PORT=8000
```

## Usage

### Development Mode

#### 1. Start the Backend Server

```bash
python server.py
```

The backend will start on `http://localhost:8000`

#### 2. Start the Frontend Development Server

In a new terminal:

```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

#### 3. Access the Application

Open your browser and navigate to `http://localhost:5173`

### Production Build

```bash
# Build the frontend
npm run build

# Preview the production build
npm run preview
```

### How to Share Files

1. **Create a Room**
   - Click "Get Started" on the landing page
   - Choose "Create Private Room" (2 users) or "Create Public Room" (up to 5 users)
   - You'll receive a unique room code

2. **Share the Room**
   - Share the room link or QR code with recipients
   - Or share the room code for manual entry

3. **Transfer Files**
   - Once connected, drag and drop files into the transfer area
   - Or click to browse and select files
   - Watch real-time transfer progress
   - Recipients can download files as they arrive

## Project Structure

```
locify/
├── public/
│   ├── logo.png              # Application logo
│   ├── worker.js             # Web Worker for file assembly
│   ├── manifest.json         # PWA manifest
│   └── robots.txt            # SEO configuration
├── src/
│   ├── assets/
│   │   └── avatars/          # 51 unique animal avatars
│   ├── components/
│   │   ├── avatar/           # Avatar display component
│   │   ├── avatarSelector/   # Avatar selection UI
│   │   ├── filedropper/      # File upload dropzone
│   │   ├── filemodal/        # File transfer modal
│   │   ├── qrcode/           # QR code generator
│   │   ├── SocialSharing/    # Share functionality
│   │   └── ...               # Other UI components
│   ├── context/
│   │   ├── RoomContext.jsx   # WebRTC & Socket.IO logic
│   │   └── Maincontext.jsx   # Global state management
│   ├── pages/
│   │   ├── LoadingPage.jsx   # Landing page
│   │   ├── HomePage.jsx      # Marketing page
│   │   ├── Dashboard.jsx     # Room creation/joining
│   │   ├── Room.jsx          # Private room (2 users)
│   │   └── PublicRoom.jsx    # Public room (5 users)
│   ├── routes/               # Legacy route components
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Global styles with Tailwind
├── server.py                 # Python Flask backend
├── requirements.txt          # Python dependencies
├── package.json              # Node.js dependencies
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── render.yaml               # Render deployment config
└── .env                      # Environment variables
```

## Features in Detail

### WebRTC Peer-to-Peer Technology

Locify uses WebRTC (Web Real-Time Communication) to establish direct connections between users:

- **Direct Transfer**: Files go directly from sender to receiver
- **No Server Storage**: Your files never touch our servers
- **Maximum Speed**: Limited only by your internet connection
- **Complete Privacy**: End-to-end encrypted by default

### Room Types

**Private Rooms** (2 users max)
- Perfect for one-on-one file sharing
- Simple and secure
- Ideal for sensitive documents

**Public Rooms** (5 users max)
- Share with multiple people simultaneously
- Great for team collaboration
- Everyone can send and receive files

### Real-Time Features

- **Live Connection Status**: See when users join or leave
- **Transfer Progress**: Real-time progress bars and speed indicators
- **User Presence**: Visual indicators for connected users
- **Instant Notifications**: Toast notifications for all events

### Security & Privacy

- **No File Storage**: Files are never stored on servers
- **Direct Connections**: P2P technology ensures privacy
- **Temporary Rooms**: Rooms are destroyed when empty
- **Anonymous by Default**: No account or personal info required

### User Experience

- **Drag & Drop**: Intuitive file upload interface
- **Dark Mode**: Easy on the eyes for night owls
- **Responsive Design**: Works on all screen sizes
- **Smooth Animations**: Polished UI with Framer Motion
- **QR Code Sharing**: Quick room access via QR codes

## API Endpoints

### REST API

- `GET /` - Health check and server status
- `POST /log` - Log file transfer data
- `GET /datasum` - Get total data transferred
- `GET /countUsers` - Get total number of users
- `GET /dataLog` - Get all transfer logs

### Socket.IO Events

**Client → Server**
- `join room` - Join a private room
- `join room using ip` - Join a public room
- `sending signal` - Send WebRTC offer
- `returning signal` - Send WebRTC answer

**Server → Client**
- `all users` - List of users in room
- `usernames` - User avatar assignments
- `user joined` - New user connected
- `user left` - User disconnected
- `room full` - Room capacity reached

## License

Distributed under the MIT License. See `LICENSE` for more information.