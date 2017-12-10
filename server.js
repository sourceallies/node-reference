

const express = require('express');
const app = express();


function helloWorld(req, res) {
    res.send("hello world");
}

app.get('/', helloWorld);


app.listen(3000, () => {
    console.log("Listening");
});