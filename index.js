const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const dbConnection = require('./database');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.urlencoded({extended:false}));

app.set('views', path.join(__dirname,'views'));
app.set('view engine','ejs');

app.use(cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
    maxAge:  3600 * 10000 // 1-hr
}));


const ifNotLoggedin = (req, res, next) => {
    if(!req.session.isLoggedIn){
        return res.render('login-register');
    }
    next();
}

const ifLoggedin = (req,res,next) => {
    if(req.session.isLoggedIn){
        return res.redirect('/home');
    }
    next();
}



app.get('/', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `Name`,`Number`,`Address`,`Email` FROM `User` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('home',{
            name:rows[0].Name,
            number:rows[0].Number,
            address:rows[0].Address,
            email:rows[0].Email
        });
    });
    
});


app.get('/Profile', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `Name`,`Number`,`Address`,`Email` FROM `User` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('home_check',{
            name:rows[0].Name,
            number:rows[0].Number,
            address:rows[0].Address,
            email:rows[0].Email
        });
    });
    
});




app.get('/Profile', (req, res) => {
    res.render('home_check.ejs')
})


app.get('/extra', (req, res) => {
    res.render('extra.ejs')
})


app.get('/edit', (req, res) => {
    res.render('update.ejs')
})


app.get('/delete', (req, res) => {


    

    dbConnection.execute("DELETE FROM `cart` where `email`=? ",[req.session.userID])
    .then(result => {
        res.redirect('/cart');
    }).catch(err => {
       
        if (err) throw err;
    });



})

app.get('/bill', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `Name`,`Number`,`Address`,`Email` FROM `User` WHERE `id`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('bill',{
            name:rows[0].Name,
            number:rows[0].Number,
            address:rows[0].Address,
            email:rows[0].Email
        });
    });
    
});


app.post('/bill', 
[
    body('cardname','cardname is Empty!').trim().not().isEmpty(),
    body('cardnumber','Number should be 12 digits').trim().not().isEmpty(),
    body('expmonth','exp-month is Empty!').trim().not().isEmpty(),
    body('expyear','exp-year is Empty!').trim().not().isEmpty(),
    body('cvv','The password must be of  3 numbers').trim().not().isEmpty(),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {cardname, cardnumber, expmonth, expyear, cvv} = req.body;
    
    if(validation_result.isEmpty()){
        
        
            dbConnection.execute("INSERT INTO `usercard`(`userid`,`cardname`,`cardnumber`,`expmonth`,`expyear`,`cvv`) VALUES(?,?,?,?,?,?)",[req.session.userID,cardname,cardnumber,expmonth,expyear, cvv])
            .then(result => {


                dbConnection.execute("INSERT INTO ordered (email, title, price) SELECT email, title, price FROM cart where email = ?",[req.session.userID])
                .then(result => {
  
                    dbConnection.execute("DELETE FROM `cart` where `email`=?",[req.session.userID])
    .then(result => {
        res.redirect('/order');
    }).catch(err => {
       
        if (err) throw err;
    });

                }).catch(err => {
                   
                    if (err) throw err;
                });

            }).catch(err => {
               
                if (err) throw err;
            });
        
      
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('home',{
            register_error:allErrors,
            old_data:req.body
        });
    }
   
});


/*
app.get('/order', (req, res) => {
    res.render('order.ejs')
    dbConnection.execute("SELECT `title`,`price` FROM `ordered` WHERE `email`=?",[req.session.userID])
    .then(([rows]) => {
        
        res.render('order',{
            rows:rows
            
        });
    });
})

*/


app.get('/order', ifNotLoggedin, (req,res,next) => {
    dbConnection.execute("SELECT `title`,`price`,`date` FROM `ordered` WHERE `email`=?",[req.session.userID])
    .then(([rows]) => {
        res.render('order',{
            rows:rows
            
        });
    });
    
});






app.get('/contact', (req, res) => {
    res.render('contact.ejs')
})


app.get('/about', (req, res) => {
    res.render('about.ejs')
})


app.get('/cart', (req, res) => {
    dbConnection.execute("SELECT `id`,`title`,`price`  FROM `cart` WHERE `email`=?",[req.session.userID])
    .then(([rows]) => {   
        res.render('cart',{
            rows:rows ,
            sum:0
        });
    });
})



app.post('/contact', 
[
    body('name','Username is Empty!').trim().not().isEmpty(),
    body('number','Number should be 10 digits').trim().isLength({ min: 10 }),
    body('subject','Address is Empty!').trim().not().isEmpty(),
    body('message','Address is Empty!').trim().not().isEmpty(),
    body('email','Invalid email address!').isEmail(),
    
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {name, email, number, message, subject} = req.body;
    
    if(validation_result.isEmpty()){
        
       
            dbConnection.execute("INSERT INTO `contact`(`Name`,`Email`,`Subject`,`Number`,`Message`) VALUES(?,?,?,?,?)",[name,email,subject,number,message])
            .then(result => {
                res.send(`You have successfully registered your complaint, Go Back to <a href="/">Home</a>`);
            }).catch(err => {
               
                if (err) throw err;
            });
        
       
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('home',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});








app.post('/', (req,res,next) => {

    const {title, price,} = req.body;
           console.log(title,price)
     dbConnection.execute("SELECT `Email` FROM `User` WHERE `id`=?",[req.session.userID])
        .then(([rows]) => {
            
                email:rows[0].Email
       
            dbConnection.execute("INSERT INTO `cart`(`email`,`title`,`price`) VALUES(?,?,?)",[req.session.userID,title, price])
            .then(result => {
                res.redirect('/');
            }).catch(err => {
               
                if (err) throw err;
            });
        
});
});
















app.post('/edit', ifNotLoggedin, 
[
    body('name','Username is Empty!').trim().not().isEmpty(),
    body('number','Number should be 10 digits').trim().isLength({ min: 10 }),
    body('address','Address is Empty!').trim().not().isEmpty(),
   
   ],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {name,  number, address} = req.body;
    
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT `Email` FROM `User` WHERE `id`=?",[req.session.userID])
        .then(([rows]) => {
            
                email:rows[0].Email
       

            dbConnection.execute("UPDATE `User` SET `Name` = '"+name+"',`Number` = '"+number+"', `Address` = '"+address+"'  WHERE `id`=?",[req.session.userID])
            .then(result => {
                res.send(`Your account has been updated, Go back to <a href="/Profile">Profile</a>`);
            }).catch(err => {
               
                if (err) throw err;
            });
        });
    
        
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
       
        res.render('update',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});










app.post('/register', ifLoggedin, 
[
    body('user_name','Username is Empty!').trim().not().isEmpty(),
    body('user_number','Number should be 10 digits').trim().isLength({ min: 10 }),
    body('user_address','Address is Empty!').trim().not().isEmpty(),
    body('user_email','Invalid email address!').isEmail().custom((value) => {
        return dbConnection.execute('SELECT `Email` FROM `User` WHERE `Email`=?', [value])
        .then(([rows]) => {
            if(rows.length > 0){
                return Promise.reject('This E-mail already in use!');
            }
            return true;
        });
    }),
    body('user_pass','The password must be of minimum length 8 characters').trim().isLength({ min: 8 }),
],// end of post data validation
(req,res,next) => {

    const validation_result = validationResult(req);
    const {user_name, user_pass, user_email, user_number, user_address} = req.body;
    
    if(validation_result.isEmpty()){
        
        bcrypt.hash(user_pass, 12).then((hash_pass) => {
            dbConnection.execute("INSERT INTO `User`(`Name`,`Number`,`Address`,`Email`,`Password`) VALUES(?,?,?,?,?)",[user_name,user_number,user_address,user_email, hash_pass])
            .then(result => {
                res.send(`Your account has been created successfully, Now you can <a href="/">Login</a>`);
            }).catch(err => {
               
                if (err) throw err;
            });
        })
        .catch(err => {
            
            if (err) throw err;
        })
    }
    else{
        // COLLECT ALL THE VALIDATION ERRORS
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH VALIDATION ERRORS
        res.render('login-register',{
            register_error:allErrors,
            old_data:req.body
        });
    }
});

// LOGIN PAGE
app.post('/login', ifLoggedin, [
    body('user_email').custom((value) => {
        return dbConnection.execute('SELECT `Email` FROM `User` WHERE `Email`=?', [value])
        .then(([rows]) => {
            if(rows.length == 1){
                return true;
                
            }
            return Promise.reject('Invalid Email Address!');
            
        });
    }),
    body('user_pass','Password is empty!').trim().not().isEmpty(),
], (req, res) => {
    const validation_result = validationResult(req);
    const {user_pass, user_email} = req.body;
    if(validation_result.isEmpty()){
        
        dbConnection.execute("SELECT * FROM `User` WHERE `Email`=?",[user_email])
        .then(([rows]) => {
            
            bcrypt.compare(user_pass, rows[0].Password).then(compare_result => {
                if(compare_result === true){
                    req.session.isLoggedIn = true;
                    req.session.userID = rows[0].id;

                    res.redirect('/');
                }
                else{
                    res.render('login-register',{
                        login_errors:['Invalid Password!']
                    });
                }
            })
            .catch(err => {
                if (err) throw err;
            });


        }).catch(err => {
            if (err) throw err;
        });
    }
    else{
        let allErrors = validation_result.errors.map((error) => {
            return error.msg;
        });
        // REDERING login-register PAGE WITH LOGIN VALIDATION ERRORS
        res.render('login-register',{
            login_errors:allErrors
        });
    }
});
// END OF LOGIN PAGE

// LOGOUT
app.get('/logout',(req,res)=>{
    //session destroy
    req.session = null;
    res.redirect('/');
});
// END OF LOGOUT

app.use('/', (req,res) => {
    res.status(404).send('<h1>404 Page Not Found!</h1>');
});

app.listen(3000, () => console.log("Server is Running..."));
