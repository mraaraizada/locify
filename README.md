# Locify - Modern P2P File Sharing

A modern, redesigned version of the Vegh file sharing application with Vite, React 18, and Tailwind CSS.

## Features

- ✅ Modern UI with Tailwind CSS and Framer Motion animations
- ✅ P2P file transfer using WebRTC
- ✅ Real-time connections with Socket.IO
- ✅ Private rooms (2 users max)
- ✅ No file size limits
- ✅ End-to-end encrypted transfers
- ✅ Dark mode support
- ✅ Responsive design

## Tech Stack

### Frontend
- React 18.3.1
- Vite (fast build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- React Router v6 (routing)
- Socket.IO Client (WebSocket)
- simple-peer (WebRTC)
- react-dropzone (file uploads)

### Backend
- Python Flask (from root project)
- Flask-SocketIO
- See root `server.py`

## Installation

### 1. Install Dependencies

```bash
cd orchids-use-the-attached-main/orchids-use-the-attached-main
npm install
```

### 2. Configure Environment

The `.env` file is already configured:

```env
VITE_SOCKET_URL=http://localhost:8000
```

## Running the Application

### Start Backend (from root folder)

```bash
# Go to root folder
cd ../..

# Start Python backend
python server.py
```

Backend runs on: `http://localhost:8000`

### Start Frontend (in this folder)

```bash
# In orchids folder
npm run dev
```

Frontend runs on: `http://localhost:5173` (Vite default)

## Usage

1. Open `http://localhost:5173` in your browser
2. Click "Get Started" or navigate to `/dashboard`
3. Create a new room or join an existing one
4. Share the room link with someone
5. Once connected, drag and drop files to send!

## Project Structure

```
orchids-use-the-attached-main/
├── src/
│   ├── context/
│   │   └── RoomContext.jsx      # WebRTC & Socket.IO logic
│   ├── pages/
│   │   ├── LoadingPage.jsx      # Landing page
│   │   ├── HomePage.jsx         # Marketing page
│   │   ├── Dashboard.jsx        # Create/Join room
│   │   └── Room.jsx             # File transfer room
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Tailwind styles
├── public/
│   └── worker.js                # Web Worker for file assembly
├── .env                         # Environment variables
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
└── tailwind.config.js           # Tailwind configuration
```

## Key Components

### RoomContext
Manages WebRTC connections, Socket.IO events, and file transfers. Provides:
- `connectionEstablished` - Connection status
- `users` - Connected users
- `sendFile()` - Send file to peer
- `joinRoom()` - Join a room
- `leaveRoom()` - Leave room

### Room Page
Main file transfer interface with:
- Drag & drop file upload
- Real-time transfer progress
- User avatars
- Connection status
- Received files list

### Dashboard
Room creation and joining interface

## Differences from Original

| Feature | Original | Orchids |
|---------|----------|---------|
| Build Tool | Create React App | Vite |
| React Version | 16.13.1 | 18.3.1 |
| Styling | Custom CSS/SCSS | Tailwind CSS |
| Animations | Basic | Framer Motion |
| Router | v5 | v6 |
| UI Design | Functional | Modern & Polished |

## Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

- `VITE_SOCKET_URL` - Backend Socket.IO URL (default: http://localhost:8000)

## Troubleshooting

### Port Already in Use
If port 5173 is in use, Vite will automatically use the next available port.

### Connection Failed
1. Ensure backend is running on port 8000
2. Check `.env` file has correct `VITE_SOCKET_URL`
3. Clear browser cache and refresh

### Module Not Found
```bash
npm install
```

### WebRTC Connection Issues
- Check firewall settings
- Ensure both users are on same network or use STUN servers
- Check browser console for errors

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with WebRTC support

## License

MIT License

## Credits

- Original Vegh project
- Modern redesign with Tailwind CSS
- WebRTC technology
- Socket.IO for signaling
