const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gc3dho1.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri)
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//console.log('connect with db')

async function run() {
  try {
    await client.connect();
    const serviceCollection = client
      .db("Dentist-doctor")
      .collection("services");
    const bookingCollection = client.db("Dentist-doctor").collection("booking");
    const userCollection = client.db("Dentist-doctor").collection("user");

    app.get("/services", async (req, res) => {
      const result = await serviceCollection.find({}).toArray();
      res.send(result);
    });


    app.get("/available", async(req,res)=>{
      const date = req.query.date || "Aug 14, 2022"
      const filter ={date:date}
      const services = await serviceCollection.find().toArray()
      const bookingServices = await bookingCollection.find(filter).toArray()
      services.forEach(service=>{
        const bookedServiceName = bookingServices.filter(b=> b.treatmentName===service.name)
        const bookedSlot = bookedServiceName.map( s => s.slot)
        //service.bookedSlot = bookedSlot
        const availableSlot = service.slots.filter(s =>!bookedSlot.includes(s))
        service.slots= availableSlot
      })
      res.send(services)
    })

   app.post("/booking", async(req,res)=>{
    const booking = req.body
    const query = {treatmentName:booking.treatmentName, patientEmail:booking.patientEmail,date:booking.date}
    const exist = await bookingCollection.findOne(query)
   // console.log(exist)
    if(exist){
      return res.send({success:false, booking:exist})
    }
    const result = await bookingCollection.insertOne(booking)
   return res.send({success:true,booking})
   })

   app.post("/user", async(req,res)=>{
    const user = req.body
    const result = await userCollection.insertOne(user)
    res.send(result)
   })


  
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Dentist Doctor uncle!");
});

app.listen(port, () => {
  console.log(`Dentist Doctor portal run on port ${port}`);
});
