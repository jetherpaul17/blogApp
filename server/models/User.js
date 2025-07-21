const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: false,
		default: function() {
			return this.email ? this.email.split('@')[0] : 'User';
		}
	},
	email: {
		type: String,
		required: [true, 'Email is Required']
	},
	password: {
		type: String,
		required: [true, 'Password is Required']
	},
	isAdmin: {
		type: Boolean,
		default: false
	}

});

module.exports = mongoose.model('User', userSchema);