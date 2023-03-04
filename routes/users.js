var express = require('express');
const { default: mongoose } = require('mongoose');
const userHelpers = require('../helpers/userHelpers');
var router = express.Router();
const user = require('../model/userSchema');
var nocache = require('nocache');

/* GET home page. */
  let verifyLogin=(req,res,next)=>{
    if(req.session.user){
      next()
    }else{
      res.redirect('/user-login')
    }
  }

router.get('/',nocache(), async function(req, res, next) {
  let user=req.session.user;
  let cartCount = null;
  if(user){
     cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  
  console.log(user);
  userHelpers.showProducts().then((products)=>{
    res.render('user/home',{products,user,cartCount});
  }) 
  
});

router.get('/user-signup',nocache(),function(req,res,next){
  errMsg = req.session.msg;
  res.render('user/user-signup',{errMsg});
  req.session.msg = null;
});

router.post('/user-signup',(req,res)=>{
  // const MyModel = mongoose.model('user', userData);
 
  userHelpers.insertUser(req.body).then((msg)=>{
    
      if(msg){
        req.session.msg = msg;
        res.redirect('/user-signup');
      }
      else{
        console.log("hello"); 
        req.session.user = req.body;
        res.redirect('/');
      }
  })
})

router.get('/user-login',nocache(),(req,res)=>{
  var user = req.session.user;
  if(user){
    res.redirect('/');
  }
  else{
    err = req.session.err;
    // userName = req.session.name;
    res.render('user/user-login',{err});
    req.session.err = null;
  }
})

router.post('/user-login',(req,res)=>{
  const userInfo = {
    email : req.body.email,
    password : req.body.password,
  }
  userHelpers.userCheck(userInfo).then((response)=>{
    if(response.status){
      console.log("Login Successfull");
      req.session.user = response.user;
      res.redirect('/');
    }
    else{
      console.log(response.msg);
      req.session.err = response.msg;
      res.redirect('/user-login');
    }
  })
})

router.get('/otp-login',nocache(),(req,res)=>{
  var user=req.session.user
  if(user){
    res.redirect('/')
  }else{
  otp=req.session.otp
  data=req.session.otpData
  err=req.session.otpErr
  invalid=req.session.InvalidOtp
  res.render('user/otp-login',{otp,data,err,invalid})
  req.session.otpErr=null
  req.session.otpData = null;
  }
  
})


router.post('/sent-otp',(req,res)=>{
  userHelpers.otpVerification(req.body).then((response)=>{
    if(response.status){
      req.session.otp=response.otp;
      req.session.otpData=req.body;
      req.session.otpUser=response.user;
      res.redirect('/otp-login')
    }else{
      req.session.otpErr=response.err
      res.redirect('/otp-login')
    }
  })
})

router.post('/otp-login',(req,res)=>{
  otp=req.session.otp
  userOtp=req.body.otp
  var user=req.session.otpUser
  if(otp==userOtp){
    req.session.user=user
    req.session.otp=null
    res.redirect('/')   
  }else{
    req.session.InvalidOtp="Invalid Otp"
    res.redirect('/otp-login')
  }
})

router.get('/shop',(req,res)=>{
let user=req.session.user;
  userHelpers.showProducts().then((products)=>{
    res.render('user/shop',{products,user});
    console.log(products);
  })
})

router.get('/single-product/:id',(req,res)=>{
  productId = req.params.id;
  userHelpers.showSingleProduct(productId).then((productData)=>{
    res.render('user/single-product',{productData});
  })
 
})  

router.get('/cart',verifyLogin,async (req,res)=>{
  let user=req.session.user;
 let products = await userHelpers.getCartProducts(req.session.user._id)
 let total = await userHelpers.getTotalAmount(req.session.user._id);
 console.log(products);
 console.log("*** "+req.session.user._id);
  res.render('user/cart',{products,'user':req.session.user._id,total,user});
})

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log(req.session.user);
  console.log("api call");
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/shop');
     
    res.redirect('/cart')
  })
}) 

router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelpers.getTotalAmount(req.session.user._id);
    console.log(response);
     res.json(response);
  })
})  

router.get('/remove-product/:id',verifyLogin,(req,res)=>{
  // console.log("Hiii "+req.body);
  let userId=req.session.user._id
  userHelpers.removeProduct(req.params.id,userId);
  res.redirect('/cart')

})

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  res.render('user/checkout',{total,user:req.session.user})
})

router.post('/place-order',async(req,res)=>{
  console.log(req.body);
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  console.log("totalprice "+totalPrice[0].total);
  userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
         res.json({status : true});
  })
})

router.get('/order-placed',(req,res)=>{
  res.render('user/order-placed');
})
module.exports = router;  
 