const express = require('express');
const app = express();
const path = require('path');
const port = 3000;
//const methodOverride = require('method-override');
//const formidable = require('express-formidable');
const Joi = require('joi');
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const { contact, user } = require('./schema.js')
const auth = require('./auth');



//app.use(formidable());


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(methodOverride('_method'));

//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');


const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/lesson',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
        
    });


const db = mongoose.connection;
db.once("open", function ()
{
    console.log("db connected")
});

const joischema = Joi.object({
    name: Joi.string().min(3).required(),
    number: Joi.number().min(99999999).max(9999999999).required(), //assuming 10 digit phone numbers in India
    email:Joi.string().min(4).email()
   
});

const joischema2 = Joi.object({
    name: Joi.string().min(3).required(),
    password: Joi.string().min(6).required(),
    email:Joi.string().min(4).email()
   
});


//1. FIRST WE REGISTER THE AUTHORITY WHICH CAN DO CRUD OPERATIONS

app.post('/register', async (req, res) => {
    const { error } = joischema2.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if this user already exisits
    let User = await user.findOne({ email: req.body.email });
    if (User) {
        return res.status(400).send('User already exisits!');
    } else {
        // Insert the new user if they do not exist yet
        User = new user({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });
         const salt = await bcrypt.genSalt(10);
        User.password = await bcrypt.hash(User.password, salt);
        await User.save();

        res.send(User._id);
    }
});

//2.LOGGING IN WITH REGISTERED USER AND GETTING JWT AUTHENTICATED

app.post('/login', async (req, res) => {

    const logg = Joi.object({
    password: Joi.string().min(6).required(),
    email:Joi.string().min(4).email().required()
});

    const { error } = logg.validate(req.body);
    if (error) {
        return res.status(400).send('Email must be valid');
    }

    //  find the user by their email id
    let User = await user.findOne({ email: req.body.email });
    if (!User) {
        return res.status(401).send('No account with this Email');
    }

    // Then validate the Credentials in MongoDB match
    const validPassword = await bcrypt.compare(req.body.password, User.password);
    if (!validPassword) {
        return res.status(401).send('Incorrect email or password.');
    }

   // const token = jwt.sign({_id: User.id, isAdmin: User.isAdmin}, 'JWTprivatekey')
    const token = User.generateAuthToken();
    res.header('x-auth-token', token).send(User.id);
});

//3.ROUTE TO ADD A CONTACT

app.post('/addcontact',auth, async (req, res) => {
    const { error } = joischema.validate(req.body);
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Check if this contact already exisits
    let Contact = await contact.findOne({ number: req.body.number });
    if (Contact) {
        return res.status(400).send('Contact already exisits!');
    } else {
        // Insert the new contact if they do not exist yet
        Contact = new contact({
            name: req.body.name,
            email: req.body.email,
            number: req.body.number
        });
         
        await Contact.save();

        res.send(Contact._id);
    }
});

app.post('/multiplecontacts', auth, async function (req, res) {
    try {
        const { error } = joischema.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }
        var contactarray = [];
        contactarray = req.body.contacts

        const data = await contact.insertMany(contactarray);
        res.send("successfull")
    }
    catch (err) {
        console.log(err);
    }
})

app.get('/me',auth,  async function (req, res) {
    const User = await user.findById(req.User._id).select('-password')
    res.send(User);
})

//4.ROUTE TO FETCH ALL CONTACTS

app.get('/getallcontacts',  async function (req, res) {
    try {
        const limitValue = 10 // 2 docs per page;
        const skipValue = 0 //
        const documents = await contact.find({}).limit(limitValue).skip(skipValue);
        //for implementing pagination
        res.send(documents);
    }
    catch (err) {
        console.log(err);
    }
})

//5. ROUTE TO FETCH SPECIFIC CONTACT BY NAME

app.get('/getcontact/:name',  async function (req, res)
{
    try {
        const cont = await contact.find({ name: req.params.name })
        if (!cont) {
            return res.status(404).send('not found name')
        }
        res.send(cont);
    }
    catch (err) {
        console.error(err);
    }
    

})

//6. ROUTE TO UPDATE A CONTACT 

app.put('/updatecontact',auth, async  (req, res) => {

    const { name, number, email } = req.body;

    const result = joischema.validate(req.body)
    
    if (result.error) {
        res.status(400).send(result.error.details)
        return;
    }
    else {
        const Contact = await contact.findOne({ name: req.body.name})
        if (!Contact)
            return res.status(404).send('not found contact')
        else {
               
                Contact.name= name,
                Contact.number= number,
                Contact.email = email
        }
         Contact.save();
            res.end('updated succesfully');
    }

})

//7.ROUTE TO DELETE A CONTACT

app.delete('/deletecontact/:name',auth, async (req, res) => {

   
        const Contact =await contact.findOneAndDelete({ name: req.params.name})
    if (!Contact)
        return res.status(404).send('not found contact')
    else {
        res.end("deleted succesfully")
    }
})


app.listen(port, function (req, res) {
    console.log("app listening on port 3000");
 })



