# Google reCAPTCHA v2 Setup Guide

## Step 1: Get reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin/create
2. Fill in the form:
   - **Label**: SecureStay (or any name you prefer)
   - **reCAPTCHA type**: Select "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - **Domains**: Add the following domains:
     - `localhost` (for local development)
     - Your production domain (e.g., `yourdomain.com`)
3. Accept the terms and click "Submit"
4. You'll receive two keys:
   - **Site Key** (public key - used in frontend)
   - **Secret Key** (private key - used in backend)

## Step 2: Install Required Package

In the `client` directory, install the reCAPTCHA package:

```bash
cd client
npm install react-google-recaptcha
```

## Step 3: Configure Environment Variables

### Backend Configuration

Edit `backend/.env` and replace the placeholder with your Secret Key:

```env
RECAPTCHA_SECRET_KEY=your_actual_secret_key_here
```

### Frontend Configuration

Edit `client/.env` and replace the placeholder with your Site Key:

```env
VITE_RECAPTCHA_SITE_KEY=your_actual_site_key_here
```

## Step 4: Restart Your Servers

After adding the keys, restart both servers:

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd client
npm run dev
```

## Step 5: Test the Registration

1. Open your browser and go to the registration page
2. Fill in the registration form
3. Complete the "I'm not a robot" reCAPTCHA challenge
4. Submit the form

## How It Works

### Frontend (Register.jsx)
- Displays the reCAPTCHA widget
- Captures the reCAPTCHA token when user completes the challenge
- Sends the token along with registration data to the backend

### Backend (authController.js)
- Receives the reCAPTCHA token
- Verifies the token with Google's API
- Only allows registration if verification succeeds
- Returns error if reCAPTCHA fails

## Troubleshooting

### "Please complete the reCAPTCHA verification"
- Make sure you clicked the reCAPTCHA checkbox before submitting

### "reCAPTCHA verification failed"
- Check that your Secret Key is correct in `backend/.env`
- Ensure your domain is registered in Google reCAPTCHA admin

### reCAPTCHA widget not showing
- Check that your Site Key is correct in `client/.env`
- Make sure you installed `react-google-recaptcha` package
- Check browser console for errors

### "Invalid domain for site key"
- Make sure `localhost` is added to your domains in reCAPTCHA admin
- For production, add your actual domain

## Security Notes

- Never commit your `.env` files to version control
- The Secret Key should only be on the server
- The Site Key is public and safe to expose in frontend code
- reCAPTCHA tokens are single-use and expire after a few minutes
