# magnolia
a lightweight chrome extension that helps shoppers make smarter decisions about their clothes


## Setup
This project contains two main directories: /client and /server.

## Client
The frontend for this project is a Chrome extension. While this extension isn't deployed yet, you can upload it onto Chrome developer tools yourself to test out the project. To do this, go to chrome://extensions and toggle Developer Mode. Then, click Load Unpacked and select the client directory in this project. You should be able to see a new extension named magnolia in your browser. You can pin the extension by clicking the puzzle piece icon in the top right of your Chrome browser, and clicking the pin icon on magnolia.

Clicking on the extension icon for magnolia will popup the extension, which shows insights on fabric composition, care instructions, and red flags in reviews for users to make a more educated decision on the shopping options.

Disclaimer: As of right now, the extension is populated with static dummy data that simulates what would pop up on a listing of choice. The data does not accurately represent the active tab, but will by the end of week 9.

### Server
Make sure you can copy paste the connection URL from supabase. You can hit Connect at the top, copy the connection URL, replace `YOUR_PASSWORD` in the URL with the database password, and paste it into `/server/.env`. Your .env file should look something like this:
```
DATABASE_URL=[YOUR URL]
PORT=3001
```

To run the server, make sure all packages are installed with `npm i` and start the server with `npm run start`. 
```bash
npm i
npm run start
```

Going to http://localhost:3001/api/health in your browser should show something like this: 
```
{"status":"ok","time":"2025-11-25T02:50:35.288Z"}
```