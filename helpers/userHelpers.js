const user = require('../model/userSchema');
const product = require('../model/productSchema');
const cart = require('../model/cartSchema');
const orders = require('../model/orderSchema');
var bcrypt = require('bcrypt');
const nodemailer=require('nodemailer');
const { default: mongoose } = require('mongoose');
const { response } = require('express');
require('dotenv').config();
// const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

module.exports = {
    insertUser : (userInfo)=>{
        console.log(userInfo);
        return new Promise(async(resolve, reject) => {
            var errMsg;
            var nameRegex = /^[a-zA-Z][a-zA-Z0-9_ ]{5,15}$/i;
            var emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
            var passwordRegex=/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]){8,16}/gm;
            var phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
            var validateEmail = await user.findOne({email : userInfo.email});
            if(userInfo.name == ''){
               errMsg = "Name field is empty!";
               resolve(errMsg);
            }
            else if(nameRegex.test(userInfo.name) != true){
              errMsg = "Invalid name format";
              resolve(errMsg);
            }
            else if(userInfo.email == ''){
               errMsg = "Email field is empty!";
               resolve(errMsg);
            }
            else if(validateEmail){
               errMsg = "Email already exist!";
               resolve(errMsg);
            }
            else if(emailRegex.test(userInfo.email) != true){
              errMsg = "Invalid email format";
              resolve(errMsg);
            }
            else if(userInfo.phone == ''){
              errMsg = "Phone number field is empty!";
              resolve(errMsg);
            }
            else if(phoneRegex.test(userInfo.phone) != true){
              errMsg = "Invalid phone number format";
              resolve(errMsg);
            }
            else if(userInfo.password == ''){
              errMsg = "Password field is empty!";
              resolve(errMsg);
            }
            else if(passwordRegex.test(userInfo.password) != true){
              errMsg = "Password should contain minimum 8 characters, 1 uppercase letter, lowercase letter and a number";
              resolve(errMsg);
            }
            else if(userInfo.confirmpassword == ''){
                errMsg = "Confirm password field is empty!";
                resolve(errMsg);
              }
            else if(userInfo.password != userInfo.confirmpassword){
              errMsg = "Passwords doesn't match!";
              resolve(errMsg);
            }
            else{
              const userData = {
                name : userInfo.name,
                email : userInfo.email,
                phone : userInfo.phone,
                password : userInfo.password, 
                status : true
              }
              userData.password = await bcrypt.hash(userData.password,10);
              await user.insertOne(userData).then((data)=>{
                console.log(data);
                resolve();
              });
            }
           
            })
    },
    userCheck : (userInfo)=>{
            console.log(userInfo);
            var response = {};
            return new Promise(async(resolve, reject) => {
                var users = await user.findOne({email : userInfo.email});
                if(users){
                  if(users.status){
                  bcrypt.compare(userInfo.password,users.password).then((status)=>{
                   if(status){
                      console.log(status);
                      response.user = users;
                      response.status = true;
                      resolve(response);
                   }
                   else{
                    response.msg = "Invalid Password!";
                    resolve(response);
                }
                })
              }
              else{
                response.msg = "You account has been blocked!";
                resolve(response);
              }
            }
                else{
                    response.msg = "Invalid Email!";
                    resolve(response);
                }
            })
    },
      otpVerification : (data)=>{
      let response={}
      return new Promise(async(resolve, reject) => {
          let checkuser = await user.findOne({email:data.email})
          if(checkuser){
            if(checkuser.status) {
              otpEmail = checkuser.email
              response.otp = OTP()
              let otp = response.otp
              let mailTransporter = nodemailer.createTransport({
                  service : "gmail",
                  auth : {
                      user:process.env.EMAIL_ADDRESS,
                      pass:process.env.EMAIL_PASSWORD
                  }
              })
              
              let details = {
                  from:process.env.EMAIL_ADDRESS,
                  to:otpEmail, 
                  subject:"Organico",
                  text: otp+" is your Organico verification code. Do not share OTP with anyone "
              }

              mailTransporter.sendMail(details,(err)=>{
                  if(err){
                      console.log(err);
                  }else{
                      console.log("OTP Send Successfully ");
                  }
              })

              function OTP(){
                  OTP = Math.random()*1000000
                  OTP = Math.floor(OTP)
                  return OTP
              }
              response.user = checkuser
              response.status = true
              
              resolve(response) 
            }
            else{
              response.err="Entered email is blocked!";
              resolve(response);
            }
          }else{
              response.err="Email not registered!";
              resolve(response);
          }
      })

     },
     showProducts : ()=>{
      return new Promise(async(resolve, reject) => {
        const products = await product.find().toArray();
        resolve(products);
      })
     },
     showSingleProduct : (productId)=>{
        return new Promise(async(resolve, reject) => {
          const productData = await product.findOne({_id:ObjectId(productId)});
          resolve(productData);
        }) 
     },
     addToCart : (productId,userId)=>{
      let productObject = {
        item : ObjectId(productId), 
        quantity : 1
      }
        return new Promise(async (resolve, reject) => {
          let userCart = await cart.findOne({userId:ObjectId(userId)});
          if(userCart){
            let productExist = userCart.products.findIndex(product => product.item == productId);
            console.log(productExist);
            if(productExist != -1){
              cart.updateOne({user:ObjectId(userId),'products.item':ObjectId(productId)},
              {
                $inc : {'products.$.quantity':1}
              }).then(()=>{
                resolve()
              })
            }else{
              cart.updateOne({userId:ObjectId(userId)},
              {$push:{products:productObject}}
            ).then((response)=>{
              resolve(); 
            })
            }
              
          }
          else{
            let cartObj = {
              userId : ObjectId(userId),
              products : [productObject]
            }
            cart.insertOne(cartObj).then((response)=>{
              resolve();
            })
          }
        })
     },
     getCartProducts : (userId)=>{
      return new Promise(async (resolve, reject) => {
       let cartItems = await cart.aggregate([
        {
          $match : {userId:ObjectId(userId)}
        },
        {
          $unwind : '$products'
        },
        {
          $project : {
            item : '$products.item',
            quantity : '$products.quantity'
          }
        },
        {
          $lookup : {
            from : 'products',
            localField : 'item',
            foreignField : '_id',
            as : 'productDetails'
          }
        },
        {
          $project : {
            item : 1, quantity : 1, productDetails : {$arrayElemAt:['$productDetails',0]}
          }
        }
        
       ]).toArray();
       
       console.log(cartItems);
       resolve(cartItems);
      })

     },
     getCartCount : (userId)=>{
      return new Promise(async(resolve, reject) => {
        let count = 0;
        let userCart = await cart.findOne({userId:ObjectId(userId)});
        if(userCart){
          count = userCart.products.length;
        }
        resolve(count);
      })
     },
     changeProductQuantity : (details)=>{
      details.count = parseInt(details.count);
      details.quantity = parseInt(details.quantity)
      console.log(details);
      // console.log(cartId,productId);
      return new Promise((resolve, reject) => {
        if(details.count == -1 && details.quantity == 1){
              cart.updateOne({_id:ObjectId(details.cart)},
              {
                $pull : {products : {item : ObjectId(details.product)}}
              }).then((response)=>{
                resolve({removeProduct:true});
              })
             }
             else{
              cart.updateOne({_id:ObjectId(details.cart),'products.item': ObjectId(details.product)},
              {
                $inc : {'products.$.quantity':details.count}
              }).then((response)=>{ 
                resolve({status:true});
              })
             }
      })
     },
     removeProduct : (productId,userId)=>{
        
      return new Promise((resolve, reject) => {
        cart.updateOne({userId:ObjectId(userId),'products.item':ObjectId(productId)},{
          $pull:{
            products:{item:ObjectId(productId)}
          }
        }).then(()=>{
          resolve()
        })
      })

     },
     getTotalAmount : (userId)=>{
      return new Promise(async (resolve, reject) => {
        let cartItems = await cart.aggregate([
         {
           $match : {userId:ObjectId(userId)}
         },
         {
           $unwind : '$products'
         },
         {
           $project : {
             item : '$products.item',
             quantity : '$products.quantity'
           }
         },
         {
           $lookup : {
             from : 'products',
             localField : 'item',
             foreignField : '_id',
             as : 'productDetails'
           }
         },
         {
           $project : {
             item : 1, quantity : 1, productDetails : {$arrayElemAt:['$productDetails',0]}
           }
         },
         {
          $group : {

            _id : null,
            total : {$sum : {$multiply:["$quantity",'$productDetails.price']}}
          }
         }
         
        ]).toArray();
        
        console.log(cartItems);
        resolve(cartItems);
       })
     },
     placeOrder : (order,products,total)=>{
       return new Promise(async (resolve, reject) => {
        console.log(order,products,total);
        let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';
        let orderObj = {
          deliveryDetails : {
            name : order.fname +" "+ order.lname,
            street : order.street,
            state : order.state,
            town : order.town,
            zip : order.zip,
            phone : order.phone,
            email : order.email,
          },
          userId : ObjectId(order.userId),
          paymentMethod : order['payment-method'],
          products : products,
          totalAmount : total,
          status : status,
          date : new Date()
        } 

        let productCount = products.length;
            for(i=0;i<productCount;i++){
                let qty =- (products[i].quantity)
                let productId = products[i].item
                console.log(productId,qty);
                await cart.findOne({_id:productId});

              
                product.updateOne({_id:productId},{$inc:{stock:qty}})
            }
        if(order.save == 'true'){
            user.updateOne({_id:ObjectId(order.userId)},{$push:{address:orderObj.deliveryDetails}});
            
        }
          orders.insertOne(orderObj).then((response)=>{
            cart.deleteOne({userId:ObjectId(order.userId)});
            resolve();
          })
       })
     },
     getCartProductList : (userId)=>{
       return new Promise(async(resolve, reject) => {
        let cartDetails = await cart.findOne({userId:ObjectId(userId)});
        console.log(cartDetails);
        resolve(cartDetails.products);
       })
     }
     
}
