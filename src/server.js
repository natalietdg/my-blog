import express from 'express';
import bodyParser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

const app = express();
app.use(express.static(path.join(__dirname, '/build')));
app.use(express.json());
const withDB=async(operations, res) =>{
    try{
        const client = await MongoClient.connect('mongodb://localhost:27017', {useNewUrlParser: true, useUnifiedTopology: true});
        //what is asynchronous?
        //can use async await
        const db = client.db('my-blog-db');
        await operations(db);

        client.close();
    }
    catch(error){
        res.status(500).json({message: 'Error connecting to db', error});
    }
}

app.get('/api/articles/:name', async (req, res)=>{
    withDB(async(db)=>{
        const articlesName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name:articlesName});
        res.status(200).json(articleInfo);
    }, res);
  
    //what is asynchronous?
    //can use async await
});

app.post('/api/articles/:name/upvote', async (req, res)=>{
    withDB(async(db)=>{
        const articlesName = req.params.name;
        const articleInfo = await db.collection('articles').findOne({name: articlesName});
        await db.collection('articles').updateOne({name:articlesName}, {
            '$set':{
                upvotes: articleInfo.upvotes+1,
            },
        });
        const updatedArticleInfo = await db.collection('articles').findOne({name:articlesName});
        res.status(200).json(updatedArticleInfo);
        // articlesInfo[articlesName].upvotes +=1;
        // res.status(200).send(`${articlesName} now has ${articlesInfo[articlesName].upvotes} upvotes!`);
    }, res);
    
});

app.post('/api/articles/:name/add-comment', (req, res)=>{
    const{username, text} = req.body;
    const articlesName = req.params.name;
    withDB(async(db)=>{
        const articleInfo = await db.collection('articles').findOne({name:articlesName});
        //await db.collection('articles').updateOne
        await db.collection('articles').updateOne({name:articlesName},{
            '$set':{
                comments:articleInfo.comments.concat({username, text}),
            },
        });
        const updatedArticleInfo = db.collection('articles').findOne({name:articlesName});
        res.status(200).json(updatedArticleInfo);
    },res);
});

app.get('*', (req, res)=>{
    res.sendFile(path.join(__dirname + '/build/index.html'));
    //all requests that are not called by the api route should be passed onto our app
});
// app.get('/hello', (req, res)=>res.send('Hello!'));
// app.get('/hello/:name', (req, res)=>res.send(`Hello ${req.params.name}`));
// app.post('/hello', (req, res)=>res.send(`Hello ${req.body.name}!`));

app.listen(8000,()=> console.log('Listening on port 8000'));