const express = require("express");
const app = express();
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')
const port = 3000;
const secret = process.env.SECRET;//fs.readFileSync(path.resolve(__dirname, "./secret.txt"),"UTF-8");
dbURI = process.env.URI;//"postgres://igmtxebf:dNVwGYR6Lmtxpei1fNI8M9CyqxNju4qa@drona.db.elephantsql.com:5432/igmtxebf";
const pool = new Pool({
  connectionString: dbURI
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use("/build", express.static(path.resolve(__dirname, "./build")));

app.get("/", (req, res) => {
  if (!req.cookies.authorization) return res.sendFile(path.resolve(__dirname, "./index.html"));
  let token = jwt.verify(req.cookies.authorization, secret, {algorithm: "HS256"});
  if (token.authorized) {
    let username = jwt.verify(req.cookies.username, secret, {algorithm: "HS256"});
    res.cookie("username_plain", username.username);
    return res.sendFile(path.resolve(__dirname, "./index.html"));//redirect("/getallthreads");
  }
})
app.delete("/deletePost/:postid", (req, res, next) => {
  pool.query(`
  DELETE FROM public.posts
  WHERE public.posts.post_id = $1
  `, [req.params.postid], (err, sqlres) => {
    if (err) return next(err)
    return res.status(200).send({"message": "post deleted"});
  })
})
app.get("/logout", (req, res) => {
  const cookiesArr = Object.keys(req.cookies);
  for (let i = 0; i < cookiesArr.length; i++) {
    res.clearCookie(cookiesArr[i]);
  }
  return res.status(200).redirect("/");
})
app.post("/signup", (req, res) => {
  const {username, password} = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  pool.query(`
  SELECT *
  FROM public.users as users
  WHERE users.username = $1;
  `, [username], (err, sqlres) => {
    if (err) {
      return next(err);
    }
    if (sqlres.rows.length === 0) {
      // this username is not taken
      pool.query(`
      INSERT INTO public.users (username, password)
      VALUES ($1, $2);
      `, [username, hash], (err, sqlres) => {
        if (err) {
          return next(err);
        }
        let token = jwt.sign({"authorized":"true"}, secret, {algorithm: "HS256", expiresIn: 60*60*12}); //expiresIn is in seconds
        res.cookie("authorization", token, {maxAge: 43200000, httpOnly: true});
        let usernameJWT = jwt.sign({"username":username}, secret, {algorithm: "HS256", expiresIn: 60*60*12})
        res.cookie("username", usernameJWT, {maxAge: 43200000, httpOnly: true}
        );
        return res.status(200).send({"message": "user created"});
      })
    }
  });
})

app.post("/login", (req, res) => {
  const {username, password} = req.body;
  pool.query(`
  SELECT password
  FROM public.users as users
  WHERE users.username = $1;
  `,[username], (err, sqlres) => {
    if (err) {
      return next(err);
    }
    let results = sqlres.rows;
    if (results.length === 0) return res.status(418).send({"message":"this is invalid"});
    let dbPassword = results[0].password;
    bcrypt.compare(password, dbPassword, (err, bool) => {
      if (bool) {
        
        let token = jwt.sign({"authorized":"true"}, secret, {algorithm: "HS256", expiresIn: 60*60*12}); //expiresIn is in seconds
        res.cookie("authorization", token, {maxAge: 43200000, httpOnly: true});
        let usernameJWT = jwt.sign({"username":username}, secret, {algorithm: "HS256", expiresIn: 60*60*12})
        res.cookie("username", usernameJWT, {maxAge: 43200000, httpOnly: true}
        );
        // res.set({"authorization": token});
        return res.status(200).send({"message": "you can log in"});
      }
      else {
        return res.status(418).send("this is wrong username/password");
      }
    })
  })
})

app.post("/makethread", (req, res) => {
  let token = jwt.verify(req.cookies.authorization, secret, {algorithm: "HS256"});
  if (!token.authorized) {
    return res.status(418).send("you need to be logged in to make a thread");
  }
  pool.query(`
  INSERT INTO public.threads (start_time, thread_title)
  VALUES (current_timestamp, $1);
  `,[req.body.thread_title] ,(err, sqlres) => {
    if (err) {
      return next(err);
    }
    return res.status(200).send({"message":"made a thread"});
  })
})

app.post("/makepost", (req, res) => {
  let token = jwt.verify(req.cookies.authorization, secret, {algorithm: "HS256"});
  if (!token.authorized) {
    return res.status(418).send("you need to be logged in to make a post");
  }
  const {thread_id, username, post_body} = req.body;
  console.log(username);
  pool.query(`
  SELECT user_id
  FROM public.users as users
  WHERE users.username = $1;
  `,[username] ,(err, sqlres) => {
    if (err) {
      return next(err);
    }
    const user_id = sqlres.rows[0].user_id;
    pool.query(`
    INSERT INTO public.posts (user_id, thread_id, post_time, post_body)
    VALUES ($1, $2, current_timestamp, $3);
    `,[user_id, thread_id, post_body],(err,sqlres)=>{
      if (err) {
        return next(err);
      }
      pool.query(`
      UPDATE public.threads
      SET last_post_time = current_timestamp
      WHERE public.threads.thread_id = $1;
      `,[thread_id], (err, sqlres)=>{
        if (err) {
          return next(err);
        }
        return res.status(200).send({"message":"made a post"});
      });
    });
  });
});

app.get("/getthread/:thread_id", (req, res) => {
  pool.query(`
  SELECT posts.*, users.username
  FROM public.posts as posts
  JOIN public.users as users
    ON users.user_id = posts.user_id 
  WHERE posts.thread_id = $1
  ORDER BY posts.post_time ASC;
  `,[req.params.thread_id], (err,sqlres) => {
    if (err) {
      return next(err);
    }
    return res.status(200).send(sqlres.rows);
  })
})

app.get("/getallthreads", (req, res) => {
  pool.query(`
  SELECT *, 
  CASE WHEN threads.last_post_time IS NULL THEN '01-01-1900'::timestamp 
  ELSE threads.last_post_time 
  END AS nonnulltime
  FROM public.threads as threads
  ORDER BY nonnulltime DESC  
  `
  ,(err, sqlres) => {
    if (err) {
      return next(err);
    }
    return res.status(200).send(sqlres.rows);
  })
})

app.use((err, req, res, next) => {
  console.log(err);
  return res.status(418).send(err);
})

app.listen(port,() => console.log(`server is listening on port ${port}`));
