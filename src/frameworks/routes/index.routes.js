import {Router} from 'express'
import healthRoute from "./health.routes.js";
import adminRouter from './admin.routes.js';
import bannerRouter from './banner.routes.js';
import categoryRouter from './category.route.js';
import productRouter from './product.routes.js';
import cartRouter from './cart.routes.js';
import userRouter from './user.routes.js';
import addressRouter from './address.route.js';
import searchRoutes from './search.routes.js';
import contactRouter from './contact.route.js';
import checkoutRouter from './checkout.routes.js';
import invoiceRouter from './invoice.routes.js';
import subscribeRouter from './subscribe.routes.js';
import vehicleRouter from './vehicle.routes.js';
import wishlistRouter from './wishlist.routes.js';
import uploadRouter from '../../modules/upload/routes/upload.routes.js';

const indexRouter = Router()

indexRouter.use('/health', healthRoute)
indexRouter.use('/admin', adminRouter)
indexRouter.use('/banner', bannerRouter)
indexRouter.use('/category', categoryRouter)
indexRouter.use('/product',productRouter)
indexRouter.use('/cart', cartRouter)
indexRouter.use('/users', userRouter);
indexRouter.use('/address', addressRouter)
indexRouter.use('/search', searchRoutes)
indexRouter.use('/contact', contactRouter)
indexRouter.use('/checkout',checkoutRouter)
indexRouter.use('/invoice',invoiceRouter)
indexRouter.use('/subscribe', subscribeRouter);
indexRouter.use('/vehicle', vehicleRouter);
indexRouter.use('/wishlist', wishlistRouter);
indexRouter.use('/upload', uploadRouter);

export default indexRouter