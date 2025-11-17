# EEU Complaint Management System

A modern, mobile-first Progressive Web App (PWA) for managing customer complaints with Android-style design and enterprise-level performance optimizations.

## 🚀 Features

### ✨ Modern UI/UX
- **Material Design 3** principles
- **Android-style navigation** with bottom tabs and FAB
- **Responsive design** for all screen sizes
- **Dark/Light theme** support
- **Smooth animations** and micro-interactions

### 📱 Progressive Web App (PWA)
- **Installable** on any Android device
- **Offline-first** architecture
- **Background sync** for offline operations
- **Push notifications** support
- **Native app-like experience**

### ⚡ Performance Optimizations
- **Advanced caching** with TTL-based expiration
- **Optimistic updates** for instant UI feedback
- **Retry logic** with exponential backoff
- **Data compression** for efficient transfers
- **Batch operations** for bulk processing

### 🔧 Enterprise Features
- **Google Sheets integration** via Apps Script
- **Real-time synchronization**
- **Advanced filtering and search**
- **Bulk operations** support
- **Export functionality** (CSV/JSON)
- **Role-based permissions**

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Radix UI + Tailwind CSS + shadcn/ui
- **State Management**: React Query + Context API
- **Backend**: Node.js + Express + Google Apps Script
- **Database**: Google Sheets (via Apps Script)
- **Deployment**: Netlify (Frontend) + Railway/Heroku (Backend)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Google Apps Script project (for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eeulogin-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Development**
   ```bash
   # Start frontend (with hot reload)
   npm run dev

   # Start backend (in separate terminal)
   node server.js
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🌐 Deployment to Netlify

### Frontend Deployment

1. **Connect to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your Git repository

2. **Build Settings**
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

3. **Environment Variables** (if needed)
   - Add any required environment variables in Netlify dashboard

4. **Deploy**
   - Netlify will automatically build and deploy your app
   - Your PWA will be available at the generated URL

### Backend Deployment

Deploy the backend (`server.js`) to Railway, Heroku, or any Node.js hosting service:

1. **Railway** (Recommended)
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Environment Variables for Backend**
   ```env
   GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   PORT=3001
   NODE_ENV=production
   ```

## 📱 PWA Installation

### On Android Devices
1. Open the deployed app in Chrome/Samsung Internet
2. Tap the menu (⋮) → "Add to Home screen"
3. Follow the prompts to install

### Features Available After Installation
- **Offline access** to cached data
- **Background sync** when online
- **Push notifications** (if configured)
- **Native app shortcuts**
- **Splash screen** on launch

## 🔧 Configuration

### Google Apps Script Setup
1. Create a new Apps Script project
2. Copy the GAS code from `code.gs`
3. Deploy as web app
4. Update `GAS_URL` in environment variables

### Environment Variables
```env
# Frontend
VITE_API_BASE_URL=https://your-backend-url.com

# Backend
GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
PORT=3001
NODE_ENV=production
```

## 📊 Performance Monitoring

The app includes comprehensive performance optimizations:

- **Service Worker** for caching strategies
- **Background sync** for offline operations
- **Optimistic updates** for better UX
- **Retry mechanisms** for network failures
- **Data compression** for efficient transfers

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for your frontend domain
   - Check `allowedHeaders` in server.js

2. **PWA Not Installing**
   - Ensure HTTPS is enabled (Netlify provides this)
   - Check web app manifest configuration
   - Verify service worker registration

3. **Build Failures**
   - Ensure Node.js version is 18+
   - Check that all dependencies are installed
   - Verify environment variables are set

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation

---

**Built with ❤️ for Ethiopian Electric Utility - Modernizing complaint management for the digital age!**
