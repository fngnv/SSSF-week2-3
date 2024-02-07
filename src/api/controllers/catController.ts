import {Types} from 'mongoose';
// TODO: create following functions:
// - catGetByUser - get all cats by current user id
// - catGetByBoundingBox - get all cats by bounding box coordinates (getJSON)
// - catPutAdmin - only admin can change cat owner --done?
// - catDeleteAdmin - only admin can delete cat --done?
// - catDelete - only owner can delete cat --done?
// - catPut - only owner can update cat --done?
// - catGet - get cat by id --done
// - catListGet - get all cats --done
// - catPost - create new cat --done
import {LoginUser, User} from '../../types/DBTypes';
import {
  MessageResponse,
  ErrorResponse,
  LoginResponse,
  UploadResponse,
} from '../../types/MessageTypes';
import {NextFunction, Request, Response} from 'express';
import catModel from '../models/catModel';
import {Cat} from '../../types/DBTypes';
import CustomError from '../../classes/CustomError';

const catGet = async (
  req: Request<{id: string}>,
  res: Response<Cat>,
  next: NextFunction
) => {
  try {
    const cat = await catModel.findById(req.params.id).populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json(cat);
  } catch (err) {
    next(err);
  }
};

const catListGet = async (
  req: Request,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await catModel
      .find()
      .populate({
        path: 'owner',
        select: '-__v -password -role',
      })
      .populate({
        path: 'location',
      });
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

const catPost = async (
  req: Request<{}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.body.location) {
      req.body.location = {
        coordinates: res.locals.coords,
        type: 'Point',
      };
    } else {
      req.body.location = {
        coordinates: res.locals.coords,
        type: 'Point',
      };
    }
    req.body.owner = res.locals.user._id;
    const cat = await catModel.create(req.body);
    console.log('ITS A CAT IN CATPOST!!!' + cat);
    /* req.body.location = {
      coordinates: [
        Number(req.body.location.coordinates[0]), // make sure it's a number
        Number(req.body.location.coordinates[1]),
      ],
      type: 'Point',
    };
    req.body.owner = res.locals.user._id;
    const cat = await catModel.create(req.body); */
    res.status(200).json({message: 'Cat created', data: cat});
  } catch (err) {
    next(err);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<UploadResponse>,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User)._id !== (req.body as Cat).owner) {
      throw new CustomError('Access restricted', 403);
    }
    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
      .select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', id: cat._id});
  } catch (err) {
    next(err);
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response<UploadResponse, {user: LoginUser}>,
  next: NextFunction
) => {
  try {
    const cat = (await catModel.findOneAndDelete({
      _id: req.params.id,
      owner: res.locals.user._id,
    })) as unknown as Cat;

    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted', id: cat._id});
    /* if (req.user && (req.user as User)._id !== (req.body as Cat).owner) {
      throw new CustomError('Access restricted', 403);
    }
    const cat = (await catModel.findByIdAndDelete(
      req.params.id
    )) as unknown as Cat;
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted', id: cat._id}); */
  } catch (err) {
    next(err);
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response<UploadResponse, {user: LoginUser}>,
  next: NextFunction
) => {
  try {
    if (res.locals.user.role !== 'admin') {
      throw new CustomError('Access restricted', 404);
    }
    const cat = (await catModel.findByIdAndDelete(
      req.params.id
    )) as unknown as Cat;
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat deleted', id: cat._id});
  } catch (err) {
    next(err);
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response<UploadResponse>,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User).role !== 'admin') {
      throw new CustomError('Access restricted', 403);
    }
    req.body.location = {
      ...req.body.location,
      type: 'Point',
    };
    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {new: true})
      .select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
  } catch (err) {
    next(err);
  }
};

const catGetByUser = async (
  req: Request<{}, {}, User>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const cats = await catModel.find({owner: res.locals.user._id}).populate({
      path: 'owner',
      select: '-__v -password -role',
    });
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

const catGetByBoundingBox = async (
  req: Request<{}, {}, {}, {topRight: string; bottomLeft: string}>,
  res: Response<Cat[]>,
  next: NextFunction
) => {
  try {
    const {topRight, bottomLeft} = req.query;
    const rightCorner = topRight.split(',');
    const leftCorner = bottomLeft.split(',');

    const cats = await catModel
      .find({
        location: {
          $geoWithin: {
            $box: [leftCorner, rightCorner],
          },
        },
      })
      .select('-__v');
    res.json(cats);
  } catch (err) {
    next(err);
  }
};

export {
  catGet,
  catListGet,
  catPost,
  catPut,
  catDelete,
  catDeleteAdmin,
  catPutAdmin,
  catGetByUser,
  catGetByBoundingBox,
};
