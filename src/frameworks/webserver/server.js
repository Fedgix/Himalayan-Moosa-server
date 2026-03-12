// import app from "./app.js";
// import '../../config/env.js'
// import connectDb from "../../config/db.js";
// const port  = process.env.PORT

// connectDb()
// app.listen(port,()=>{
//     console.log(`Server running on port http://localhost:${port}, on env ${process.env.NODE_ENV}`)
// }) 

import app from "./app.js";
import '../../config/env.js';
import connectDb from "../../config/db.js";

const port = process.env.PORT || 8000;
console.log("Port:", port);
console.log("➡️  Starting server...");

connectDb()
  .then(() => {
    console.log("✅ DB connected successfully");
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}, on env ${process.env.NODE_ENV}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect DB:", err);
  });
