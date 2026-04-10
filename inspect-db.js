const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://sabbirdev001_db_user:0J9SjNIs5hcYsCpF@cluster0.8z8suen.mongodb.net/projectDatabase?retryWrites=true&w=majority";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const database = client.db('projectDatabase');
    const wordsCollection = database.collection('wordmanagements');
    
    console.log("Analyzing wordmanagements collection...");
    const sampleWords = await wordsCollection.find({}).limit(5).toArray();
    if (sampleWords.length === 0) {
      console.log("0 words found in DB.");
    } else {
      sampleWords.forEach((word) => {
        console.log(`Word: ${word.word}`);
        console.log(`- categoryWordId:`, word.categoryWordId, `(type: ${typeof word.categoryWordId})`);
        console.log(`- categoryType:`, word.categoryType, `(type: ${typeof word.categoryType})`);
        console.log(`- status:`, word.status);
      });
    }

    const categoriesCollection = database.collection('categorywords');
    console.log("\nAnalyzing categorywords collection...");
    const categories = await categoriesCollection.find({}).limit(3).toArray();
    categories.forEach((cat) => {
      console.log(`Category: ${cat.name} (_id: ${cat._id})`);
    });

  } finally {
    await client.close();
  }
}
run().catch(console.dir);
