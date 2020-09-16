require("dotenv").config();
const express = require("express");
const app = express();
var bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
mongoose
  .connect(process.env.Mongo_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.error(`Connection failed...`, err));
mongoose.set("useFindAndModify", false);

//
//
//
//
const bookRouter = require("./router/book.router");

//
//
//
//
//

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/books", bookRouter);
var port = process.env.PORT || 3000;
// listen for requests :)
app.listen(port, () => {
  console.log("Server listening on port " + port);
});
