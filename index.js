const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const passport = require('passport');
const passportLocal = require('passport-local');
const session = require('express-session');

app.use(express.urlencoded({extended:true}));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.set('views',path.join(__dirname,'views'));
app.use(express.static(path.join(__dirname, 'Resources')));
app.set('view engine','ejs');


mongoose.connect('mongodb://127.0.0.1:27017/Eatery')
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
        type: Array,
         default: [] 
    },
    usertype:{
        type: String,
        enum:['user','employee','admin'],
        default:'user'
    },
    EmpOf:{
        type: String,
        default:'none'
    },
    PrevOrder:{
        type: Array,
        default:[]
    }
});

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
        return res.redirect('/');
    }
}
//middleware to check that the person that is accessing the site is user
const isUser =async(req,res,next)=>{
    if(!req.user){
        return res.redirect('/login');
    }

    const {username}=req.user;
    // console.log(`The username is ${username}`);//debugging
    const userdata= await User.findOne({username});
    const utype=userdata.usertype;

    if(utype=='user'){
        return next();
    }else{
        const temp=userdata.EmpOf;
        return res.redirect(`/eatery/${temp}`);
    }
}
// function to shopw the page when register is opened
app.get('/register',(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    res.render('register');
})
// the function that will crate user and redirect to main page
app.post('/register', async (req,res) =>{
    let {username , password , email }= req.body;
    console.log(username, email,password);
    const usr= new User({
        username,
        email
    })
    try{
    const newUser = await User.register(usr,password);
    console.log(newUser);
    req.login(newUser,err =>{
        if(err) return next(err);
        res.redirect('/');
    })
    
    }catch(e){
        res.send(`some error . check this out ${e.message}`)
    }
})
// functionm to open the patge when login is requested
app.get('/login',(req,res)=>{
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    res.render('login');
})
//function to login a user when they type the username and password
app.post('/login',passport.authenticate('local',{failureRedirect: '/login'}) , async(req,res)=>{
    res.redirect('/');
})

app.get('/eatery/:outlet',isLoggedIn,isEmployee,async(req,res)=>{
    res.send(`This eatery is, ${req.params.outlet} hehe`);
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
});
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


// POST route to update user's cart in database
app.post('/cart', isLoggedIn,isUser, async (req, res) => {
    try {
        const user = req.user; 
        user.cart = req.body.cart; 
        await user.save(); 
        console.log('Cart saved:', user.cart);
        res.status(200).send('Cart saved to database');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error saving cart');
    }
});

// GET route to retrieve user's cart
app.get('/cart', isLoggedIn,isUser, async (req, res) => {
    res.render('cart', { cart: req.user.cart || [] }); 
    console.log(req.user);
});
//profile page ( right now i am thinking to keep this for both employee and students)
app.get('/profile',isLoggedIn,(req,res)=>{
    const data={
        username : req.user.username
    };
    console.log(data);
    res.render('profile',data);
})
// page for food items of each eatery
app.get('/:eatery',isLoggedIn,isUser,async(req,res)=>{
    let eatery=req.params.eatery.toLowerCase();
    const items = await Food.find({outlet : eatery});
    if(items.length==0){
        return res.render('e404');
    }else{
        
        res.render('eatery',{items});
    }
})
// e404 ofcourse 
app.get('*',(req,res)=>{
    res.render('e404');
})
// let the server start my lord
app.listen(3000, '0.0.0.0',()=>{
    console.log("Listening on port 3000!");
})
