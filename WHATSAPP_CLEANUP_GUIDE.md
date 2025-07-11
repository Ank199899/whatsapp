# WhatsApp Session Cleanup Guide

This guide explains how to remove all WhatsApp session history from your application.

## 🧹 What Gets Cleaned Up

The cleanup process removes:

- **Active WhatsApp Sessions**: All connected WhatsApp Web sessions
- **Session Directories**: Browser data and authentication files
- **QR Code Cache**: Stored QR codes and temporary data
- **Browser Cache**: Puppeteer cache and temporary files
- **Authentication Tokens**: Stored login credentials

## 🚀 Methods to Clean Up Sessions

### Method 1: Using the Web Interface (Recommended)

1. **Access WhatsApp Setup Page**
   - Go to your application dashboard
   - Navigate to "WhatsApp Web Setup" page
   - Click the "Session Cleanup" button in the header

2. **Review Current Status**
   - See how many active sessions exist
   - Check session directories count
   - View cleanup status

3. **Perform Cleanup**
   - Click "Cleanup All Sessions"
   - Confirm the action (this cannot be undone)
   - Wait for completion message

### Method 2: Using the Cleanup Script

1. **Run the Script**
   ```bash
   node cleanup-whatsapp-sessions.js
   ```

2. **What the Script Does**
   - Scans for all session-related directories
   - Removes WhatsApp Web session data
   - Cleans browser cache and temporary files
   - Provides detailed progress output

### Method 3: Using the API

1. **Check Cleanup Status**
   ```bash
   GET /api/whatsapp/cleanup-status
   ```

2. **Perform Cleanup**
   ```bash
   POST /api/whatsapp/cleanup-all
   ```

3. **Test with PowerShell Script**
   ```powershell
   .\test-cleanup-api.ps1
   ```

## 📋 After Cleanup Steps

Once cleanup is complete:

1. **Restart Application Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Connect New WhatsApp Number**
   - Go to WhatsApp Setup page
   - Click "Generate QR Code"
   - Scan with your WhatsApp mobile app
   - Wait for connection confirmation

3. **Verify Connection**
   - Check that your phone number appears
   - Test sending a message
   - Confirm real-time sync is working

## ⚠️ Important Notes

### Before Cleanup
- **Backup Important Data**: Export any important conversations or contacts
- **Notify Users**: If this is a production system, inform users of downtime
- **Stop Active Campaigns**: Pause any running message campaigns

### During Cleanup
- **Don't Interrupt**: Let the cleanup process complete fully
- **Monitor Logs**: Check console output for any errors
- **Be Patient**: Large session histories may take time to clean

### After Cleanup
- **Fresh Start**: All WhatsApp connections will be new
- **Re-sync Data**: Contacts and conversations will need to be re-synced
- **Test Functionality**: Verify all features work correctly

## 🔧 Troubleshooting

### Common Issues

1. **"Permission Denied" Errors**
   - Run as administrator (Windows) or with sudo (Linux/Mac)
   - Check file permissions on session directories

2. **"Directory Not Found" Warnings**
   - These are normal if directories were already cleaned
   - The script handles missing directories gracefully

3. **API Authentication Errors**
   - Ensure you're logged into the application
   - Check that the server is running on the correct port

4. **Incomplete Cleanup**
   - Run the cleanup script multiple times if needed
   - Manually delete stubborn directories if necessary

### Manual Cleanup (Last Resort)

If automated cleanup fails, manually delete these directories:

```
whatsapp-web-sessions/
tokens/
.wwebjs_auth/
.wwebjs_cache/
_IGNORE_session_*/
session_*/
```

## 🎯 Best Practices

1. **Regular Cleanup**: Clean up sessions periodically to prevent accumulation
2. **Monitor Storage**: Keep an eye on disk space usage
3. **Document Changes**: Keep track of when cleanups are performed
4. **Test After Cleanup**: Always verify functionality after cleanup
5. **Backup Strategy**: Have a backup plan for important data

## 📞 Support

If you encounter issues with the cleanup process:

1. Check the console logs for error messages
2. Verify all files have proper permissions
3. Ensure the application server is running
4. Try running cleanup multiple times
5. Contact support with specific error messages

---

**Remember**: Session cleanup is irreversible. Make sure you want to remove all WhatsApp connections before proceeding!
