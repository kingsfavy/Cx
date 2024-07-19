const express = require('express');
const products = require('./top.js');
const product = require('./product.js');
const details = require('./details.js');
const url = require('url');
//const db = require('./database');
const querystring = require('querystring');
//const userss = require('./users.js');
const session = require('express-session');
const ejs = require('ejs');
const QRCode = require('qrcode');
const http = require('http');
const Busboy = require('busboy');
const sha1 = require('sha1');
const path = require('path');
const paypal = require('@paypal/checkout-server-sdk');
const fs = require('fs');
const crypto = require('crypto');
const { Scene, PerspectiveCamera, WebGLRenderer, PlaneGeometry, MeshBasicMaterial, TextureLoader, Mesh } = require('three');
const bodyParser = require('body-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const app = express();
// Set EJS as view engine
app.set('view engine', 'ejs');


const PORT = process.env.PORT || 3000;

app.use(express.json());
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Middleware to parse incoming request bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(bodyParser.json());


// Middleware for session management
app.use(session({
  secret: 'aQjK!#n3rP5v&mB^9H@LwDyUz$EXe8Gs', // Change this to a secure random key
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());






 // Simulate a cart for demonstration
    const cart = [];

// PayPal client configuration
const clientId = 'AbX7BIpyZUUeELY_y0ldeq-cQYjTzItKcsb8PmRZzNwW4tkFbKhZ_kkeyINwDMND7vFpM9Wsfzufh2Va';

const clientSecret = 'EK8eYc4LLVWuEChMiniQh-Kqz1kDBQIHQOUbckWoN1-WDxHl7zAw9kS_oO6-cesqN0kCaYsj9FQL4xOT';

// Set up PayPal environment
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

// Middleware for creating an order
async function createOrderMiddleware(req, res, next) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: '100.00' // Adjust this value as needed
      }
    }]
  });

  try {
    const response = await client.execute(request);
    console.log('Order created:', response.result);
    req.orderId = response.result.id; // Store the order ID in the request object
    next();
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).send('Error creating order');
  }
}

// Middleware for capturing an order
async function captureOrderMiddleware(req, res, next) {
  const orderId = req.orderId; // Retrieve the order ID from the request object

  if (!orderId) {
    return res.status(400).send('Order ID not found');
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const response = await client.execute(request);
    console.log('Order captured:', response.result);
    req.paymentStatus = response.result.status === 'COMPLETED'; // Store the payment status in the request object
    next();
  } catch (error) {
    console.error('Error capturing order:', error);
    res.status(500).send('Error capturing order');
  }
}

// Example usage: Route handler
app.post('/checkout', createOrderMiddleware, captureOrderMiddleware, (req, res) => {
  const paymentStatus = req.paymentStatus; // Retrieve the payment status from the request object

  if (paymentStatus) {
    res.send('Payment successful');
  } else {
    res.send('Payment failed');
  }
}); 


const users = [
  {
    id: 1,
    username: '',
    password: '',
    profilePic: '',
    email: '',
      phone: '',
      gender: '',
      business: '',
      bio: '',
      profilePic: '',
      bname: '',
      blocation: '',
      btel: '',
      bemail: '',
      date: '',
      logo: '',
      bdes: '',
    
    wallet: {
      balance: 0,
      transactions: []
    },
    userId: '',
    resetToken: null,
    tokenExpiry: null
  },
  // Add more users as needed
];

 
      




// Configure Passport.js
passport.use(new LocalStrategy(
  (username, password, done) => {
    // Implement your authentication logic here
    // Example: Check if username and password are valid
    if (username === username && password === password) {
      return done(null, { id: 1, username: username });
    } else {
      return done(null, false, { message: 'Incorrect username or password' });
    }
  }
));  

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Fetch user from database based on id
  // Example: User.findById(id, (err, user) => done(err, user));
  done(null, { id: 1, username, phone, orderId, userId, country: 'admin' });
});



// Route to authenticate user
app.get('/payment', isAuthenticated, (req, res) => {
  res.send('Payment page');
});

app.post('/charge', isAuthenticated, async (req, res) => {
  // Handle payment processing with Stripe
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // Amount in cents
      currency: 'usd',
      description: 'Example charge',
      payment_method: req.body.payment_method_id,
      confirm: true
    });
    // Payment successful
    res.send('Payment successful');
  } catch (error) {
    // Handle payment failure
    res.status(500).send('Payment failed');
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/cart');
} 



// SIGN UP
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,  'index.html'));
});


app.post('/', (req, res) => {
  const { username, password } = req.body;

  const userExists = users.some(user => user.username === username);
  if (userExists) {
    res.status(400).send('<h2>Username already exists. Please choose another one.</h2>');
  } else {

    const newUser = { id: users.length + 1, username, password };
    users.push(newUser);
 
    req.session.isAuthenticated = true;
    req.session.user = newUser;
    res.redirect('/account');
  }
});

// New endpoint to fetch the username
app.get('/api/username', (req, res) => {
  if (req.session.isAuthenticated && req.session.user) {
    res.json({ username: req.session.user.username });
  } else {
    res.json({ username: null });
  }
});


//HOME
app.get('/home', (req, res) => {

  res.sendFile(path.join(__dirname,  'home.html'));
});




app.get('/account', (req, res) => {
  const isAuthenticated = req.session.isAuthenticated || false;
  const user = req.session.user || null;
  res.sendFile(path.join(__dirname,  'account.html'));
});


//FOR LOGIN

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname,  'login.html'));

});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Check if the provided username and password match any user
  const user = users.find(user => user.username === username && user.password === password);
  if (user) {
    // Set session variables to mark the user as authenticated and store user data
    req.session.isAuthenticated = true;
    req.session.user = user;
    res.redirect('/account');
  } else {
    res.redirect('/error');
  }
});

//FOR ERROR

app.get('/error', (req, res) => {
  res.sendFile(path.join(__dirname,  'error.html'));
});



//FOR PASSWORD RECOVER

app.get('/recover-password', (req, res) => {
  res.sendFile(path.join(__dirname,  'recover-password.html'));
});



// Route for password recovery
app.post('/recover-password', (req, res) => {
  const { username } = req.body;
  const user = users.find(user => user.username === username);

  if (user) {
    // Generate a unique token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token; // Store the token with the user for verification later
    user.tokenExpiry = Date.now() + 180000; // Token expiry set to 3 minutes (180,000 milliseconds)

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Recovery</title>
      <link rel="stylesheet" href="/styles.css">
      <script>
        function displayToken() {
          document.getElementById('token-popup').style.display = 'block';
          document.getElementById('generated-token').textContent = '${token}';
          
          // Set timeout to hide popup after 3 minutes (180,000 milliseconds)
          setTimeout(function() {
            document.getElementById('token-popup').style.display = 'none';
          }, 180000);
        }

function adjustColorsBasedOnTime() {
    const date = new Date();
    const hours = date.getHours();
    const body = document.body;

    if (hours >= 6 && hours < 18) { // Daytime (6am to 5:59pm)
        body.style.backgroundColor = "white";
        body.style.color = "black";
    } else { // Nighttime (6pm to 5:59am)
        body.style.backgroundColor = "black";
        body.style.color = "white";
    }
}

// Call the function when the page loads to adjust colors based on the time of day
adjustColorsBasedOnTime();
      </script>
    </head>
    <body>
      <button onclick="displayToken()" class="btn">Generate Token</button>
      <div id="token-popup" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #f0f0f0; padding: 20px; border: 1px solid #ccc;">
        <h2>Your password reset token is:</h2>
        <p id="generated-token"></p>
        <p>Please use this token to reset your password.</p>
        <form action="/verify-token" method="post">
          <input type="text" name="token" placeholder="Enter token" required>
          <input type="hidden" name="username" value="${username}">
<br>
          <button type="submit" class="btn">Verify Token</button>
        </form>
<br>
        <p>This popup will disappear in 3 minutes.</p>
      </div>
<script>
function adjustColorsBasedOnTime() {
    const date = new Date();
    const hours = date.getHours();
    const body = document.body;

    if (hours >= 6 && hours < 18) { // Daytime (6am to 5:59pm)
        body.style.backgroundColor = "white";
        body.style.color = "black";
    } else { // Nighttime (6pm to 5:59am)
        body.style.backgroundColor = "black";
        body.style.color = "white";
    }
}

// Call the function when the page loads to adjust colors based on the time of day
adjustColorsBasedOnTime();
</script>
    </body>
    </html>
    `);
  } else {
    res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>User Not Found</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <h2>User not found. Please check your username.</h2>
    </body>
<script>
function adjustColorsBasedOnTime() {
    const date = new Date();
    const hours = date.getHours();
    const body = document.body;

    if (hours >= 6 && hours < 18) { // Daytime (6am to 5:59pm)
        body.style.backgroundColor = "white";
        body.style.color = "black";
    } else { // Nighttime (6pm to 5:59am)
        body.style.backgroundColor = "black";
        body.style.color = "white";
    }
}

// Call the function when the page loads to adjust colors based on the time of day
adjustColorsBasedOnTime();
</script>
    </html>
    `);
  }
});




app.get('/verify-token', (req, res) => {
  res.sendFile(path.join(__dirname,  'verify-token.html'));
});


app.get('/invalid-token', (req, res) => {
  res.sendFile(path.join(__dirname,  'invalid-token.html'));
});

// Route to verify token and handle password reset
app.post('/verify-token', (req, res) => {
  const { username, token, newPassword } = req.body;
  const user = users.find(user => user.username === username);

  if (user && user.resetToken === token && Date.now() < user.tokenExpiry) {
    // Token is valid, proceed with password reset
    user.password = newPassword;

    // Clear/reset token and expiry after successful reset
    user.resetToken = null;
    user.tokenExpiry = null;

   res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
     <h2>Reset Your Password</h2>

      <form action="/set-password" method="post">
        <input type="hidden" name="username" value="${username}">
<br>
        <input type="password" name="newPassword" placeholder="Enter new password" required>
<br><br>
        <button type="submit" class="btn">Reset Password</button>
      </form>
<script>
function adjustColorsBasedOnTime() {
    const date = new Date();
    const hours = date.getHours();
    const body = document.body;

    if (hours >= 6 && hours < 18) { // Daytime (6am to 5:59pm)
        body.style.backgroundColor = "white";
        body.style.color = "black";
    } else { // Nighttime (6pm to 5:59am)
        body.style.backgroundColor = "black";
        body.style.color = "white";
    }
}

// Call the function when the page loads to adjust colors based on the time of day
adjustColorsBasedOnTime();
</script>
    </body>
    </html>
    `);} else {
    // Token is invalid or expired
    res.redirect('/invalid-token');
  }
});


//FOR SET PASSEORD

app.get('/set-password', (req, res) => {
  res.sendFile(path.join(__dirname,  'set-password.html'));
});


app.post('/set-password', (req, res) => {
  const { username, newPassword } = req.body;
  const user = users.find(user => user.username === username);

  if (user) {

       user.resetToken = null;
    user.tokenExpiry = null;

    user.password = newPassword;
    // Clear/reset token and expiry after successful reset

    // Clear/reset token and expiry after successful reset
    user.resetToken = null;
    user.tokenExpiry = null;

   res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Successful</title>
      <link rel="stylesheet" href="styles.css">
    </head>
    <body>
      <h2>Password reset successful.</h2>
      <p>Your password has been updated.</p>
      <a href="/login">Go to Login Page</a>
    </body>
    </html>
    `);
  } else {
    res.status(400).send('error');
  }
});




// Route for user logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/login');
    }
  });
});




//FOR POST

app.get('/posts/:id', (req, res) => {
  res.sendFile(path.join(__dirname,  'posts.html'));
});


app.post('/posts', (req, res) => {
    const post = req.body;
    post.likes = 0; // Initialize likes count
    post.dislikes = 0; // Initialize dislikes count
    post.comments = []; // Initialize comments array
    posts.push(post);
    res.status(201).send(post);
    clients.forEach(client => client.res.write(`data: ${JSON.stringify(post)}\n\n`));
});

app.post('/posts/:id/like', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        res.status(200).send(post);
        clients.forEach(client => client.res.write(`data: ${JSON.stringify(post)}\n\n`));
    } else {
        res.status(404).send({ error: 'Post not found' });
    }
});

app.post('/posts/:id/dislike', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.dislikes++;
        res.status(200).send(post);
        clients.forEach(client => client.res.write(`data: ${JSON.stringify(post)}\n\n`));
    } else {
        res.status(404).send({ error: 'Post not found' });
    }
});

app.post('/posts/:id/comment', (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments.push(req.body.comment);
        res.status(200).send(post);
        clients.forEach(client => client.res.write(`data: ${JSON.stringify(post)}\n\n`));
    } else {
        res.status(404).send({ error: 'Post not found' });
    }
});

app.get('/posts', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.flushHeaders();

    clients.push({ id: Date.now(), res });

    req.on('close', () => {
        clients = clients.filter(client => client.res !== res);
    });
});


//FOR CHATS

app.get('/chat/:id', isAuthenticated, (req, res) => {
    const userId = req.params.id;
    const user = users.find(u => u.id == userId);

    if (user) {
          res.sendFile(path.join(__dirname,  'chat.html'));
    } else {
        res.status(404).send('User not found');
    }
});


// Endpoint to handle fetching messages for a specific user
app.get('/messages/:userId', isAuthenticated,  (req, res) => {
    const userId = parseInt(req.params.userId);
    const userMessages = messages.filter(message => message.userId === userId || message.senderId === userId);
    res.json(userMessages);
});

app.post('/messages/:userId', isAuthenticated, (req, res) => {
    const userId = parseInt(req.params.userId);
    const message = { ...req.body, userId };
    messages.push(message);

    // Notify the specific client about the new message
    const client = clients.find(c => c.userId === userId);
    if (client) {
        client.res.write(`data: ${JSON.stringify(message)}\n\n`);
    }

    // Notify the sender's clients
    clients
        .filter(c => c.userId === message.senderId)
        .forEach(c => c.res.write(`data: ${JSON.stringify({ type: 'sent', message })}\n\n`));

    res.status(201).send();
});

// Endpoint for SSE clients for a specific user
app.get('/events/:userId', isAuthenticated, (req, res) => {
    const userId = parseInt(req.params.userId);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE connection

    const clientId = Date.now();
    clients.push({
        id: clientId,
        userId,
        res
    });

    req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
    });
});

const connected = [];

const clients = [];



app.get('/connected', (req, res) => {
     res.json({ connected  });
});


app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'users.html'));
});



app.get('/api/users', (req, res) => {
const currentUser = req.session.user;
   const userHtml = users
        .filter(user => 
            user.id !== currentUser.id &&
            user.username && 
            user.username.trim() !== 'undefined'  &&
            user.username.trim() !== ''
        ).map(user => `
    <div style=" display: flex;width: 100%;gap: 0.2rem;align-items: center;"><div class="user" data-user-id="${user.id}" style="height:35px; background-color:lightgrey; width:90%; padding:15px; display:flex;align-items:center;border-radius:15px 0 0 15px;">
      <div class="user-status">
        <div class="status-indicator ${user.online ? 'online' : 'offline'}"></div>
        <img src="${user.profilePic}" alt="Profile Picture" width="30" height="30">
        <h3><a href="/chat/${user.id}" style="text-decoration:none;color:inherit;">${user.username}</a></h3>
      </div>
      <button class="request" style=" float:right;" onclick="sendFriendRequest(${user.id})">👤</button>
      <div class="notification" style="display: none; float: right;">🔔</div>
    </div><div class="dropdown" style="flex: 1; display: flex; justify-content: flex-end;">

                <button type="button" onclick="ddbtn()" class="dropbtn" id="dd">☰</button>
               
 <div class="dropdown-content">
 <a href="/chat/${user.id}">Message</a>

 <a href="/client/${client.id}">About ${user.username}</a>
                    <a href="#" onclick="sendFriendRequest(${user.id})">Connect to ${user.username}</a>
                </div>
            </div>

<a href="/connect/${user.id}">
<div class="request" >
👤
</div></a>
</div>
</div>
        <br>
  `).join('');
  res.send(userHtml);
});


// Add a new user
app.post('/users', (req, res) => {
  const { id, username, profilePic, online } = req.body;
  const newUser = {
    id,
    username,
    profilePic,
    online
  };
  users.push(newUser);
  res.status(201).send('User added successfully');
});

const connectionRequests = [];



// Handle sending a friend request
app.post('/friend-request', isAuthenticated, (req, res) => {
    const fromUserId = req.session.user.id;
    const toUserId = req.body.toUserId;

    clients.forEach(client => {
        if (client.userId === toUserId) {
            client.res.write(`data: ${JSON.stringify({ senderId: fromUserId, senderName: req.session.user.username, type: 'friend-request' })}\n\n`);
        }
    });

    res.json({ message: 'Friend request sent successfully!' });
});


//FOR SIG UP

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname,  'signup.html'));
});


app.post('/signup', (req, res) => {
  const { username, password, email, phone, gender, business, bio, bname, logo, blocation, bdes, btel, bemail, date, profilePic } = req.body;

  const userExists = users.some(user => user.username === username);
  if (userExists) {
    res.status(400).send('<h2>Email already exists. Please use another email.</h2>');
  } else {
    const newUser = {
      id: users.length + 1,
      username,
      password,
      email,
      phone,
      gender,
      business,
      bio,
      profilePic,
      bname,
      blocation,
      btel,
      bemail,
      date,
      logo,
      bdes
    };

    users.push(newUser);

    req.session.isAuthenticated = true;
    req.session.user = newUser;
    res.redirect('/login');
  }
});


// Endpoint to fetch user details
app.get('/api/user-details', (req, res) => {
  if (req.session.isAuthenticated && req.session.user) {
    const { username, email, phone, bio, profilePic, bname, date, bdes, btel, logo, bemail, blocation} = req.session.user;

    res.json({ username, email, phone, bio, profilePic, date, bname, bdes, logo, btel, bemail, blocation });
  } else {
    res.status(401).json({ error: 'User not authenticated' });
  }
});


//FOR ABOUT PAGE

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});




// Route to serve clients.html
// isAuthenticated middleware example
function isAuthenticated(req, res, next) {
  // Your authentication logic here
  if (true) { // Replace with your actual authentication check
    return next();
  } else {
    res.redirect('/login');
  }
}

// isAuthenticated middleware example
function isAuthenticated(req, res, next) {
  // Your authentication logic here
  if (true) { // Replace with your actual authentication check
    return next();
  } else {
    res.redirect('/login');
  }
}

// Route to serve clients.html
app.get('/client/:id', isAuthenticated, (req, res) => {
 res.sendFile(path.join(__dirname, 'client.html'));
});





//FOR OWNER OF ACCOUNT

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'user.html'));
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});  	  