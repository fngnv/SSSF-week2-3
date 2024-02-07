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
import {User} from '../../types/DBTypes';
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
    if (!req.body.location) {
      req.body.location = res.locals.coords;
    }
    req.body.owner = res.locals.user._id;
    const cat = await catModel.create(req.body);
    res.status(200).json({message: 'Cat created', data: cat});
  } catch (err) {
    next(err);
  }
};

const catPut = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User)._id !== (req.body as Cat).owner) {
      throw new CustomError('Access restricted', 403);
    }
    req.body.location = res.locals.coords;
    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      })
      .select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', data: cat});
  } catch (err) {
    next(err);
  }
};

const catDelete = async (
  req: Request<{id: string}>,
  res: Response,
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
    res.json({message: 'Cat deleted', data: cat});
  } catch (err) {
    next(err);
  }
};

const catDeleteAdmin = async (
  req: Request<{id: string}>,
  res: Response,
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
    res.json({message: 'Cat deleted', data: cat});
  } catch (err) {
    next(err);
  }
};

const catPutAdmin = async (
  req: Request<{id: string}, {}, Omit<Cat, '_id'>>,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user && (req.user as User).role !== 'admin') {
      throw new CustomError('Access restricted', 403);
    }
    req.body.location = res.locals.coords;
    const cat = await catModel
      .findByIdAndUpdate(req.params.id, req.body, {new: true})
      .select('-__v');
    if (!cat) {
      throw new CustomError('Cat not found', 404);
    }
    res.json({message: 'Cat updated', data: cat});
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
    const [rightCorner1, rightCorner2] = topRight.split(',');
    const [leftCorner1, leftCorner2] = bottomLeft.split(',');
    console.log('RIGHT CORNER: ' + rightCorner1);
    console.log('LEFT CORNER: ' + leftCorner1);

    const cats = await catModel
      .find({
        location: {
          $geoWithin: {
            $box: [
              [Number(leftCorner1), Number(leftCorner2)],
              [Number(rightCorner1), Number(rightCorner2)],
            ],
          },
        },
      })
      .select('-__v');
    console.log('CATS IN BOUNDING BOX: ' + cats);
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
