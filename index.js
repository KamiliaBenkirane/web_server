const express = require("express");
const cors = require("cors")


const app = express();
app.use(cors({
    origin :'*',
    methods : ['GET', 'POST']
}))

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const { Pool } = require("pg");
const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "appbook",
    password: "admin",
    port: 5432
});

app.get("/getUser", (req, res) => {
    console.log("coucou")
    const sql = "SELECT * FROM public.users";
    pool.query(sql, [], (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        res.json(result.rows)
    });
});


app.post("/createUser", (req, res) => {
    const { nom, prenom, mail, numero, adresse, mdp } = req.body;
    const checkEmailQuery = "SELECT COUNT(*) FROM public.users WHERE mail = $1";
    const checkEmailValues = [mail];

    pool.query(checkEmailQuery, checkEmailValues, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'An error occurred while checking the email.' });
        }

        const emailCount = result.rows[0].count;

        if (emailCount > 0) {
            // Email already exists, return an error response
            return res.status(400).json({ error: 'Email already exists.' });
        }

        console.log(req.body);

        const sql = "INSERT INTO public.users(nom, prenom, mail, numero, adresse, mdp) VALUES ($1, $2, $3, $4, $5, $6)";
        const values = [nom || null, prenom || null, mail || null, numero || null, adresse || null, mdp || null];
        pool.query(sql, values, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            res.status(200).json({ message: 'User created successfully.' });
            console.log("user added successfully !")
        });
    });
});


app.post("/login", (req, res) => {
    const { mail, mdp} = req.body;
    const loginQuery = "SELECT * from public.users WHERE mail = $1 and mdp = $2"
    const values = [mail, mdp]

    pool.query(loginQuery, values, (err, result)=> {

        if (result.rows.length === 0){
            return res.status(400).json({error : 'No account found'})
        }

        return res.status(200).json({message : 'login succesfull'});

    })

})


console.log("Connexion réussie à la base de données");

app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.send("Bonjour le monde...");
});