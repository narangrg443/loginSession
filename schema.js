const mongoose = require('mongoose')

const validator = require('validator')

const passportLocalMongoose = require("passport-local-mongoose");



const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },

  age:
  {
    type: Number,
    min: 10,
    max: 100,
    validate(value) {
      if (value%2 === 0) {
        throw new Error(`values should be odd number`)
      }
    }

  },

  address: String,
  email:
  {
    type: String,

    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("email is invalid");
      }
    }
  },
  createdAt: {
    type: Date,
    default: ()=>Date.now()
    }

  });





  userSchema.plugin(passportLocalMongoose);


  const User = mongoose.model("User", userSchema);


  userSchema.methods.speak = function speak() {
    const greet = this.name?`hello iam ${this.name}`: 'i don\'t have name`';
    console.log(greet)
  }


  module.exports = User;