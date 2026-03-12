import { Router } from 'express'

const healthRoute = Router()

healthRoute.get('/',(req, res)=>{
    res.status(200).send('Ok');
})

export default healthRoute