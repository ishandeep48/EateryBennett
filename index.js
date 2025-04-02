const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');
const qrcode=require('qrcode');
const methodOverride = require('method-override');
const { customAlphabet } = require('nanoid');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './keys.env' });

const port = process.env.PORT || 3000;
const mongoURI = process.env.MONGO_URI;
const secretKey = process.env.SECRET_KEY;
const upiID = process.env.UPI_ID;
const OEmail=process.env.EMAIL;
const AppPass=process.env.APP_PASS;
const upiName=process.env.UPI_Name;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: OEmail, // the email of the eatery
        pass: AppPass // the app-password of the eatery
    }
});
async function sendOTP(email,otp){
    const mailOptions={
        from:OEmail,
        to:email,
        subject:'One Time Password for Registration on Bennett Eatery',
        text:`Your One Time Password for registration on Bennett Eatery is ${otp} . Please do not share this with anyone. `
    }   
    try{
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent successfully to ${email}`);
    }catch(error){
        console.error('Error sending OTP:',error);
    }
}
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

app.use(methodOverride('_method'));
app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname, 'Resources')));
app.set('view engine','ejs');


// mongoose.connect('mongodb://127.0.0.1:27017/Eatery')
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async()=>{
    console.log("Connected to MongoDB - eatery");
})
.catch(()=>{
    console.log("Error connecting to MongoDB - eatery")
});

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    cart: { 
        eatery:String,
        items:{
            type:Array,
            default:[]
        } 
    },
    usertype:{
        type: String,
        enum:['user','employee','admin'],
        default:'user'
    },
    EmpOf:{
        type: String,
        default:'none'
    }
});
const eaterySchema = new mongoose.Schema({
    Name:{
        type: String,
        required: true
    },
    isOpen:{
        type: Boolean,
        required: true
    }

});
const orderSchema=new mongoose.Schema({
    orderId:{
        type: String,
        required: true
    },
    items:{
        type: Array,
        required: true,
        default:[]
    },
    eatery:{
        type: String,
        required: true
    },
    isReady:{
        type: Boolean,
        required: true,
        default:false
    },
    date:{
        type: Date,
        required: true,
        default:Date.now
    },
    user:{
        type: String,
        required: true
    }
})
const Eatery = mongoose.model('Eatery',eaterySchema);
const Order = mongoose.model('Order',orderSchema);
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User',userSchema);
passport.use(new passportLocal(User.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//middleware to check if user is logged in
const isLoggedIn =(req,res,next) =>{
    if(!req.isAuthenticated()){
        return res.redirect('/login');
    }
    next();
}

//middleware to check that the person that is accessing the site is employee
const isEmployee =async(req,res,next)=>{
    if(!req.user){
        return res.redirect('/login');
    }

    const {username}=req.user;
    const userdata= await User.findOne({username});
    const utype=userdata.usertype;
    if(utype=='employee'){
        return next();
    }else{
        return res.redirect('/admin');
    }
}
//middleware to check that the person that is accessing the site is user
const isUser =async(req,res,next)=>{
    if(!req.user){
        return res.redirect('/login');
    }

    const {username}=req.user;
    const userdata= await User.findOne({username});
    const utype=userdata.usertype;

    if(utype=='user'){
        return next();
    }else{
        const temp=userdata.EmpOf;
        return res.redirect(`/eatery/${temp}`);
    }
}
//middleware to check that the person that is accessing the site is admin 
const isAdmin =async(req,res,next)=>{
    if(!req.user){
        return res.redirect('/login');
    }
    const {username}=req.user;
    const userdata=await User.findOne({username});
    const utype=userdata.usertype;
    if(utype=='admin'){
        return next();
    }else{
        return res.redirect('/');
    }
}
// function to show the page when register is opened
app.get('/register',(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    
    res.render('register');
})
// the function that will crate user and redirect to main page
app.post('/register', async (req,res) =>{
    let {username , password , email }= req.body;
    
    // Check password length
    if (password.length < 8) {
        return res.render('register', { error: 'Password must be at least 8 characters long' });
    }
    
    // Check if email ends with @bennett.edu.in
    if (!email.endsWith('@bennett.edu.in')) {
        return res.render('register', { error: 'Enter Your Bennett University Email' });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
        return res.render('register', { error: 'Email already exists. Please use a different email or login.' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username });
    if (existingUsername) {
        return res.render('register', { error: 'Username already exists. Please choose a different username.' });
    }
    //generate a random OTP
    const OTP=Math.floor(100000 + Math.random() * 900000).toString();
    //send OTP
    sendOTP(email, OTP);
    res.render('verify-otp', { email, OTP, username, password });
})
//POST request to verify the OTP that the user enters
app.post('/verify-otp', async (req, res) => {
    const { userOTP, correctOTP, email, username, password } = req.body;
    
    if (userOTP === correctOTP) {
        try {
            const usr = new User({
                username,
                email
            });
            
            const newUser = await User.register(usr, password);
            await req.login(newUser, (err) => {
                if (err) return next(err);
                res.redirect('/');
            });
        } catch (e) {
            console.error('Registration error:', e);
            res.redirect('/register');
        }
    } else {
        res.render('verify-otp', { 
            email, 
            OTP: correctOTP,
            username,
            password,
            error: 'OTP is incorrect. Please try again.' 
        });
    }
});

// functionm to open the patge when login is requested
app.get('/login',(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    res.render('login');
})
//function to update the eatery status
app.post('/eatery-status',isLoggedIn,isEmployee,async(req,res)=>{
    const {eatery,isOpen}=req.body;
    const eateryName=eatery.toLowerCase();
    const eateryData=await Eatery.findOne({Name:eateryName});
    eateryData.isOpen=isOpen;
    await eateryData.save();
})
//function to login a user when they type the username and password
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('login', { error: 'Username or password is incorrect' });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
})
//GET request for home page of admin
app.get('/admin',isLoggedIn,isAdmin,async(req,res)=>{
    const users = await User.find({}, 'username email usertype');
    res.render('admin',{users});
})
// GET for Home Page of eatery
app.get('/eatery/:outlet',isLoggedIn,isEmployee,async(req,res)=>{
    const user=req.user;
    const eatery=user.EmpOf.charAt(0).toUpperCase() + user.EmpOf.slice(1).toLowerCase();
    const eateryName=user.EmpOf;
    const eateryData=await Eatery.findOne({Name:eateryName});
    const isOpen=eateryData.isOpen;
    res.render('emphome',{eatery,isOpen});
})
// schema for food items
const foodSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true
    },
    outlet:{
        type: String,
        required: true
    },
    isAvailable:{
        type: Boolean,
        required: true
    },
    veg:{
        type: Boolean,
        required: true
    }
});
//GET route to add a new item to the menu
app.get('/add-item',isLoggedIn,isEmployee,async(req,res)=>{
    res.render('add-item',{eatery:req.user.EmpOf});
})
//POST route to add a new item to the menu
app.post('/add-item',isLoggedIn,isEmployee,async(req,res)=>{
    const {eatery, name, price, veg} = req.body;
    const newItem = new Food({
        name,
        price,
        outlet: eatery,
        isAvailable: true,
        veg: Boolean(veg) // Ensure boolean conversion
    });
    await newItem.save();
    res.status(200).send({ message: 'Item added successfully' });
})
//DELETE route to delete an item from the menu
app.delete('/delete-item',isLoggedIn,isEmployee,async(req,res)=>{
    const {eatery,itemName}=req.body;
    try{
        await Food.deleteOne({name:itemName,outlet:eatery});
        res.status(200).send({ message: 'Item deleted successfully' });
    }catch(e){
        console.log(e);
        res.status(500).send({ message: 'Error deleting item' });}
})
// model fopr the above schema
const Food = mongoose.model('Fooditem',foodSchema);
//function to logout
app.get('/logout',isLoggedIn,(req,res,next)=>{
    req.logout(function(err){
        if(err){
            return next(err);
        }
        res.redirect('/');
    });
})
//the homepage for users
app.get('/',isLoggedIn,isUser,(req,res)=>{
    res.render('home')
})
//PATCH route to update the menu
app.patch('/update-menu',isLoggedIn,isEmployee,async(req,res)=>{
    const {eatery,items}=req.body;
    try{
        for (let item of items) {
            await Food.updateOne(
                { name: item.name ,outlet:eatery },
                { $set: { isAvailable: item.isAvailable, price: item.price } }
            );
        }
        res.send('menu updated');
    }catch(e){
        console.log(e);
        res.status(500).send('Error updating menu');
    }
})
//GET for menu which employee can edit
app.get('/menu',isLoggedIn,isEmployee,async(req,res)=>{
    const items=await Food.find({outlet:req.user.EmpOf});
    const eatery=req.user.EmpOf;
    res.render('menu',{items,eatery});
})
//GET for orders where employee can see the current pending orders
app.get('/orders',isLoggedIn,isEmployee,async(req,res)=>{
    const orders=await Order.find({eatery:req.user.EmpOf,isReady:false});
    res.render('orders',{orders});
})
//GET for order info of each order for employee to see
app.get('/orderinfo/:oid',isLoggedIn,isEmployee,async(req,res)=>{
    const oid=req.params.oid;
    const orderDetails=await Order.findOne({orderId:oid});
    res.render('orderinfo',{orderDetails});
})
// POST route to update user's cart in database
app.post('/cart', isLoggedIn,isUser, async (req, res) => {
    try {
        const user = req.user; 
        const currEatery = user.cart.eatery;
        const newEatery = req.body.eatery;
        const newItems = req.body.cart;
        if(currEatery!=newEatery){
            user.cart.items=newItems;
            user.cart.eatery=newEatery;
            
        }else{
        const existingItems=user.cart.items;
        newItems.forEach(newItem => {
        
            const existingItem = existingItems.find(exiItem => exiItem.name == newItem.name);
        
            if (existingItem) {
                existingItem.quantity += newItem.quantity;
            } else {
                existingItems.push(newItem);
            }
        });
        
        user.cart.items=existingItems;
        user.markModified('cart.items');

    }
        await user.save();
        res.status(200).send('Updated the values of the cart');
    } catch (err) {

        console.error(err);
        res.status(500).send('Error saving cart');
    }
});
//POST to handle updation of cart
app.post('/update-cart', isLoggedIn, isUser, async (req, res) => {
    try {
        const user = req.user;
        const newItems = req.body.cart;



        if (!newItems) {
            return res.status(400).send('No cart data provided');
        }

        // Convert incoming items to a Map for quick lookup
        const newItemsMap = new Map(newItems.map(item => [item.name, item]));

        // Filter out items from current cart that are not present in the newItemsMap
        user.cart.items = user.cart.items.filter(existingItem => newItemsMap.has(existingItem.name));

        // Update existing items' quantities or add new ones
        user.cart.items.forEach(existingItem => {
            if (newItemsMap.has(existingItem.name)) {
                existingItem.quantity = newItemsMap.get(existingItem.name).quantity;
                newItemsMap.delete(existingItem.name);
            }
        });

        // Add any new items that were not already in the cart
        newItemsMap.forEach((newItem) => {
            user.cart.items.push(newItem);
        });

        user.markModified('cart.items'); 

        await user.save();

        // Redirect to /cart
        res.redirect('/cart'); 
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving cart');
    }
});
//If this is called the redirect ot cart
app.get('/update-cart',isLoggedIn,isUser,(req,res)=>{
    res.redirect('/cart');
})

// GET route to retrieve user's cart
app.get('/cart', isLoggedIn,isUser, async (req, res) => {
    res.render('cart', { cart: req.user.cart.items,eatery:req.user.cart.eatery || [] }); 
});
//profile page ( right now i am thinking to keep this for both employee and students)
app.get('/profile',isLoggedIn,async(req,res)=>{
    const data=req.user;
    const type=data.usertype;
    if(type==='user'){
    const orders=await Order.find({user:data.username});
    res.render('profile',{data,orders});
    }else{
        res.render('eaprofile',{data});
    }
})

// page for food items of each eatery
app.get('/:eatery',isLoggedIn,isUser,async(req,res)=>{
    let eatery=req.params.eatery.toLowerCase();
    const filter = req.query.filter;
    
    // Build the query based on filter
    let query = { outlet: eatery };
    if (filter === 'veg') {
        query.veg = true;
    } else if (filter === 'nonveg') {
        query.veg = false;
    }
    
    const items = await Food.find(query);
    
    if(items.length==0 && !filter){
        return res.render('e404');
    }else{
        const eateryData=await Eatery.findOne({Name:eatery});
        const open =eateryData.isOpen;
        if(open){
            res.render('eatery',{items,eatery,open,query:filter});
        }else{
            res.render('closed');
        }
    }
})
//POST method for checkout (This is temporary)
app.post('/checkout',isLoggedIn,isUser,async(req,res)=>{
    const {totalAmount} = req.body;
    const upiId=upiID;// the UPI id of eatery
    const userName = upiName; // the UserName of eatery
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(userName)}&am=${totalAmount}&cu=INR`;
    try {
        const qrCodeDataUrl = await qrcode.toDataURL(upiUrl);
        res.render('checkout', { totalAmount, qrCodeDataUrl }); // Render a new EJS file
    } catch (err) {
        console.error('Failed to generate QR Code', err);
        res.send('Error generating QR Code');
    }
})
//POST request to verify payment and confirm the order ( for now it is manual cause cannot use razorpay api)
app.post('/verify-payment',isLoggedIn,isUser,async(req,res)=>{
    const userr=req.user;
    const username=userr.username;
    const cart=userr.cart.items;
    const eatery=userr.cart.eatery;
    const updatedCart = {
        orderId: nanoid(), 
        isReady: false,                 
        date: new Date().toISOString(), 
        items: cart.map(item => ({
            ...item
        })) ,
        eatery:eatery ,     
        user: username
    };
    
    try{
        const cartLength=cart.length;
        if(cartLength>0){
        await Order.create(updatedCart);
        const tempcart={
            items:[],
            eatery:''
        }
        await User.findByIdAndUpdate(userr._id, { $set: { cart:tempcart } });
        res.redirect(`/order/${updatedCart.orderId}`);
    }
    
    }catch(e){
        console.log(`error occured ${e}`);
        res.status(500).send('Error occured while updpatiing our database please contact admin');
    }

})

//GET for order info of each order on user's end
app.get('/order/:oid',isLoggedIn,isUser,async(req,res)=>{
    const oid=req.params.oid;
    const user=req.user;
    const orderDetails=await Order.findOne({orderId:oid});
    res.render('orderpage',orderDetails);
})

// Add this new route for marking order as completed
app.patch('/order/:oid/complete', isLoggedIn, isEmployee, async(req,res)=>{
    try {
        const orderId = req.params.oid;
        await Order.findOneAndUpdate(
            { orderId: orderId },
            { $set: { isReady: true } }
        );
        res.status(200).send({ message: 'Order marked as completed' });
    } catch (error) {
        console.error('Error marking order as completed:', error);
        res.status(500).send({ message: 'Error marking order as completed' });
    }
});

// Route to update user type
app.patch('/admin/update-user-type',isLoggedIn,isAdmin,async(req,res)=>{
    try {
        const {username, newType, eatery} = req.body;
        
        // Validate new type
        if (!['user', 'employee', 'admin'].includes(newType)) {
            return res.status(400).send({ message: 'Invalid user type' });
        }

        // Validate eatery if user type is employee
        if (newType === 'employee') {
            const validEateries = ['kathi', 'chaiok', 'hotspot', 'quench', 'snapeats', 'southern'];
            if (!validEateries.includes(eatery)) {
                return res.status(400).send({ message: 'Invalid eatery' });
            }
        }

        await User.findOneAndUpdate(
            { username: username },
            { 
                $set: { 
                    usertype: newType,
                    EmpOf: newType === 'employee' ? eatery : 'none'
                } 
            }
        );

        res.status(200).send({ message: 'User type updated successfully' });
    } catch (error) {
        console.error('Error updating user type:', error);
        res.status(500).send({ message: 'Error updating user type' });
    }
});

// Route to delete user
app.delete('/admin/delete-user', isLoggedIn, isAdmin, async(req, res) => {
    try {
        const { username } = req.body;
        
        // Prevent deleting the last admin
        const adminCount = await User.countDocuments({ usertype: 'admin' });
        const userToDelete = await User.findOne({ username });
        
        if (userToDelete.usertype === 'admin' && adminCount <= 1) {
            return res.status(400).send({ message: 'Cannot delete the last admin user' });
        }

        // Delete the user
        await User.findOneAndDelete({ username });
        
        res.status(200).send({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send({ message: 'Error deleting user' });
    }
});

// e404 ofcourse 
app.get('*',(req,res)=>{
    res.render('e404');
})
// let the server start my lord
app.listen(port, '0.0.0.0',()=>{
    console.log(`Listening on port ${port}!`);
})
