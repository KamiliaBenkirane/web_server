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

app.post("/createBook", (req, res) => {
    const {titre, auteur, image, stock, edition, resume, prix, note, genres } = req.body;
    const checkTitreQuery = "SELECT COUNT(*) FROM public.livres WHERE titre = $1";
    const checkTitreValues = [titre];

    pool.query(checkTitreQuery, checkTitreValues, (err, result) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'An error occurred while checking the title.' });
        }

        const titreCount = result.rows[0].count;

        if (titreCount > 0) {
            return res.status(400).json({ error: 'Book already exists.' });
        }

        console.log(req.body);

        const sql = "INSERT INTO public.livres(titre, auteur, image, stock, edition, resume, prix, note, genres) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
        const values = [titre || null, auteur || null, image || null, stock || null, edition || null, resume || null, prix || null, note || null, genres || null];
        pool.query(sql, values, (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            res.status(200).json({ message: 'Book created successfully.' });
            console.log("Book added successfully !")
        });
    });
});

app.get("/getBook", (req, res) => {
    console.log("coucou2")
    const sql = "SELECT * FROM public.livres ORDER BY id ASC ";
    pool.query(sql, [], (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        res.json(result.rows)
    });
});


app.post("/login", (req, res) => {
    const { mail, mdp} = req.body;

    const loginQueryAdmin = "SELECT * from public.admins WHERE mail = $1 and mdp = $2"
    const values = [mail, mdp]
    pool.query(loginQueryAdmin, values, (err, result)=>{
        if (result.rows.length !== 0){
            console.log("admin????")
            const message = 'login admin successfull';
            const response = { message, result };
            return res.status(200).json(response)
        }
        else{
            const loginQuery = "SELECT * from public.users WHERE mail = $1 and mdp = $2"

            pool.query(loginQuery, values, (err, result)=> {

                if (result.rows.length === 0){
                    return res.status(400).json({error : 'No account found'})
                }

                const message = 'login successfull';
                const response = { message, result };
                return res.status(200).json(response)

            });
        }

    });
});

app.post("/panier", (req, res) => {
    const sqlQuery = "SELECT id_panier, id_user, id_livre, paniers.quantite, titre, prix, auteur, nom, prenom, adresse, image FROM public.paniers join public.livres ON paniers.id_livre = livres.id join public.users ON paniers.id_user = users.id where id_user=$1;"
    id_user = req.body.id

    pool.query(sqlQuery, [id_user], (err, result) =>{
        if (err){
            return res.json({message:"lol non"})
        }
        return res.json(result.rows)
    })
})

app.post("/addLivrePanier", (req, res) => {
    const {id_user, id_livre, quantite} = req.body
    sqlQuery = "SELECT * FROM public.paniers where id_user = $1 and id_livre = $2;"
    const valuesCondition = [id_user, id_livre]

    pool.query(sqlQuery, valuesCondition, (err, result) => {
        if(err){
            return res.status(400).json({message : "error happened"})
        }
        if (result.rows.length === 0){
            sqlInsertBook = "INSERT INTO public.paniers(id_user, id_livre, quantite) VALUES ($1, $2, $3);"
            const valuesInsert = [id_user, id_livre, quantite]

            pool.query(sqlInsertBook, valuesInsert, (err, result) =>{
                if (err){
                    return res.status(400).json({message : "Failed to insert book to cart !!"})
                }
                return res.status(200).json({message : "Book added successfully to cart !!"})
            })
        }
        else{
            sqlUpdate = "UPDATE public.paniers SET quantite=quantite+$3 WHERE id_user = $1 and id_livre = $2;"
            valuesUpdate = [id_user, id_livre, quantite]

            pool.query(sqlUpdate, valuesUpdate, (err, result) =>{
                if (err){
                    return res.status(400).json({message : "Failed to update cart :("})
                }
                return res.status(200).json({message : "Cart updated successfully !"})
            })
        }

    })
})




app.post("/decrementQuantite", (req, res) => {

    const queryQuantity = "SELECT quantite FROM public.paniers where id_user = $1 and id_livre = $2;"
    const {id_user, id_livre} = req.body
    values = [id_user, id_livre]

    pool.query(queryQuantity, values, (err, result)=>{
        if(result.rows[0].quantite === 1){
            const delQuery = "DELETE FROM public.paniers WHERE id_user = $1 and id_livre = $2;"
            pool.query(delQuery, values, (err, result)=>{
                if (err){
                    return res.status(400).json({message : "erreur lors de la suuppression du livre"})
                }
                return res.status(200).json({message:"suppression réussie"})
            })
        }
        else{
            const sqlQuery = "UPDATE public.paniers SET quantite=quantite-1 WHERE id_user=$1 and id_livre = $2;"
            pool.query(sqlQuery, values, (err, result)=>{
                if (err){
                    return res.status(400).json({message : "pas pu update le panier"})
                }
                return res.status(200).json({message : "update du panier réussi"})
            })
        }
    } )

})

app.post("/incrementQuantite", (req, res) => {
    const {id_user, id_livre} = req.body
    const sqlQuery = "UPDATE public.paniers SET quantite=quantite+1 WHERE id_user=$1 and id_livre = $2;"

    values = [id_user, id_livre]
    pool.query(sqlQuery, values, (err, result)=>{
        if (err){
            return res.status(400).json({message : "echec de l'incrementation de la quantite"})
        }
        return res.status(200).json({message : "incrémentation réussie"})

    })
})


app.post("/passerCommande", (req, res) => {
    const id_user = req.body.id;
    const queryCommande = "INSERT INTO commandes (id_user, id_livre, time, date, quantite, num_commande) SELECT id_user, id_livre, current_time, current_date, quantite, (SELECT COALESCE(MAX(num_commande), 0) + 1 FROM commandes) AS num_commande FROM paniers WHERE id_user = $1 ORDER BY num_commande DESC;";

    pool.query(queryCommande, [id_user], (err, result) => {
        if (err){
            console.log(err)
            res.status(400).json({ message: "échec de la commande" });
        }
        else {
            const queryMiseAJourQuantite = "UPDATE public.livres SET stock = stock - paniers.quantite FROM paniers WHERE id = paniers.id_livre AND paniers.id_user = $1;"
            pool.query(queryMiseAJourQuantite, [id_user], (err, res) =>{
                if(err){
                    console.log(err)
                }
                else{
                    const querySupprimerPanier = "DELETE FROM public.paniers WHERE id_user = $1;";

                    pool.query(querySupprimerPanier, [id_user], (err, result) => {
                        if (err) {
                            console.log("erreur dans la suppression du panier !!");
                        } else {
                            console.log("suppression panier réussiiii");

                        }
                    });

                }
            })
            res.status(200).json({ message: "commande réussie !!" });
        }
    });
});

app.post("/getCommandes", (req, res)=>{
    id_user = req.body.id
    queryCommandes = "SELECT id_livre, date, \"time\", statut, commandes.quantite, num_commande, image, titre FROM public.commandes join public.livres ON commandes.id_livre = livres.id where id_user = $1 order by num_commande DESC;"
    pool.query(queryCommandes, [id_user], (err, result)=>{
        if(err){
            console.log(err)
            return res.status(400).json(err)
        }
        return res.json(result.rows)
    })
})


app.get("/getCommandesAdmin", (req, res) => {
    console.log("coucou2")
    const sqlQuery = "SELECT users.id, mail, prenom, nom, date,\"time\", statut, id_livre, commandes.quantite, num_commande, image, titre FROM public.commandes join public.livres ON commandes.id_livre = livres.id join public.users ON commandes.id_user = users.id order by num_commande DESC;";
    pool.query(sqlQuery, [], (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        res.json(result.rows)
    });
});



app.post("/deleteBook", (req, res)=>{
    id_book = req.body.id
    queryDel = "DELETE FROM public.livres WHERE id=$1;"
    pool.query(queryDel, [id_book], (err, result)=>{
        if(err){
            console.log(err)
            return res.status(400).json(err)
        }
        return res.status(200).json({message : "suppréssion du livre réussie"})

    })
})

app.post("/updateStock", (req, res)=>{
    const {id_book, nbStock} = req.body
    queryUpdate = "UPDATE public.livres SET stock=stock+($2) WHERE id = $1;"
    values = [id_book, nbStock]
    pool.query(queryUpdate, values, (err, result)=>{
        if(err){
            console.log(err)
        }
        return res.status(200).json({message : "Stock du livre mis à jour"})
    })

})

app.post("/updateStatutCommande", (req, res)=>{
    const {statut, num_commande} = req.body
    sqlQuery = "UPDATE public.commandes SET statut=$1 WHERE num_commande = $2;"
    values = [statut, num_commande]
    pool.query(sqlQuery, values, (err, result)=>{
        if (err){
            console.log(err)
        }
        return res.status(200).json({message : "update de statut commande réussi"})
    })

})

app.get("/meilleursClients", (req, res)=>{
    sqlQuery = "SELECT id_user, users.nom, users.prenom, users.mail, SUM(commandes.quantite) AS somme_quantite, SUM(livres.prix * commandes.quantite) AS produit_total FROM commandes join livres on id_livre = id join users on id_user = users.id group by id_user, users.nom, users.prenom, users.mail order by somme_quantite DESC;"
    pool.query(sqlQuery, [], (err, result)=>{
        if(err){
            console.log(err)
        }
        res.json(result.rows)
    })
})


app.get("/meilleursLivres", (req, res)=>{
    sqlQuery ="SELECT id_livre, titre, auteur,SUM(commandes.quantite) AS somme_quantite FROM commandes join livres on id_livre = id group by id_livre, titre, auteur order by somme_quantite DESC;"
    pool.query(sqlQuery, [], (err, result)=>{
        if(err){
            console.log(err)
        }
        res.json(result.rows)
    })
})



console.log("Connexion réussie à la base de données");

app.listen(3000, () => {
    console.log("Serveur démarré (http://localhost:3000/) !");
});

app.get("/", (req, res) => {
    res.send("Bonjour le monde...");
});