# 🔐 PasswordVault - Secure Password Manager

**Created by Riya Kuila**

A modern, secure password manager built with Next.js featuring end-to-end encryption, 2FA support, and a beautiful glassmorphism UI.

## ✨ Features

### 🔒 **Security**

- **End-to-End Encryption**: All passwords encrypted with your master password
- **2FA/TOTP Support**: Google Authenticator integration with QR codes
- **Secure Authentication**: NextAuth.js with credential-based login
- **Client-Side Encryption**: Passwords never stored in plain text
- **Master Password Protection**: Single password to unlock your entire vault

### 🎨 **Modern UI/UX**

- **Glassmorphism Design**: Premium glass effects throughout the app
- **Responsive Layout**: Perfect on mobile, tablet, and desktop
- **Dark/Light Theme**: Automatic theme switching support
- **Professional Badges**: Visual indicators for 2FA-enabled items
- **Smooth Animations**: Polished transitions and interactions

### 📊 **Data Management**

- **Import/Export**: CSV and JSON export formats
- **Search & Filter**: Find passwords quickly with search and tags
- **Password Generator**: Built-in secure password generator
- **Backup & Restore**: Export encrypted backups of your vault
- **Tag System**: Organize passwords with custom tags

### 🔐 **2FA Features**

- **TOTP Generation**: Time-based one-time passwords
- **QR Code Setup**: Easy setup with Google Authenticator
- **Live Code Display**: Real-time TOTP codes in the interface
- **Secure Verification**: Mathematical validation of codes
- **Visual Indicators**: Clear badges showing 2FA status

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB database
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Riyakuila/password-vault
   cd password-vault
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   MONGODB_URI=mongodb://localhost:27017/passwordvault
   NEXTAUTH_SECRET=your-nextauth-secret-key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

### **First Time Setup**

1. **Sign Up**: Create your account with email and master password
2. **Login**: Use your credentials to access the vault
3. **Unlock Vault**: Enter your master password to decrypt your data

### **Managing Passwords**

1. **Add New Item**: Click "+ Add New" to create password entries
2. **Fill Details**: Enter title, username, password, URL, and notes
3. **Add Tags**: Organize with comma-separated tags
4. **Save**: Your data is automatically encrypted and stored

### **Setting Up 2FA**

1. **Edit an Item**: Click on any password entry
2. **Setup 2FA**: Click "Setup 2FA" in the Two-Factor Authentication section
3. **Scan QR Code**: Use Google Authenticator to scan the QR code
4. **Verify**: Enter the 6-digit code to verify setup
5. **Save**: Your TOTP secret is encrypted and stored

### **Export/Import**

1. **Export**: Click "Export" → Choose CSV or JSON → Enter master password
2. **Import**: Click "Import" → Select backup file → Enter backup password
3. **Formats**:
   - **CSV**: Spreadsheet-friendly format
   - **JSON**: Structured data with metadata

## 🛠️ Technical Stack

### **Frontend**

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling with glassmorphism effects
- **React Hooks**: Modern state management

### **Backend**

- **Next.js API Routes**: Serverless API endpoints
- **MongoDB**: Document database with Mongoose ODM
- **NextAuth.js**: Authentication and session management
- **Crypto-JS**: Client-side encryption/decryption

### **Security Libraries**

- **OTPAuth**: TOTP generation and validation
- **QRCode**: QR code generation for 2FA setup
- **bcrypt**: Password hashing for user accounts
- **Crypto-JS**: AES encryption for vault data

## 🔧 API Endpoints

### **Authentication**

- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/signup` - User registration

### **Vault Management**

- `GET /api/vault` - Fetch encrypted vault items
- `POST /api/vault` - Create new vault item
- `PUT /api/vault/[itemId]` - Update existing vault item
- `DELETE /api/vault/[itemId]` - Delete vault item

### **2FA/TOTP**

- `POST /api/vault/generate-totp` - Generate TOTP secret and QR code

## 🎨 UI Components

### **Glassmorphism Modals**

- **Export Modal**: Choose format and confirm master password
- **Import Modal**: Select file and enter backup password
- **Delete Confirmation**: Secure item deletion confirmation

### **2FA Interface**

- **Setup Flow**: QR code generation and verification
- **Status Display**: Professional badges and indicators
- **Code Input**: Modern 6-digit input with progress dots
- **Live Display**: Real-time TOTP codes for verified items

### **Responsive Design**

- **Mobile-First**: Optimized for touch interfaces
- **Tablet Support**: Perfect layout for medium screens
- **Desktop**: Full-featured experience with side panels

## 🔐 Security Features

### **Encryption**

- **AES-256**: Industry-standard encryption algorithm
- **Master Password**: Single password encrypts all data
- **Client-Side**: Encryption happens in the browser
- **Zero-Knowledge**: Server never sees plain text passwords

### **2FA Security**

- **TOTP Standard**: RFC 6238 compliant implementation
- **Time Windows**: Accounts for clock synchronization
- **Secure Storage**: TOTP secrets encrypted with master password
- **Google Authenticator**: Full compatibility with popular apps

### **Authentication**

- **Secure Sessions**: NextAuth.js session management
- **Password Hashing**: bcrypt for user account passwords
- **CSRF Protection**: Built-in request forgery protection
- **Secure Headers**: Proper security headers and policies

## 📦 Build & Deploy

### **Development**

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Production Deployment**

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Set production environment variables**

   ```env
   MONGODB_URI=mongodb://your-production-db
   NEXTAUTH_SECRET=your-production-secret
   ```

3. **Deploy to Vercel** (Recommended)
   ```bash
   vercel --prod
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Riya Kuila**

- GitHub: [https://github.com/Riyakuila](https://github.com/Riyakuila)
- Email: riyakuila539@gmail.com.com

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- OTPAuth library for TOTP implementation
- All contributors and testers

---

**⚠️ Security Note**: This is a client-side encrypted password manager. Always keep your master password secure and create regular backups of your vault data.

**🔒 Privacy**: Your passwords are encrypted locally and never transmitted in plain text. The server only stores encrypted data that can only be decrypted with your master password.
