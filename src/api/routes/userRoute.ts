import express from 'express';
import {
  checkToken,
  userDeleteCurrent,
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
} from '../controllers/userController';
import {authenticate} from '../../middlewares';
import {body} from 'express-validator';
import {validationErrors} from '../../middlewares';

const router = express.Router();

router
  .route('/')
  .get(userListGet)
  .post(
    body('user_name').isString().isLength({min: 3}),
    body('email').isString().isEmail(),
    body('password').isString().isLength({min: 5}),
    validationErrors,
    userPost
  )
  .put(authenticate, userPutCurrent)
  .delete(authenticate, userDeleteCurrent);

router.get('/token', authenticate, checkToken);

router.route('/:id').get(userGet);

export default router;
