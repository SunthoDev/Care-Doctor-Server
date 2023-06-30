require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000


// middleware
app.use(cors())
app.use(express.json())




// verifyJWT function 
let verifyJWT = (req, res, next) => {

    console.log(req.headers.authorization)
    let authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: "unauthorize Access" })
    }

    let token = authorization.split(" ")[1]

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {

        if (err) {
            return res.status(401).send({ error: true, message: "unauthorize Access" })
        }
        req.decoded = decoded
        next()

    });

}



// mongo db system 

const uri = `mongodb+srv://${process.env.CARE_DOCTOR}:${process.env.CARE_PASS}@cluster0.qzzmb4j.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        let serviceCollection = client.db("carDoctor").collection("services")
        let bookingCollection = client.db("carDoctor").collection("booking")


        // jwt operation 
        app.post("/jwt", (req, res) => {
            let user = req.body
            console.log(user)
            let token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "7d"
            })
            res.send({ token })
        })


        // services route 
        app.get("/services", async (req, res) => {
            let cursor = serviceCollection.find()
            let result = await cursor.toArray()
            res.send(result)
        })

        // id unike data finde 

        app.get("/services/:id", async (req, res) => {
            let id = req.params.id
            let query = { _id: new ObjectId(id) }
            let options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 }
            }
            let result = await serviceCollection.findOne(query, options)
            res.send(result)
        })


        // booking 
        // ===============================

        // query deya sasme email data gula sob finde kore 

        app.get("/booking", verifyJWT, async (req, res) => {
            let decoded = req.decoded
            console.log("Come back Server My Data", decoded)

            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: "Forbidden Access" })
            }

            let query = {}
            if (req.query?.email) {

                query = { email: req.query.email }
            }
            let result = await bookingCollection.find(query).toArray()
            res.send(result)
        })


        
        // post kore data DBMS
        app.post("/booking", async (req, res) => {
            let bookInfo = req.body
            let result = await bookingCollection.insertOne(bookInfo)
            res.send(result)

        })
        // delete my booking
        app.delete("/delete/:id", async (req, res) => {
            let id = req.params.id
            let query = { _id: new ObjectId(id) }
            let result = await bookingCollection.deleteOne(query)
            res.send(result)
        })
        // update my booking data
        app.patch("/update/:id", async (req, res) => {
            let id = req.params.id
            let upData = req.body
            console.log(id, upData)
            let filter = { _id: new ObjectId(id) }
            let updateData = {
                $set: {
                    status: upData.status
                }
            }
            let result = await bookingCollection.updateOne(filter, updateData)
            res.send(result)
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





//Check Server
app.get("/", (req, res) => {
    res.send("Care Doctor Server Is Running")
})

app.listen(port, () => {
    console.log(`This Is My Care Server Is Running${port}`)
})











