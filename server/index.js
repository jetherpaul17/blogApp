const express = require("express");
const mongoose = require("mongoose");

const cors = require("cors");

const port = 4000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors());

//MongoDB database
mongoose.connect("mongodb+srv://admin123:admin123@b546.i6mpko0.mongodb.net/blogApp?retryWrites=true&w=majority&appName=b546");

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));
mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

//Routes Middleware
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");

app.use("/users", userRoutes);
app.use("/posts", postRoutes);

if(require.main === module){
	app.listen(process.env.PORT || port, () => {
	    console.log(`API is now online on port ${ process.env.PORT || port }`)
	});
}

module.exports = {app,mongoose};