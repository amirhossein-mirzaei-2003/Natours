const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const stripe = require('stripe')(process.env.STRIPE_SECRECT_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          'https://dkstatics-public.digikala.com/digikala-products/15278ad1b8bff766b95266c712546c399c5fa838_1745760214.jpg?x-oss-process=image/resize,m_lfit,h_800,w_800/format,webp/quality,q_90',
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3) send response
  res.status(200).json({
    status: 'success',
    session,
  });
});
