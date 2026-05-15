
import dotenv from "dotenv"


import { connectDB } from "./db/index.js";

import { app } from "./app.js";


dotenv.config({
    path:'./.env'
})



connectDB()
.then(()=>{
app.listen(process.env.PORT,()=>{
    console.log(`app is running on port ${process.env.PORT}`);
  app.on("error",(e)=>{
        console.log("this error from app.on event ",e);
        
  })  
})

})
.catch((err)=>{

    console.log("error in index.js file!!!!!!!!!!!!!!!!!!!!!!++++++++++++++",err);
    
})









        


/*

;(async()=>{
    try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      app.on("errror",(error)=>{
        console.log("error : ",error);
        throw error
        
      })

     

      app.listen(process.env.PORT,()=>{
        console.log(`app is listenning on port ${process.env.PORT}`)
        
      })
        
    } catch (error) {
        console.error("Error: ",error)
        throw error
    }
})()


*/




