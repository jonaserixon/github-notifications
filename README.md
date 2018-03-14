Application is not deployed anywhere yet. Only works locally for now.

# 2 - Web Application Development Assignment
**Setup instructions:**
1. Run ```npm install```
2. Download and run ngrok (https://ngrok.com/download)
3. Run ```ngrok.exe http 8000``` in ngrok terminal
4. Copy ngrok URL (ex. http://4452afa3.ngrok.io) and paste it in the .env file found in project root folder as ```NGROK_URL```
5. Start application with ```npm run chaos```

**Bugs** 
- If you are subscribed to more than 1 event and click unsubscribe the server will crash
- Unread notifications will not be treated as read until user has logged out

