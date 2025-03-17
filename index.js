const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');

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


let cartData =[];
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

const Food = mongoose.model('Fooditem',foodSchema);





app.get('/',(req,res)=>{
    res.render('home')
})

app.post('/cart',(req,res)=>{
    cartData=req.body.cart;
    // console.log(req.params);
    console.log('the data received is',cartData);
    console.log('u got to cart');
    res.redirect('cart');
})

app.get('/cart',(req,res)=>{
    res.render('cart',{cart:cartData});
})

app.get('/profile',(req,res)=>{
    res.render('profile');
})

app.get('/:eatery',async(req,res)=>{
    let eatery=req.params.eatery.toLowerCase();
    const items = await Food.find({outlet : eatery});
    res.render('eatery',{items});
})



app.listen(3000,()=>{
    console.log("Listening on port 3000!");
})
