import bcrypt from 'bcryptjs';
import {User, UserOutput} from '../../types/DBTypes';
import CustomError from '../../classes/CustomError';
import {NextFunction, Request, Response} from 'express';
import userModel from '../models/userModel';
const salt = bcrypt.genSaltSync(12);

const userGet = async (
  req: Request<{id: string}>,
  res: Response<UserOutput>,
  next: NextFunction
) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    console.log(user);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const userListGet = async (
  _req: Request,
  res: Response<UserOutput[]>,
  next: NextFunction
) => {
  try {
    const users = await userModel.find().select('-password -role');
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const userPost = async (
  req: Request<{}, {}, User>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.role) {
      req.body.role = 'user';
    }
    console.log(req.body.role + ' ITS A USER ROLE IN USER POST!!!');
    const userInput = {
      user_name: req.body.user_name,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, salt),
      role: req.body.role,
    };

    const user = await userModel.create(userInput);
    const userOutput: UserOutput = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };
    console.log(userOutput);
    res.status(200).json({message: 'User created', data: userOutput});
  } catch (err) {
    next(err);
  }
};

const userPutCurrent = async (
  req: Request<{}, {}, Omit<User, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = (res.locals.user as User)._id;
    const user = await userModel
      .findByIdAndUpdate(id, req.body, {
        new: true,
      })
      .select('-password -role');
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    res.json({message: 'User updated', data: user as UserOutput});
  } catch (err) {
    next(err);
  }
};

const userDeleteCurrent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (await userModel.findByIdAndDelete(
      res.locals.user._id
    )) as unknown as User;
    if (!user) {
      throw new CustomError('User not found', 404);
    }
    const userOutput: UserOutput = {
      _id: user._id,
      user_name: user.user_name,
      email: user.email,
    };
    res.json({message: 'User deleted', data: userOutput});
  } catch (err) {
    next(err);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!res.locals.user) {
    next(new CustomError('token not valid', 403));
  } else {
    const userOutput: UserOutput = {
      _id: (res.locals.user as User)._id,
      email: (res.locals.user as User).email,
      user_name: (res.locals.user as User).user_name,
    };
    res.json(userOutput);
  }
};

export {
  userGet,
  userListGet,
  userPost,
  userPutCurrent,
  userDeleteCurrent,
  checkToken,
};
