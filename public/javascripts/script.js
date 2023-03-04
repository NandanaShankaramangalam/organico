function addToCart(productId){
    $.ajax({
      url : '/add-to-cart/'+productId,
      method : 'get',
      success : (response)=>{
        // alert(response);
        console.log(response)
        if(response.status){ 
            let count = $('#cart-count').html()
            count = parseInt(count) + 1;
            $('#cart-count').html(count);
        }
      }
    })
  }

  function placeOrder(){
    let fname = document.myform.fname.value;
    let lname = document.myform.lname.value;
    let street = document.myform.street.value;
    let state = document.myform.state.value;
    let town = document.myform.town.value;
    let zip = document.myform.zip.value;
    let phone = document.myform.phone.value;
    let email = document.myform.email.value;

    let nameRegx=/^([A-Za-z]){3,20}$/gm
    let streetRegx=/^([A-Za-z]){3,20}$/gm
    let stateRegx=/^([A-Za-z ]){3,20}$/gm
    let townRegx=/^([A-Za-z]){3,20}$/gm
    let lnameRegx=/^([A-Za-z]){1,20}$/gm
    let zipRegx=/^([0-9]){6}$/gm 
    let phoneRegx=/^([0-9]){10}$/gm
    let emailRegx=/^(\w){3,16}@([A-Za-z]){5,8}.([A-Za-z]){2,3}$/gm

    if(fname == ''){
      document.getElementById('err').innerHTML="Firstname field required";
        return false;
    }
    else if(nameRegx.test(fname) == false){
      document.getElementById('err').innerHTML = "Firstname should be characters and should atleast have 4 characters";
        return false;
    }
    else if(lname == ''){
      document.getElementById('err').innerHTML="Lastname field required";
        return false;
    }
    else if(lnameRegx.test(lname) == false){
      document.getElementById('err').innerHTML = "Lastname should be characters";
        return false;
    }
    else if(street == ''){
      document.getElementById('err').innerHTML="Street name required";
        return false;
    }
    else if(streetRegx.test(street) == false){
      document.getElementById('err').innerHTML = "Street name should atleast have 4 characters";
        return false;
    }
    else if(state == ''){
      document.getElementById('err').innerHTML="State name required";
        return false;
    }
    else if(stateRegx.test(state) == false){
      document.getElementById('err').innerHTML = "State name should atleast have 4 characters";
        return false;
    }
    else if(town == ''){
      document.getElementById('err').innerHTML="Town name required";
        return false;
    }
    else if(townRegx.test(town) == false){
      document.getElementById('err').innerHTML = "Town name should atleast have 4 characters";
        return false;
    }
    else if(zip == ''){
      document.getElementById('err').innerHTML="Zip code required";
        return false;
    }
    else if(zipRegx.test(zip) == false){
      document.getElementById('err').innerHTML = "zip code should have 6 digits";
        return false;
    }
    else if(phone == ''){
      document.getElementById('err').innerHTML="Phone number required";
        return false;
    }
    else if(phoneRegx.test(phone) == false){
      document.getElementById('err').innerHTML = "Phone number should have 10 digits";
        return false;
    }
    else if(email == ''){
      document.getElementById('err').innerHTML="Email id required";
        return false;
    }
    else if(emailRegx.test(email) == false){
      document.getElementById('err').innerHTML = "Enter valid email id";
        return false;
    }
  }