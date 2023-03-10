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
     cartCount = await userHelpers.getCartCount(req.session.user._id);
     req.session.cartCount = cartCount;
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
let cartCount = req.session.cartCount;
console.log("count === ",cartCount);
  userHelpers.showProducts().then((products)=>{
    res.render('user/shop',{products,user,cartCount});
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
  // total.username=req.session.user.name
  selectedAddress = req.session.selectedAddress ;
  console.log("hiiiiii",selectedAddress);
  res.render('user/checkout',{total,selectedAddress})
})

router.post('/place-order',async(req,res)=>{
  console.log(req.body);
  let products = await userHelpers.getCartProducts(req.session.user._id)
  
  // let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);
  userHelpers.placeOrder(req.body,products,totalPrice,req.session.user._id).then((response)=>{
  
  res.json({status : true});
  })
})

router.get('/order-placed',nocache(),verifyLogin,(req,res)=>{
  res.render('user/order-placed');
})

router.get('/user-profile',verifyLogin,(req,res)=>{
  let user = req.session.user;
  console.log("user = ",user);
  userHelpers.getUserInfo(req.session.user._id).then((userInfo)=>{
    console.log("userInfo",userInfo);
    res.render('user/user-profile',{user,userInfo,userId:req.session.user._id});
  })
  
})

router.post('/update-user-profile/:id',verifyLogin,(req,res)=>{
  let userId = req.params.id;
  console.log("uid ",userId);
  console.log("rebody = ",req.body);
  userHelpers.userInfoUpdate(userId,req.body);
  res.redirect('/user-profile');
})

router.get('/my-orders',verifyLogin,(req,res)=>{
  let user = req.session.user;
  // console.log("kooi",req.session.user._id);
  userHelpers.getMyOrders(req.session.user._id).then((orders)=>{
    console.log("orders = ",orders);
    // console.log("total = ",orders.);
    res.render('user/my-orders',{orders,user});
})
  })

  router.get('/view-ordered-products/:id([0-9a-fA-F]{24})',verifyLogin,async(req,res)=>{
    let user = req.session.user;
    let orderItems =await userHelpers.getOrderedProducts(req.params.id);
    console.log("items",orderItems);
    res.render('user/view-ordered-products',{orderItems,user});
 
  })

  router.get('/remove-order/:id',(req,res)=>{
    userHelpers.removeOrder(req.params.id);
    res.render('user/my-orders');
  })
   
router.get('/change-password/:id',verifyLogin,(req,res)=>{
  let userId = req.params.id;
   errMsg = req.session.erMsg;
   res.render('user/change-password',{userId,errMsg});
   req.session.erMsg=null
})

router.post('/change-password/:id',verifyLogin,(req,res)=>{
  console.log(req.params.id);
  userHelpers.changePassword(req.params.id,req.body).then((response)=>{
    console.log(response.message);
    if(response.message=="Invalid Password!"){
      req.session.erMsg = response.message;
      res.redirect('/change-password/'+req.params.id)
    }else{
      res.redirect('/user-login');
    }
      
  })
 
})

router.get('/address-book',verifyLogin,(req,res)=>{
  let user = req.session.user;
  userHelpers.getAddress(req.session.user._id).then((data)=>{
    res.render('user/address-book',{data});
  });
  
})
router.get('/add-address',verifyLogin,(req,res)=>{
  let user = req.session.user;
  res.render('user/add-address',{user});
})

router.post('/add-address',(req,res)=>{
  let user = req.session.user;
  userHelpers.addAddress(req.body);
  res.redirect('/address-book');
})

router.get('/remove-address/:id',verifyLogin,(req,res)=>{
  
  userHelpers.removeAddress(req.params.id,req.session.user._id);
  res.redirect('/address-book');
})

router.get('/select-address/:id',verifyLogin,async(req,res)=>{
  let address = await userHelpers.selectAddress(req.params.id,req.session.user._id);
  req.session.selectedAddress = address;
  console.log("session-address",req.session.selectedAddress);
  res.redirect('/place-order')
})

router.get('/logout',verifyLogin,(req,res)=>{
  req.session.user = null;
  res.redirect('/');
})

module.exports = router;  
 