var express = require('express');
var router = express.Router();
const adminHelpers=require('../helpers/adminHelpers');
const fs = require('fs');
const { showCategory } = require('../helpers/adminHelpers');
var nocache = require('nocache');
const userHelpers = require('../helpers/userHelpers');


/* GET users listing. */

verifyLogin=(req,res,next)=>{
  let admin=req.session.admin
  if(admin){
    next()
  }else{
    res.redirect('/admin/admin-login')
  }
}


router.get('/',verifyLogin,function(req, res, next) {
  let admin=req.session.admin;
  res.render('admin/admin',{admin});
});
 
router.get('/admin-login',nocache(),(req,res)=>{
  // checkkk
  res.render('admin/admin-login');
  let admin=req.session.admin;
  if(admin){
    res.redirect('/admin/');
  }
  else{
    err = req.session.err;
    res.render('admin/admin-login',{err});
    req.session.err = null;
  }
})

router.post('/admin-login',(req,res)=>{
  const adminInfo = {
    email : req.body.email,
    password : req.body.password,
  }
  adminHelpers.adminCheck(adminInfo).then((response)=>{
    if(response.status){ 
      console.log("Login Successfull");
      req.session.admin = response.admin; 
      res.redirect('/admin');
    }
    else{
      console.log(response.msg); 
      req.session.err = response.msg;
      
      res.redirect('/admin/admin-login');
    }
  })    
})

router.get('/user-list',verifyLogin,(req,res)=>{
  admin = req.session.admin;
  // if(admin){
    adminHelpers.getUsers().then((dataList)=>{
      res.render('admin/user-list',{admin,dataList});
    })
  // }else{
    // res.send("ff")
  // }
  
})

router.get('/delete-user/:id',verifyLogin,(req,res)=>{
  adminHelpers.deleteUsers(req.params.id);
  res.redirect('/admin/user-list');
})

router.get('/block-user/:id',verifyLogin,(req,res)=>{
  adminHelpers.blockUsers(req.params.id);
  res.redirect('/admin/user-list');
})

router.get('/unblock-user/:id',verifyLogin, (req,res)=>{
  adminHelpers.unblockUsers(req.params.id);
  res.redirect('/admin/user-list');
})

router.get('/add-product',verifyLogin,(req,res)=>{
 
  errMsg = req.session.errMsg;
  adminHelpers.showCategory().then((show)=>{
    res.render('admin/add-product',{errMsg,show});
  })
  
  req.session.errMsg = null;
})

router.post('/add-product',(req,res)=>{
  
  adminHelpers.addProducts(req.body).then((data)=>{
    if(data.id){
      id=data.id
      let image=req.files.image
      image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.redirect('/admin/product-list');
      } 
    })
    }
    else{
        req.session.errMsg = data;
        res.redirect('/admin/add-product');
    }
  })
})

router.get('/product-list',verifyLogin,(req,res)=>{
  admin = req.session.admin;
  if(admin){
    adminHelpers.getProducts().then((products)=>{
      res.render('admin/product-list',{products,admin});
    })
  }
  else{
    res.redirect('/admin/admin-login');
  }
})

router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let productId = req.params.id;
  adminHelpers.deleteProducts(productId).then((response)=>{
    res.redirect('/admin/product-list');
  })
  const imageUrl = `public/product-images/${productId}.jpg`;
  console.log(productId);
  fs.unlink(imageUrl,(err)=>{
    if(err){
      console.log("Cannot remove image file");
    }
    else{
      console.log("successfully removed image");
    }
  })
})

// router.get('/edit-product/:id',(req,res)=>{
//   res.render('admin/edit-product');
// })

router.get('/edit-product/:id',verifyLogin,async(req,res)=>{
  let productId = req.params.id;
  let product = await adminHelpers.editProducts(productId)
  errMsg = req.session.errMsg;
  res.render('admin/edit-product',{product,errMsg});
  req.session.errMsg = null;  
})

router.post('/edit-product/:id',async(req,res)=>{
  let productId = req.params.id;
  let productData = req.body;

  
  adminHelpers.insertEditedProducts(productId,productData).then((data)=>{
   
    if(data.status){    
      
       if(req.files){
        let image=req.files.image 
        image.mv('./public/product-images/'+productId+'.jpg',(err)=>{
          console.log(err);
        })
       }
       res.redirect('/admin/product-list');
    }
    else{ 
      req.session.errMsg = data;
      res.redirect('/admin/edit-product/'+productId);
    }
  });
   
})

router.get('/add-category',verifyLogin,(req,res)=>{
  let admin = req.session.admin;
  errMsg = req.session.errMsg;
  editCategoryData = req.session.editCategory;
  console.log(editCategoryData);
  adminHelpers.showCategory().then((categoryData)=>{
    // console.log(categoryData);
  res.render('admin/add-category',{categoryData,errMsg,editCategoryData,admin});
  req.session.errMsg = null;
  req.session.editCategory = null; 
  })
 
})

router.post('/add-category',(req,res)=>{
  adminHelpers.addCategory(req.body).then((data)=>{
    if(data.id){
      res.redirect('/admin/add-category');
    }
    else{
      req.session.errMsg = data;
      res.redirect('/admin/add-category');
    }
  })
  
})

router.get('/edit-category/:id',verifyLogin,(req,res)=>{
  let categoryId = req.params.id;
  adminHelpers.editCategory(categoryId).then((data)=>{
    // console.log("data is "+data);
    req.session.editCategory = data;
    
    res.redirect('/admin/add-category');
  })
  
})

router.post('/edit-category/:id',verifyLogin,(req,res)=>{
  let categoryId = req.params.id;
  let updateData = req.body;
  // console.log("updata"+updateData);
  adminHelpers.updateCategory(categoryId,updateData);
  res.redirect('/admin/add-category'); 
})

router.get('/delete-category/:id',verifyLogin,(req,res)=>{
  let categoryId = req.params.id;
  adminHelpers.deleteCategory(categoryId).then((response)=>{
    res.redirect('/admin/add-category');
  }) 

})

router.get('/order-list',verifyLogin,async(req,res)=>{
  let orderList = await adminHelpers.getOrderList();
  console.log("orderList = ",orderList);
  res.render('admin/order-list',{orderList,admin:req.session.admin}); 
})

router.get('/order-details/:id',verifyLogin,async(req,res)=>{
  let orderDetails = await adminHelpers.getOrderDetails(req.params.id);
  res.render('admin/order-details',{orderDetails});
})

router.get('/logout',verifyLogin,(req,res)=>{
  req.session.admin = null;
  res.redirect('/admin/admin-login');
})

module.exports = router;
