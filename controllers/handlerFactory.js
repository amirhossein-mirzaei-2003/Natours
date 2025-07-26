const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.deleteOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError(`can not find any document with this id`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (model) =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError(`can not find any document with this id`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document: doc,
      },
    });
  });

exports.createOne = (model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        document: newDoc,
      },
    });
  });

exports.getOne = (model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = model.findById(req.params.id);
    if (popOptions) query = model.findById(req.params.id).populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError(`can not find any document with this id`, 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        document: doc,
      },
    });
  });

exports.getAll = (model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(model.find(req.filters || {}), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    // Execute query
    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      result: docs.length,
      data: {
        documents: docs,
      },
    });
  });
