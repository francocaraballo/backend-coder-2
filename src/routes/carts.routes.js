import { Router } from "express";
import { getCart, createCart, insertProductCart, updateProductsCart, updateQuantityProductCart, deleteCart, deleteProductCart, purchaseCart } from "../controllers/cart.controller.js";
import { authorization } from "../middlewares/authorization.js";

const cartRouter = Router()

cartRouter.get('/:cid', authorization('user'), getCart );

cartRouter.post('/', authorization('user'), createCart );
cartRouter.post('/:cid/products/:pid', authorization('user'), insertProductCart);
cartRouter.post('/:cid/purchase', authorization('user'), purchaseCart);

cartRouter.put('/:cid', authorization('user'), updateProductsCart);
cartRouter.put('/:cid/products/:pid', authorization('user'), updateQuantityProductCart );

cartRouter.delete('/:cid', authorization('user'), deleteCart );
cartRouter.delete('/:cid/products/:pid', authorization('user'), deleteProductCart );

export default cartRouter;