const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req,res) => {
  res.send("HELLO WORLD! I am here to help you and find the donors and for taking donations from the donors.");
});

app.listen(PORT, ()=>{
  console.log(`Server is running on the port ${PORT}, Express Server `);
})
