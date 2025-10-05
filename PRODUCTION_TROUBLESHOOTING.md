# Production Troubleshooting Guide

## 🚨 Common Issues and Solutions

### **Issue 1: "Http failure response: 0 Unknown Error"**

**Symptoms:**
- Frontend shows "Http failure response: 0 Unknown Error"
- Login fails with network error
- Console shows CORS or network errors

**Causes:**
1. **Backend Server Sleeping** (Most Common)
   - Render free tier puts servers to sleep after 15 minutes of inactivity
   - Server takes 30-60 seconds to wake up

2. **CORS Issues**
   - Frontend domain not allowed by backend
   - Missing credentials or headers

3. **Network/SSL Issues**
   - Mixed content (HTTP/HTTPS)
   - SSL certificate problems

**Solutions:**

#### **Solution 1: Wake Up the Backend Server**

```bash
# Test if backend is responding
curl https://computer-lab-inventory-backend-klzb.onrender.com/health

# If you get 503 Server Unavailable, wait 30-60 seconds and try again
# The server will wake up automatically
```

#### **Solution 2: Check CORS Configuration**

The backend is configured to allow:
- ✅ `https://computer-lab-inventory-frontend-d487.onrender.com`
- ✅ `http://localhost:4200` (for development)

#### **Solution 3: Verify Environment Variables**

Check that these are set in Render dashboard:
- ✅ `FRONTEND_URL=https://computer-lab-inventory-frontend-d487.onrender.com`
- ✅ `NODE_ENV=production`

### **Issue 2: Backend Server Keeps Sleeping**

**Solution: Use Keep-Alive Service**

Run the keep-alive script locally:
```bash
node keep-alive.js
```

Or use a free service like UptimeRobot:
1. Go to https://uptimerobot.com
2. Create a free account
3. Add a new monitor:
   - URL: `https://computer-lab-inventory-backend-klzb.onrender.com/health`
   - Interval: 5 minutes
   - Type: HTTP(s)

### **Issue 3: Login Works But Other Features Don't**

**Check:**
1. JWT token is being stored correctly
2. API calls include the Authorization header
3. Backend is not sleeping during usage

### **Issue 4: Database Connection Issues**

**Check Render logs for:**
- Database connection errors
- SSL connection problems
- Authentication failures

### **Issue 5: Slow Response Times**

**Common on Free Tier:**
- First request after sleep: 30-60 seconds
- Subsequent requests: 1-3 seconds
- **Solution:** Upgrade to paid tier or use keep-alive

## 🔍 **Debugging Steps**

### **Step 1: Test Backend Health**
```bash
curl https://computer-lab-inventory-backend-klzb.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-02T...",
  "uptime": 123.45,
  "environment": "production"
}
```

### **Step 2: Test API Endpoints**
```bash
curl https://computer-lab-inventory-backend-klzb.onrender.com/api/test
```

**Expected Response:**
```json
{
  "message": "Server is working!",
  "timestamp": "2025-01-02T...",
  "status": "OK"
}
```

### **Step 3: Check Frontend Network Tab**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for:
   - ✅ Status 200: Success
   - ❌ Status 503: Server sleeping
   - ❌ Status 0: Network/CORS error

### **Step 4: Check Browser Console**
Look for errors like:
- `Access to fetch at '...' from origin '...' has been blocked by CORS policy`
- `Failed to load resource: net::ERR_FAILED`
- `Http failure response for ...: 0 Unknown Error`

## 🚀 **Quick Fixes**

### **Fix 1: Wake Up Server**
1. Wait 30-60 seconds after first failed request
2. Try again - server should be awake

### **Fix 2: Clear Browser Cache**
1. Hard refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache and cookies
3. Try again

### **Fix 3: Check URLs**
- ✅ Backend: `https://computer-lab-inventory-backend-klzb.onrender.com`
- ✅ Frontend: `https://computer-lab-inventory-frontend-d487.onrender.com`

### **Fix 4: Restart Services**
If issues persist:
1. Go to Render dashboard
2. Restart the backend service
3. Wait for deployment to complete
4. Test again

## 📊 **Performance Expectations**

### **Free Tier Limitations:**
- ⏰ **Sleep Time:** 15 minutes of inactivity
- 🚀 **Wake Time:** 30-60 seconds
- 📈 **Response Time:** 1-3 seconds (when awake)
- 💾 **Memory:** 512MB
- 🔄 **CPU:** Shared

### **Paid Tier Benefits:**
- ✅ Always awake (no sleeping)
- ✅ Faster response times
- ✅ More memory and CPU
- ✅ Better reliability

## 🆘 **Emergency Solutions**

### **If Nothing Works:**

1. **Check Render Dashboard:**
   - Service status
   - Recent deployments
   - Error logs

2. **Redeploy Backend:**
   ```bash
   git commit --allow-empty -m "trigger redeploy"
   git push origin main
   ```

3. **Contact Support:**
   - Render support for infrastructure issues
   - Check GitHub issues for similar problems

## ✅ **Success Indicators**

Your system is working correctly when:
- ✅ Backend health check returns 200 OK
- ✅ Frontend can login successfully
- ✅ API calls return data (not 503 errors)
- ✅ No CORS errors in browser console
- ✅ JWT tokens are stored and sent with requests

---

## 🎯 **Summary**

The most common issue is the **backend server sleeping** on Render's free tier. This is normal behavior and the server will wake up automatically when you make a request, but it takes 30-60 seconds.

**For production use, consider:**
1. Using a keep-alive service
2. Upgrading to Render's paid tier
3. Implementing proper error handling for slow responses




